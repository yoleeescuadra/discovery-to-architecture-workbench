export function evaluateChangeGate(testResults) {
  const criticalFailures = testResults.filter(
    (testResult) => testResult.critical && !testResult.passed,
  );

  return {
    decision: criticalFailures.length === 0 ? "Proceed with conditions" : "Do not proceed",
    criticalFailures,
    rule: "Any critical authorization or duplicate-action failure keeps the gate closed.",
  };
}
