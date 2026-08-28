export type ChangeTestResult = {
  id: string;
  critical: boolean;
  passed: boolean;
};

export type ChangeGate = {
  decision: "Proceed with conditions" | "Do not proceed";
  criticalFailures: ChangeTestResult[];
  rule: string;
};

export function evaluateChangeGate(testResults: ChangeTestResult[]): ChangeGate;
