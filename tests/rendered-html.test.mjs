import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  assert.match(html, /Meet Maya, a support lead/i);
  assert.match(html, /What would you investigate first\?/i);
  assert.match(html, /Independent project · synthetic case/i);
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
});

test("keeps implementation status and production proposal explicit", async () => {
  const [page, readme, boundary] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../PUBLIC_PRIVATE_BOUNDARY.md", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Implemented prototype/);
  assert.match(page, /Proposed production path/);
  assert.match(page, /10\/15 cases passed/i);
  assert.match(page, /Gemini 3\.5 Flash-Lite/i);
  assert.match(readme, /Recorded Gemini experiment: completed/i);
  assert.match(boundary, /No visitor-triggered model calls/i);
  assert.doesNotMatch(page, /Navagis|Brinks/i);
});
