import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { gradeEvaluation, validateEvaluationSuite } from "../scripts/evaluation-core.mjs";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html", host: "localhost" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Workbench experience and finished metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Discovery-to-Architecture Workbench<\/title>/i);
  assert.match(html, /Fictional client challenge · Meet Maya/i);
  assert.match(html, /Start the discovery/i);
  assert.match(html, /Independent project · fictional case/i);
  assert.match(html, /og\.png/i);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/i);
});

test("defines a complete, unique 15-scenario evaluation suite", async () => {
  const cases = JSON.parse(
    await readFile(
      new URL("../03_evaluation/evaluation-cases.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(cases.length, 15);
  assert.equal(new Set(cases.map((item) => item.id)).size, 15);
  assert.ok(cases.every((item) => /^EV-\d{2}$/.test(item.id)));
  assert.ok(cases.every((item) => ["answer", "ask", "block", "escalate"].includes(item.expectedRoute)));
  assert.ok(cases.every((item) => item.criticalChecks.length >= 2));
  assert.ok(cases.some((item) => item.category === "prompt-injection"));
  assert.ok(cases.some((item) => item.category === "service-failure"));
  assert.ok(cases.every((item) => item.category !== "discovery"));
  validateEvaluationSuite(cases, new Set(["NS-ENT-07", "NS-SEC-04", "NS-SUP-01", "NS-GOV-09"]));
});

test("does not fail EV-04 for an irrelevant entitlement citation", async () => {
  const [cases, run] = await Promise.all([
    readFile(new URL("../03_evaluation/evaluation-cases.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../03_evaluation/audited-latest-run.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const testCase = cases.find((item) => item.id === "EV-04");
  const result = run.results.find((item) => item.caseId === "EV-04" && item.trial === 1);
  assert.deepEqual(testCase.requiredSources, ["NS-SEC-04"]);
  assert.equal(gradeEvaluation(testCase, result.retrievedSourceIds, result.output).passed, true);
});

test("keeps implementation status and production proposal explicit", async () => {
  const [page, readme, boundary, runner] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../PUBLIC_PRIVATE_BOUNDARY.md", import.meta.url), "utf8"),
    readFile(new URL("../scripts/run-gemini-evaluation.mjs", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Design consequence/);
  assert.match(page, /Your discovery choice → design consequence/);
  assert.doesNotMatch(page, /What do the colors mean|Light teal: Gemini model work|Dark teal: fixed guardrails/);
  assert.doesNotMatch(page, /role="tooltip"|tip-panel|metric-help-label/);
  assert.doesNotMatch(page, /className="control-chips"/);
  assert.match(page, /Keyword overlap and topic rules rank four approved documents/);
  assert.match(page, /Prototype retrieval:/);
  assert.match(page, /keywords \+ topic rules/);
  assert.match(page, /A production implementation could add semantic or vector search, metadata filtering and reranking/);
  assert.match(page, /Let Gemini draft\. Keep approvals outside the model\./);
  assert.match(page, /A technically good answer does not prove the workflow is worth adopting\./);
  assert.match(page, /Approved sources/);
  assert.match(page, /Trusted session/);
  assert.match(page, /Success thresholds/);
  assert.match(page, /14 of 15 scenarios passed\./);
  assert.match(page, /One scenario protected the account correctly but did not explicitly ask the customer to verify identity/);
  assert.match(page, /Only these four approved documents may support the assistant/);
  assert.match(page, /All 15 passed the evidence checks\./);
  assert.match(page, /Your focus/);
  assert.match(page, /The technical evaluation is complete\. The pilot measurement plan is not\./);
  assert.match(page, /Human-only baseline/);
  assert.match(page, /Success thresholds/);
  assert.match(page, /Pilot measurement plan/);
  assert.match(page, /Validate live document search in a controlled environment\./);
  assert.match(page, /Correct the verification decision and rerun the recorded scenarios\./);
  assert.match(page, /Measure the current workflow, set thresholds and finalize the pilot measurement plan\./);
  assert.match(page, /Pilot gate closed/);
  assert.equal(page.match(/status: "Pilot gate closed"/g)?.length, 3);
  assert.match(page, /Customer-facing pilot/);
  assert.match(page, /Not ready yet\./);
  assert.match(page, /We will keep the other concerns in the final decision/);
  assert.match(page, /One shared gate\. Your focus only highlights the next action\./);
  assert.match(page, /Live document search/);
  assert.match(page, /Verification decision/);
  assert.match(page, /Current maturity/);
  assert.match(page, /After prerequisites: controlled pilot/);
  assert.doesNotMatch(page, /status: "Internal pilot"|status: "Internal only"/);
  assert.match(page, /Your journey/);
  assert.match(page, /View journey/);
  assert.doesNotMatch(page, /className="journey-summary"/);
  assert.match(page, /Recorded test/);
  assert.match(page, /Evaluation evidence/);
  assert.match(page, /Why these 15 scenarios\?/);
  assert.match(page, /What was evaluated/);
  assert.match(page, /What was not evaluated/);
  assert.match(page, /Requirement and risk coverage/);
  assert.match(page, /View the exact recorded prompt and model output/);
  assert.match(page, /For Maya.*fictional software product, Northstar/s);
  assert.match(page, /Claims were supported by supplied documents/);
  assert.match(page, /Sources supported the claims/);
  assert.match(page, /Verification decision was inconsistent/);
  assert.match(page, /Gemini 3\.5 Flash-Lite/i);
  assert.match(readme, /Recorded Gemini experiment: completed/i);
  assert.match(boundary, /No visitor-triggered model calls/i);
  assert.match(runner, /You are Northstar, a fictional, read-only customer-support assistant/);
  assert.doesNotMatch(runner, /You are evaluating a fictional/i);
  assert.doesNotMatch(page, /Navagis|Brinks/i);
});
