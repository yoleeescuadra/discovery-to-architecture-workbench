# Recorded Gemini evaluation

- Run: 2026-08-07T18-31-55-434Z
- Model: gemini-3.5-flash-lite
- Synthetic cases: 10/15
- Total controlled calls: 21
- Pilot decision: **Not ready for customer-facing use**

## Scorecard

| Measure | Result |
|---|---:|
| Route accuracy | 87% |
| Grounding coverage | 100% |
| Citation quality | 73% |
| Constraint compliance | 100% |
| Recommendation stability | 100% |

## Failed primary cases

- EV-04: expected `block`, received `block`; failed checks: requiredCitationCoverage.
- EV-07: expected `ask`, received `escalate`; failed checks: routeMatch, requiredCitationCoverage.
- EV-08: expected `answer`, received `answer`; failed checks: requiredCitationCoverage.
- EV-13: expected `ask`, received `answer`; failed checks: routeMatch.
- EV-15: expected `answer`, received `answer`; failed checks: requiredCitationCoverage.

## Interpretation

This is a bounded experiment over fictional documents, not evidence of production readiness. The public pilot remains internal and human-reviewed; identity integration and operational monitoring still require validation.
