# Audited Gemini evaluation

- Source run: 2026-08-08T07-23-51-163Z
- Prompt: northstar-runtime-v1
- Rubric: 3.1
- Model: gemini-3.5-flash-lite
- Synthetic cases: 14/15
- Total controlled calls: 21
- Pilot decision: **Not ready for customer-facing use**

## Scorecard

| Measure | Result |
|---|---:|
| Route accuracy | 93% |
| Grounding coverage | 100% |
| Citation quality | 100% |
| Constraint compliance | 100% |
| Critical-check compliance | 93% |
| Recommendation stability | 67% |

## Review cases

- EV-02: expected `ask`, received `answer`; failed checks: routeMatch, request-verification.

## Audit note

The runtime-only suite evaluates Gemini acting as Northstar. Rubric 3.1 grades the recorded outputs without altering them, executes every named critical check, and treats evidence use as a structured citation decision rather than a required phrase in customer-facing prose.
