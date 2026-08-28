import assert from "node:assert/strict";
import test from "node:test";
import { evaluateChangeGate } from "../app/change-control-engine.mjs";

test("closes the release gate when one critical change test fails", () => {
  const result = evaluateChangeGate([
    { id: "CC-01", critical: false, passed: true },
    { id: "CC-04", critical: true, passed: false },
  ]);

  assert.equal(result.decision, "Do not proceed");
  assert.deepEqual(result.criticalFailures.map((failure) => failure.id), ["CC-04"]);
});

test("allows conditional progress only when every critical test passes", () => {
  const result = evaluateChangeGate([
    { id: "CC-02", critical: true, passed: true },
    { id: "CC-03", critical: true, passed: true },
  ]);

  assert.equal(result.decision, "Proceed with conditions");
  assert.equal(result.criticalFailures.length, 0);
});
