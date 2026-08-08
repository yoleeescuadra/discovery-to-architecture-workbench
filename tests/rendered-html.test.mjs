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

test("defines a complete, unique 15-case evaluation suite", async () => {
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

  assert.match(page, /Design result/);
  assert.match(page, /People decide whether the pilot advances\./);
  assert.match(page, /Approved sources/);
  assert.match(page, /Trusted session/);
  assert.match(page, /Success thresholds/);
  assert.match(page, /All 15 cases passed the evidence checks\./);
  assert.match(page, /one separate identity-routing case still needs review/i);
  assert.match(page, /14 of 15 cases passed/i);
  assert.match(page, /The model test does not yet prove business value\./);
  assert.match(page, /Validate live retrieval before customer use\./);
  assert.match(page, /Keep customer access blocked until verification is repeatable\./);
  assert.match(page, /Establish the baseline before starting a pilot\./);
  assert.match(page, /current human-only workflow first/i);
  assert.match(page, /Gemini 3\.5 Flash-Lite/i);
  assert.match(readme, /Recorded Gemini experiment: completed/i);
  assert.match(boundary, /No visitor-triggered model calls/i);
  assert.match(runner, /You are Northstar, a fictional, read-only customer-support assistant/);
  assert.doesNotMatch(runner, /You are evaluating a fictional/i);
  assert.doesNotMatch(page, /Navagis|Brinks/i);
});
