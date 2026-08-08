import fs from "node:fs/promises";
import path from "node:path";
import { gradeEvaluation, summarizeEvaluation, validateEvaluationSuite } from "./evaluation-core.mjs";

const root = process.cwd();
const evaluationDir = path.join(root, "03_evaluation");
const sourceRunPath = path.join(evaluationDir, "latest-recorded-run.json");
const auditedRunPath = path.join(evaluationDir, "audited-latest-run.json");
const repeatCaseIds = new Set(["EV-02", "EV-05", "EV-10"]);

const [sourceRun, cases, evidenceFiles] = await Promise.all([
  fs.readFile(sourceRunPath, "utf8").then(JSON.parse),
  fs.readFile(path.join(evaluationDir, "evaluation-cases.json"), "utf8").then(JSON.parse),
  fs.readdir(path.join(root, "02_synthetic_evidence")),
]);
const approvedSourceIds = new Set();
for (const filename of evidenceFiles.filter((name) => name.endsWith(".md"))) {
  const content = await fs.readFile(path.join(root, "02_synthetic_evidence", filename), "utf8");
  const id = content.match(/Document ID:\s*([^\s]+)/)?.[1];
  if (!id) throw new Error(`Document ID missing in ${filename}`);
  approvedSourceIds.add(id);
}
validateEvaluationSuite(cases, approvedSourceIds);

const caseById = new Map(cases.map((testCase) => [testCase.id, testCase]));
const results = sourceRun.results.map((result) => {
  const testCase = caseById.get(result.caseId);
  if (!testCase) throw new Error(`Recorded result has no case definition: ${result.caseId}`);
  return {
    ...result,
    category: testCase.category,
    expectedRoute: testCase.expectedRoute,
    grade: gradeEvaluation(testCase, result.retrievedSourceIds, result.output),
  };
});
const auditedRun = {
  ...sourceRun,
  runId: `${sourceRun.runId}-audited-rubric-v3-1`,
  sourceRunId: sourceRun.runId,
  auditedAt: new Date().toISOString(),
  rubricVersion: "3.1",
  summary: summarizeEvaluation(results, repeatCaseIds),
  results,
};

const failures = results.filter((result) => result.trial === 1 && !result.grade.passed);
const markdown = `# Audited Gemini evaluation\n\n- Source run: ${auditedRun.sourceRunId}\n- Prompt: ${auditedRun.promptVersion}\n- Rubric: ${auditedRun.rubricVersion}\n- Model: ${auditedRun.model}\n- Synthetic cases: ${auditedRun.summary.metrics.casesPassed}\n- Total controlled calls: ${results.length}\n- Pilot decision: **${auditedRun.summary.pilotDecision}**\n\n## Scorecard\n\n| Measure | Result |\n|---|---:|\n| Route accuracy | ${auditedRun.summary.metrics.routeAccuracy}% |\n| Grounding coverage | ${auditedRun.summary.metrics.groundingCoverage}% |\n| Citation quality | ${auditedRun.summary.metrics.citationQuality}% |\n| Constraint compliance | ${auditedRun.summary.metrics.constraintCompliance}% |\n| Critical-check compliance | ${auditedRun.summary.metrics.criticalCheckCompliance}% |\n| Recommendation stability | ${auditedRun.summary.metrics.recommendationStability}% |\n\n## Review cases\n\n${failures.length ? failures.map((result) => `- ${result.caseId}: expected \`${result.expectedRoute}\`, received \`${result.output.route}\`; failed checks: ${result.grade.failedChecks.join(", ")}.`).join("\n") : "No primary cases failed the deterministic release checks."}\n\n## Audit note\n\nThe runtime-only suite evaluates Gemini acting as Northstar. Rubric 3.1 grades the recorded outputs without altering them, executes every named critical check, and treats evidence use as a structured citation decision rather than a required phrase in customer-facing prose.\n`;

await fs.writeFile(auditedRunPath, `${JSON.stringify(auditedRun, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(evaluationDir, "RECORDED_RESULTS.md"), markdown, "utf8");
console.log(JSON.stringify(auditedRun.summary, null, 2));
