# Discovery-to-Architecture Workbench

Discovery-to-Architecture Workbench is an independent AI solution-architecture portfolio project by Yolee Escuadra.

It follows one relatable fictional case from an ambiguous customer need through discovery, evidence-backed architecture, evaluation design, and a cross-lens pilot-readiness decision.

**Live experience:** https://yoleeescuadra.github.io/discovery-to-architecture-workbench/

**Alternate hosted build:** https://discovery-architecture-workbench.yoleescdr.chatgpt.site

## Business question

Maya leads a support team with scattered guidance and repetitive questions. Should she approve an AI-assisted support pilot?

## What the experience demonstrates

- Human-centered discovery
- Inspectable keyword and topic-rule retrieval design
- Recorded Gemini response evaluation
- Deterministic routing, authorization, and citation checks
- Cross-lens readiness gates
- Transparent implemented-versus-proposed boundaries
- Executive readiness communication

## Current build status

- Interactive public experience: implemented for GitHub Pages and the alternate hosted build
- Synthetic source corpus: implemented
- Initial 15 designed-scenario evaluation suite: implemented
- Rule-based reference decision: implemented
- Recorded Gemini experiment: completed with Gemini 3.5 Flash-Lite (21 controlled calls; 14/15 primary cases passed under runtime prompt v1 and audited rubric v3.1)
- Live semantic or vector retrieval, metadata filtering and reranking: proposed production options, not implemented in the recorded test
- Expansion beyond the initial 15 designed scenarios: future iteration

The prototype compares each question and its known context with four approved documents. Keyword overlap and topic-specific rules rank the documents, and the top three are supplied to Gemini. Gemini then acts as the fictional Northstar support assistant. Deterministic code evaluates its action, evidence use, safety constraints, and scenario-specific checks. Fourteen of 15 designed scenarios passed overall. All 15 passed the evidence checks, while one identity-verification scenario remains under review because the primary trial answered safely instead of requesting verification. Visitors do not trigger live model calls. The project does not treat a recorded model run as production validation: the customer-facing pilot gate remains closed until the verification decision is corrected, live document search is validated, and the pilot measurement plan is defined.

## Project structure

- `01_foundation`: project purpose, audience, scope, and boundaries
- `02_synthetic_evidence`: four fictional approved knowledge documents
- `03_evaluation`: designed evaluation scenarios, recorded outputs and fixed checks
- `app`: interactive public experience
- `github-pages`: static browser entry used to build the GitHub Pages edition
- `docs`: generated static site published by GitHub Pages
- `public`: social preview and public assets

## Public and private boundary

All organizations, people, policies, account details, and evaluation cases are fictional. The project contains no employer material, real customer data, production architecture, credentials, or confidential metrics.

## Authorship

Yolee framed the scenario, defined the discovery model, designed the architecture and release gates, created the synthetic evidence, and developed the prototype using AI-assisted tools. This is a reference implementation, not a production customer deployment.
