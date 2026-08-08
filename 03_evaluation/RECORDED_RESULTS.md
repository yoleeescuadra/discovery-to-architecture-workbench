# Audited Gemini evaluation

- Source run: 2026-08-07T18-31-55-434Z
- Rubric: 2.0
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
| Recommendation stability | 100% |

## Review cases

- EV-13: expected `ask`, received `answer`; failed checks: routeMatch, ownership-gap-found, freshness-gap-found.

## Audit note

Rubric 2.0 removes source requirements that did not support a claim made in the answer, aligns missing-evidence escalation with the approved support standard, and executes every named critical check. The original model outputs and token records remain unchanged.
