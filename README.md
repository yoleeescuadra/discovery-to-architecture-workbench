# Discovery-to-Architecture Workbench

Discovery-to-Architecture Workbench is an independent AI solution-architecture portfolio project by Yolee Escuadra.

It follows one relatable fictional case from an ambiguous customer need through discovery, evidence-backed architecture, evaluation design, and a conditional pilot decision.

**Live experience:** https://yoleeescuadra.github.io/discovery-to-architecture-workbench/

**Alternate hosted build:** https://discovery-architecture-workbench.yoleescdr.chatgpt.site

## Business question

Maya leads a support team with scattered guidance and repetitive questions. Should she approve an AI-assisted support pilot?

## What the experience demonstrates

- Human-centered discovery
- Separation of facts, assumptions, and unanswered questions
- Approved-source retrieval design
- Model-generated structured recommendations
- Deterministic authorization and citation controls
- Evaluation-driven release gates
- Executive pilot communication

## Current build status

- Interactive public experience: implemented for GitHub Pages and the alternate hosted build
- Synthetic source corpus: implemented
- Initial 15-case evaluation suite: implemented
- Rule-based reference decision: implemented
- Recorded Gemini experiment: completed with Gemini 3.5 Flash-Lite (21 controlled calls; 14/15 primary cases passed under runtime prompt v1 and audited rubric v3.1)
- Expansion beyond the initial 15-case pilot suite: future iteration

Gemini acts as the fictional Northstar support assistant; deterministic code evaluates its route, evidence use, safety constraints, and case-specific checks. One identity-verification case remains under review because the primary trial answered safely instead of requesting verification, while two repeat trials routed correctly. Visitors do not trigger live model calls. The project does not treat a model run as production validation: the customer-facing release gate remains closed.

## Project structure

- `01_foundation`: project purpose, audience, scope, and boundaries
- `02_synthetic_evidence`: four fictional approved knowledge documents
- `03_evaluation`: initial evaluation cases and critical checks
- `app`: interactive public experience
- `github-pages`: static browser entry used to build the GitHub Pages edition
- `docs`: generated static site published by GitHub Pages
- `public`: social preview and public assets

## Public and private boundary

All organizations, people, policies, account details, and evaluation cases are fictional. The project contains no employer material, real customer data, production architecture, credentials, or confidential metrics.

## Authorship

Yolee framed the scenario, defined the discovery model, designed the architecture and release gates, created the synthetic evidence, and developed the prototype using AI-assisted tools. This is a reference implementation, not a production customer deployment.
