# Discovery-to-Architecture Workbench

## Purpose

Discovery-to-Architecture Workbench is an independent AI solution-design portfolio project built around a relatable question:

> Maya leads a customer-support team with scattered guidance and repetitive questions. Should she approve an AI pilot?

The project demonstrates a path from an ambiguous customer need to structured discovery, an evidence-backed architecture recommendation, measurable evaluation criteria, and a cross-lens pilot-readiness decision.

The Change Control Lab extends the same method after the initial design. It traces one fictional refund-automation request through boundary analysis, designed tests, a deterministic release decision, and a controlled rollback plan.

## Primary audience

- Technical teams evaluating AI-assisted support systems
- Technical presales and customer-engineering practitioners
- Business stakeholders considering a retrieval-based AI pilot
- Readers who have experienced inconsistent support answers or scattered internal knowledge

## Public experience

Visitors:

1. Meet Maya and read her short business brief.
2. Choose the discovery lens they would investigate first.
3. See how that lens changes the architecture emphasis.
4. See the same 14 of 15 overall evaluation result, then inspect the focused finding through that lens.
5. See the same overall pilot gate with a lens-specific next action.
6. Inspect one consolidated evaluation drawer with rationale, coverage, scope, technical terms, recorded prompts, model outputs, and expected-versus-actual results.
7. Switch to Change Control and inspect how a new request changes permissions, failure cases, release readiness, and recovery.

## V1 scope

- One fictional customer scenario
- Four synthetic approved source documents
- Fifteen designed evaluation scenarios
- One bounded architecture recommendation
- One consolidated evaluation drawer plus focused source and workflow drawers
- One rule-based pilot decision
- Static public experience with no visitor-triggered model calls
- One fictional change request with five designed change tests
- One deterministic change-release gate and rollback plan

## Implemented versus proposed

### Implemented in V1

- Interactive discovery-to-decision experience
- Synthetic source corpus
- Designed evaluation scenarios and deterministic release gates
- Recorded-run interface and provenance model
- Responsive static delivery
- Interactive change-control walkthrough

### Proposed production architecture

- Managed application runtime
- Versioned retrieval index
- Gemini structured output
- Deterministic authorization and citation controls
- Request logging, evaluation, and monitoring

The implemented retrieval method is intentionally simple: question and context are scored against four approved documents using keyword overlap and topic-specific rules, then the top three are supplied to Gemini. Semantic or vector search, metadata filtering and reranking are production options, not capabilities exercised by the recorded evaluation. The public interface must not imply that proposed production components are already deployed.

## Authorship statement

Yolee Escuadra framed the scenario, defined the discovery model, designed the architecture and release gates, created the synthetic evidence, and developed the prototype using AI-assisted tools. This is an independent reference implementation, not a production customer deployment.

## Safety and confidentiality boundary

- No employer information
- No real customer request or transcript
- No production architecture or metric
- No real account, identity, or support data
- No confidential documentation
- No visitor-supplied data
