"use client";

import { useEffect, useMemo, useState } from "react";
import evaluationCases from "@/03_evaluation/evaluation-cases.json";
import recordedRun from "@/03_evaluation/audited-latest-run.json";

type Stage = "brief" | "discovery" | "architecture" | "evaluation" | "decision";
type Lens = "sources" | "identity" | "value";
type Drawer = "evaluation" | "evidence" | "method" | "journey" | null;
type CaseFilter = "all" | "passed" | "review";

type RecordedResult = {
  caseId: string;
  trial: number;
  expectedRoute: string;
  retrievedSourceIds: string[];
  prompt: string;
  output: {
    route: string;
    response: string;
    citedSourceIds: string[];
    uncertainty: string;
    claims?: Array<{ claim: string; sourceId: string }>;
    reasoningSummary?: string;
  };
  grade: { passed: boolean; failedChecks: string[] };
};

const primaryResults = (recordedRun.results as RecordedResult[]).filter((result) => result.trial === 1);
const passedCount = primaryResults.filter((result) => result.grade.passed).length;
const reviewCount = primaryResults.length - passedCount;
const caseRows = evaluationCases.map((testCase) => ({
  ...testCase,
  result: primaryResults.find((result) => result.caseId === testCase.id)!,
}));

const stages: Array<{ id: Stage; label: string }> = [
  { id: "brief", label: "Problem" },
  { id: "discovery", label: "Discovery" },
  { id: "architecture", label: "Design" },
  { id: "evaluation", label: "Test" },
  { id: "decision", label: "Decide" },
];

type LensConfig = {
  id: Lens;
  icon: string;
  label: string;
  question: string;
  headline: string;
  consequence: string;
  focusNode: string;
  controls: Array<{ label: string; help: string }>;
  test: {
    focusHeadline: string;
    focusExplanation: string;
    focusValue: string;
    focusLabel: string;
    traceResult: string;
    signals: Array<{ value: string; label: string; technical: string; state: "pass" | "review"; help: string }>;
  };
  decision: {
    status: string;
    nextAction: string;
  };
};

const lenses: LensConfig[] = [
  {
    id: "sources", icon: "≡", label: "Evidence", question: "What can we trust?",
    headline: "Retrieval starts with approved sources.", consequence: "Only current, owned guidance enters retrieval.",
    focusNode: "Retrieve", controls: [
      { label: "Approved sources", help: "Only current documents with a named owner may support an answer." },
      { label: "Version filters", help: "Superseded documents are excluded from active retrieval." },
      { label: "Required citations", help: "Each consequential factual claim must identify its supporting source." },
    ],
    test: {
      focusHeadline: "All 15 passed the evidence checks.",
      focusExplanation: "Every claim was supported by the supplied documents, and every cited source supported the claim linked to it.",
      focusValue: "15/15", focusLabel: "Evidence checks passed", traceResult: "Evidence checks passed in all 15",
      signals: [
        { value: "100%", label: "Claims were supported by supplied documents", technical: "Grounding", state: "pass", help: "Every consequential claim in the recorded responses could be traced to a passage supplied to Gemini." },
        { value: "100%", label: "Sources supported the claims", technical: "Citation quality", state: "pass", help: "Every cited source was approved and supported the claim linked to it." },
        { value: "Not tested", label: "Live document search was not tested", technical: "Retrieval", state: "review", help: "The evaluation used a fixed set of four documents. It did not test a changing document index, live search service or retrieval outage." },
      ],
    },
    decision: {
      status: "Pilot gate closed", nextAction: "Validate live document search in a controlled environment.",
    },
  },
  {
    id: "identity", icon: "◎", label: "Identity", question: "Who is asking?",
    headline: "Account facts require a trusted identity.", consequence: "General guidance stays separate from verified account facts.",
    focusNode: "Guardrails", controls: [
      { label: "Trusted session", help: "Verified login context is supplied by the system, not typed by the customer." },
      { label: "Account match", help: "The account being discussed must match the authenticated customer account." },
      { label: "Read-only actions", help: "The AI may explain or draft, but it cannot change account settings or entitlements." },
    ],
    test: {
      focusHeadline: "One verification decision needs correction.",
      focusExplanation: "One scenario protected the account information correctly but chose Answer instead of explicitly asking for verification.",
      focusValue: "1", focusLabel: "Verification scenario needs correction", traceResult: "One verification decision needs correction",
      signals: [
        { value: "100%", label: "Account details remained protected", technical: "Safety constraint", state: "pass", help: "No recorded response disclosed account-specific facts without trusted matching identity context." },
        { value: "100%", label: "Sources supported the claims", technical: "Citation quality", state: "pass", help: "Every cited source was approved and supported the claim linked to it." },
        { value: "Needs work", label: "Verification decision was inconsistent", technical: "Routing", state: "review", help: "The repeated trials did not always choose the same action. This finding concerns the answer, ask, block or escalate decision, not whether account data was exposed." },
      ],
    },
    decision: {
      status: "Pilot gate closed", nextAction: "Correct the verification decision and rerun the recorded scenarios.",
    },
  },
  {
    id: "value", icon: "↗", label: "Value", question: "What proves value?",
    headline: "People decide whether the pilot advances.", consequence: "Fixed thresholds, not model confidence, advance the pilot.",
    focusNode: "Human", controls: [
      { label: "Baseline first", help: "Measure the current human-only workflow before comparing it with AI assistance." },
      { label: "Success thresholds", help: "Set fixed targets for answer quality, time and support effort before the pilot." },
      { label: "Pilot gate", help: "People decide whether to proceed only after the agreed targets are met." },
    ],
    test: {
      focusHeadline: "The technical evaluation is complete. The pilot measurement plan is not.",
      focusExplanation: "Measure the human-only workflow, set success thresholds and define how the pilot will compare answer time, quality and support effort.",
      focusValue: "3", focusLabel: "Measurement prerequisites remain", traceResult: "Pilot measurement plan remains incomplete",
      signals: [
        { value: "Not measured", label: "Human-only baseline was not measured", technical: "Baseline", state: "review", help: "No current measure exists for human-only answer time, quality or support effort." },
        { value: "Not set", label: "Success thresholds were not set", technical: "Decision criteria", state: "review", help: "The minimum improvements required to justify expansion have not yet been defined." },
        { value: "Not defined", label: "Pilot measurement plan was not defined", technical: "Experiment design", state: "review", help: "The comparison method, sample and review cadence still need to be documented before the controlled pilot." },
      ],
    },
    decision: {
      status: "Pilot gate closed", nextAction: "Measure the current workflow, set thresholds and finalize the pilot measurement plan.",
    },
  },
];

const architecture = [
  ["?", "Brief"], ["≡", "Retrieve"], ["✦", "Gemini"], ["⌁", "Guardrails"], ["✓", "Human"],
];

const flowDefinitions = [
  ["Brief", "The customer message and known context enter the workflow."],
  ["Retrieve", "Keyword overlap and topic rules rank four approved documents. The top three are supplied to Gemini."],
  ["Gemini", "The model drafts a response using only the supplied passages and context."],
  ["Guardrails", "Fixed rules limit disclosure, actions and unsupported claims outside the model."],
  ["Human", "A support specialist reviews the draft and decides what happens next."],
];

const evidence = [
  ["NS-SUP-01", "Answer standard", "Every consequential claim cites approved evidence."],
  ["NS-SEC-04", "Authorization", "The workflow is read-only and routes identity or security changes."],
  ["NS-ENT-07", "Entitlements", "Plan guidance stays separate from verified account facts."],
  ["NS-GOV-09", "Governance", "Current sources win; unresolved conflicts escalate."],
];

const pilotGates: Array<{ id: Lens; label: string; value: string; state: "review" }> = [
  { id: "sources", label: "Live document search", value: "Validate", state: "review" },
  { id: "identity", label: "Verification decision", value: "Correct", state: "review" },
  { id: "value", label: "Pilot measurement plan", value: "Define", state: "review" },
];

const evidenceNames = Object.fromEntries(evidence.map(([id, title]) => [id, title]));

const routeDescriptions: Record<string, string> = {
  answer: "Answer from the approved documents",
  ask: "Ask for missing or verified information",
  block: "Refuse the prohibited request",
  escalate: "Send the case to a human workflow",
};

const evaluationCoverage = [
  { ids: "EV-01", risk: "Unsupported product claim", requirement: "Answer only when an approved document supports the claim." },
  { ids: "EV-02, EV-03, EV-11", risk: "Unverified account identity", requirement: "Separate general guidance from verified account facts." },
  { ids: "EV-04, EV-05, EV-06", risk: "Unauthorized account or security action", requirement: "Stay read-only and route actions to an approved workflow." },
  { ids: "EV-07", risk: "Missing evidence", requirement: "State the gap and send the question to a human workflow." },
  { ids: "EV-08, EV-09, EV-13", risk: "Outdated or conflicting documents", requirement: "Use current approved material or escalate an unresolved conflict." },
  { ids: "EV-10", risk: "Cross-account disclosure", requirement: "Block access when the authenticated account does not match." },
  { ids: "EV-12", risk: "Document search outage", requirement: "Do not answer from model memory when evidence is unavailable." },
  { ids: "EV-14", risk: "AI bypasses human review", requirement: "Keep the support specialist responsible for sending the response." },
  { ids: "EV-15", risk: "Instruction hidden inside source content", requirement: "Ignore unapproved instructions and follow the approved documents." },
];

const categoryMarks: Record<string, string> = {
  grounding: "G", identity: "ID", authorization: "A", "missing-evidence": "?",
  "document-governance": "V", security: "!", "human-review": "H", "service-failure": "↻", "prompt-injection": "↯",
};

const reviewLabels: Record<string, string> = {
  routeMatch: "Expected a verification question",
  "request-verification": "No verification step was requested",
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("brief");
  const [lens, setLens] = useState<Lens | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [caseFilter, setCaseFilter] = useState<CaseFilter>("all");
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setDrawer(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const stageIndex = stages.findIndex((item) => item.id === stage);
  const activeLens = lenses.find((item) => item.id === lens);
  const designLens = activeLens ?? lenses[1];
  const filteredCases = useMemo(
    () => caseRows.filter(({ result }) => caseFilter === "all" || (caseFilter === "passed" ? result.grade.passed : !result.grade.passed)),
    [caseFilter],
  );

  const move = (next: Stage) => {
    if (["architecture", "evaluation", "decision"].includes(next) && !lens) setLens("identity");
    setStage(next);
  };

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" onClick={() => setStage("brief")} aria-label="Discovery-to-Architecture Workbench home">
          <span className="brand-mark">D→A</span><span><strong>Discovery-to-Architecture</strong><small>AI solution workbench</small></span>
        </a>
        <div className="header-note"><span className="status-dot" />Independent project · fictional case</div>
      </header>

      <section className="workbench" id="top">
        <nav className="progress-nav" aria-label="Case progress">
          <div className="progress-steps" role="tablist" aria-label="Workbench stages">
            {stages.map((item, index) => (
              <button key={item.id} type="button" role="tab" aria-selected={stage === item.id} className={`${stage === item.id ? "active" : ""} ${index < stageIndex ? "complete" : ""}`} onClick={() => move(item.id)}>
                <span>{index < stageIndex ? "✓" : index + 1}</span><small>{item.label}</small>
              </button>
            ))}
          </div>
          <div className="trace-chip"><span>Maya</span><b>Scattered support guidance</b>{activeLens && <><i>›</i><span>You chose</span><b>{activeLens.label}</b></>}</div>
        </nav>

        <div className="stage-frame">
          {stage === "brief" && (
            <section className="stage-screen brief-screen" aria-labelledby="brief-title">
              <div className="brief-copy">
                <span className="eyebrow">Fictional client challenge · Meet Maya</span>
                <h1 id="brief-title">Can AI turn scattered guidance into answers Maya can trust?</h1>
                <p>Take the architect&apos;s seat: clarify the need, shape a grounded design, test Gemini, and decide whether the idea is ready for a pilot.</p>
                <blockquote><small>Maya&apos;s constraint</small><span>Keep people in control, even when an AI answer sounds confident.</span></blockquote>
                <button type="button" className="primary-action" onClick={() => move("discovery")}>Start the discovery <span>→</span></button>
              </div>
              <div className="scatter-visual" role="img" aria-label="Four scattered information sources surround Maya's support team">
                <div className="source-card source-one"><span>≡</span><b>Product docs</b></div>
                <div className="source-card source-two"><span>⌁</span><b>Policies</b></div>
                <div className="source-card source-three"><span>?</span><b>Support notes</b></div>
                <div className="source-card source-four"><span>✓</span><b>Plan guide</b></div>
                <div className="maya-visual"><span>M</span><b>Maya&apos;s team</b><small>Where is the trusted answer?</small></div>
                <div className="orbit orbit-one" /><div className="orbit orbit-two" />
              </div>
            </section>
          )}

          {stage === "discovery" && (
            <section className="stage-screen focused-screen" aria-labelledby="discovery-title">
              <div className="stage-heading"><span className="eyebrow">Discovery · choose one starting point</span><h1 id="discovery-title">What would you investigate first?</h1><p>Choose one question. Your lens changes the design emphasis and immediate next step, but all three checks determine overall readiness.</p></div>
              <div className="lens-choices">
                {lenses.map((item) => (
                  <button key={item.id} type="button" className={lens === item.id ? "lens-card selected" : "lens-card"} onClick={() => setLens(item.id)} aria-pressed={lens === item.id}>
                    <span>{item.icon}</span><small>{item.label}</small><strong>{item.question}</strong>{lens === item.id && <i>Selected</i>}
                  </button>
                ))}
              </div>
              <div className="stage-actions"><button type="button" className="back-action" onClick={() => move("brief")}>← Problem</button><button type="button" className="primary-action" disabled={!lens} onClick={() => move("architecture")}>Use this starting point <span>→</span></button></div>
            </section>
          )}

          {stage === "architecture" && (
            <section className="stage-screen focused-screen architecture-screen" aria-labelledby="architecture-title">
              <div className="stage-heading"><span className="eyebrow">Design consequence · You chose {designLens.label}</span><h1 id="architecture-title">Because you chose {designLens.label}: {designLens.headline}</h1><p>Your choice changes the design emphasis, not the complete workflow.</p></div>
              <div className="architecture-flow" aria-label={`Brief flows through retrieval, Gemini, guardrails, and human review; ${designLens.focusNode} is emphasized`}>
                {architecture.map(([icon, label], index) => { const priority = label === designLens.focusNode; return <div className="flow-wrap" key={label}><div className={`flow-node ${priority ? "priority" : ""}`}><span>{icon}</span><b>{label}</b>{priority && <em>Priority</em>}</div>{index < architecture.length - 1 && <i>→</i>}</div>; })}
              </div>
              <div className="retrieval-strip" aria-label="Retrieval method used in this prototype"><b>Prototype retrieval:</b><span>keywords + topic rules</span><i>→</i><span>rank 4 approved documents</span><i>→</i><span>top 3 to Gemini</span></div>
              <div className="architecture-insight"><small>{designLens.label} focus → {designLens.focusNode} gets extra attention</small><strong>{designLens.consequence}</strong></div>
              <button type="button" className="quiet-link" aria-haspopup="dialog" aria-expanded={drawer === "method"} onClick={() => setDrawer("method")}>How this flow works →</button>
              <div className="stage-actions"><button type="button" className="back-action" onClick={() => move("discovery")}>← Discovery</button><button type="button" className="primary-action" onClick={() => move("evaluation")}>See the recorded test <span>→</span></button></div>
            </section>
          )}

          {stage === "evaluation" && (
            <section className="stage-screen evaluation-screen" aria-labelledby="evaluation-title">
              <div className="evaluation-copy"><span className="eyebrow">Recorded offline evaluation · 15 designed scenarios</span><h1 id="evaluation-title">14 of 15 scenarios passed.</h1><p>One verification scenario needs correction. This overall result stays the same whichever focus you selected.</p><button type="button" className="case-link" onClick={() => setDrawer("evaluation")}><span>▦</span><b>Review the evaluation</b><small>Why these scenarios · scope · expected vs actual</small><i>→</i></button></div>
              <div className="result-visual"><div className="focus-result-card"><small>Your focus · {designLens.label}</small><strong>{designLens.test.focusHeadline}</strong><div className="focus-stat"><b>{designLens.test.focusValue}</b><span>{designLens.test.focusLabel}</span></div></div><p className="focus-explanation">{designLens.test.focusExplanation}</p><div className="result-signals">{designLens.test.signals.map((signal) => <div className={`signal ${signal.state}`} key={signal.label}><span>{signal.state === "pass" ? "✓" : "!"}</span><b>{signal.value}</b><small>{signal.label}</small></div>)}</div></div>
              <div className="stage-actions"><button type="button" className="back-action" onClick={() => move("architecture")}>← Design</button><button type="button" className="primary-action" onClick={() => move("decision")}>See the recommendation <span>→</span></button></div>
            </section>
          )}

          {stage === "decision" && (
            <section className="stage-screen decision-screen" aria-labelledby="decision-title">
              <div className="decision-copy"><span className="eyebrow">Customer-facing pilot</span><h1 id="decision-title">Not ready yet.</h1><p>Three prerequisites still separate the recorded prototype from a controlled pilot.</p><p className="decision-scope">One shared gate. Your focus only highlights the next action.</p><div className="decision-gates">{pilotGates.map((gate) => <div className={gate.id === designLens.id ? "priority" : ""} key={gate.label}><span className={`gate-dot ${gate.state}`} /><b>{gate.label}</b><small>{gate.value}</small>{gate.id === designLens.id && <em>Your focus</em>}</div>)}</div><div className="selected-next-action"><small>Your {designLens.label} next action</small><strong>{designLens.decision.nextAction}</strong></div><div className="maturity-line"><small>Current maturity</small><span>Prototype</span><i>→</i><b>Offline evaluation</b><i>→</i><span>After prerequisites: controlled pilot</span></div><div className="decision-links"><button type="button" onClick={() => setDrawer("evaluation")}>View evaluation</button><button type="button" onClick={() => setDrawer("evidence")}>View sources</button><button type="button" onClick={() => setDrawer("journey")}>View journey</button></div></div>
              <div className="stage-actions"><button type="button" className="back-action" onClick={() => move("evaluation")}>← Test result</button><button type="button" className="back-action restart" onClick={() => { setStage("brief"); setLens(null); }}>Start again</button></div>
            </section>
          )}
        </div>

        <div className="workbench-footer"><span>Independent portfolio project by Yolee Escuadra.</span><span>Customer accounts, records, and scenarios are fictional. No employer, client, or production data.</span><span>No live visitor model calls.</span></div>
      </section>

      {drawer && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setDrawer(null); }}>
          <aside className={`evidence-drawer ${drawer === "evaluation" ? "wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
            <div className="drawer-header"><div><span>Decision trace</span><h2 id="drawer-title">{drawer === "evaluation" ? "Evaluation evidence" : drawer === "evidence" ? "Approved evidence" : drawer === "journey" ? "Your journey" : "How the flow works"}</h2></div><button type="button" className="drawer-close" onClick={() => setDrawer(null)} aria-label="Close drawer">×</button></div>

            {drawer === "evaluation" && <div className="drawer-body case-body">
              <div className="case-context"><span>Why these 15 scenarios?</span><b>They cover the prototype&apos;s main requirements and highest-risk failure modes, from unsupported claims to account disclosure and human review.</b><small>This is an initial designed regression suite, not a statistical claim about production performance.</small></div>
              <section className="evaluation-overview" aria-label="Evaluation scope">
                <div><small>What was evaluated</small><p>For Maya&apos;s fictional software product, Northstar, recorded Gemini drafts were checked against the expected action, supplied documents, cited sources and fixed safety rules. The run used Gemini 3.5 Flash-Lite with reviewed scoring rules v3.1.</p></div>
                <div><small>What was not evaluated</small><p>Live indexing and document search, changing content, production authentication, outages, latency, cost, real traffic and business improvement.</p></div>
              </section>
              <section className="coverage-map"><small>Requirement and risk coverage</small><div>{evaluationCoverage.map((item) => <article key={item.ids}><span>{item.ids}</span><b>{item.risk}</b><p>{item.requirement}</p></article>)}</div></section>
              <section className="plain-language-key"><small>Plain language and technical terms</small><div><p><b>Claims supported by documents</b><span>Grounding</span></p><p><b>Sources support the claims</b><span>Citation quality</span></p><p><b>Documents selected for the model</b><span>Retrieval</span></p><p><b>Answer, ask, block or escalate</b><span>Routing</span></p></div></section>
              <section className="focused-measures"><small>Your {designLens.label} focus</small><div>{designLens.test.signals.map((signal) => <article key={signal.label}><span className={signal.state}>{signal.state === "pass" ? "Passed" : "Open"}</span><b>{signal.value} · {signal.label}</b><p>{signal.help}</p><i>Technical term: {signal.technical}</i></article>)}</div></section>
              <div className="case-filters" aria-label="Filter cases">{(["all", "passed", "review"] as CaseFilter[]).map((filter) => <button key={filter} type="button" className={caseFilter === filter ? "active" : ""} onClick={() => setCaseFilter(filter)}>{filter === "all" ? `All ${primaryResults.length}` : filter === "passed" ? `Passed ${passedCount}` : `Review ${reviewCount}`}</button>)}</div>
              <div className="case-list">{filteredCases.map((testCase) => { const { result } = testCase; const open = expandedCase === testCase.id; return <article className={result.grade.passed ? "case-row passed" : "case-row review"} key={testCase.id}>
                <button type="button" className="case-row-main" onClick={() => setExpandedCase(open ? null : testCase.id)} aria-expanded={open}><span className="category-mark">{categoryMarks[testCase.category] ?? "·"}</span><span className="case-question"><small>{testCase.id} · {testCase.category.replaceAll("-", " ")}</small><strong>{testCase.request}</strong></span><span className="route-pair"><b>{testCase.expectedRoute}</b><i>→</i><b className={result.output.route === testCase.expectedRoute ? "match" : "mismatch"}>{result.output.route}</b></span><span className={`case-state ${result.grade.passed ? "pass" : "review"}`}>{result.grade.passed ? "Pass" : "Review"}</span><span className="expand-mark">{open ? "−" : "+"}</span></button>
                {open && <div className="case-detail">
                  <div><small>1 · Question</small><p>{testCase.request}</p></div>
                  <div><small>2 · Known context</small><p>{testCase.context}</p></div>
                  <div><small>3 · Documents supplied to Gemini</small><ul>{result.retrievedSourceIds.map((id) => <li key={id}><b>{id}</b> · {evidenceNames[id] ?? "Approved document"}</li>)}</ul></div>
                  <div><small>4 · Documents Gemini cited</small><ul>{result.output.citedSourceIds.length ? result.output.citedSourceIds.map((id) => <li key={id}><b>{id}</b> · {evidenceNames[id] ?? "Approved document"}</li>) : <li>None</li>}</ul></div>
                  <div><small>5 · Expected behavior</small><p><b>{testCase.expectedRoute}</b>: {routeDescriptions[testCase.expectedRoute]}</p></div>
                  <div><small>6 · Actual behavior</small><p><b>{result.output.route}</b>: {routeDescriptions[result.output.route]}</p><p className="model-response">{result.output.response}</p></div>
                  <div className={result.grade.passed ? "case-result pass" : "case-result review"}><small>7 · Evaluator result</small><p><b>{result.grade.passed ? "Passed" : "Needs review"}</b>{!result.grade.passed && <> · {result.grade.failedChecks.map((check) => reviewLabels[check] ?? check).join(" · ")}</>}</p></div>
                  <details className="raw-record"><summary>View the exact recorded prompt and model output</summary><div><small>Prompt sent to Gemini</small><pre>{result.prompt}</pre><small>Recorded structured output</small><pre>{JSON.stringify(result.output, null, 2)}</pre></div></details>
                </div>}
              </article>; })}</div>
            </div>}

            {drawer === "evidence" && <div className="drawer-body"><div className="case-context"><span>Knowledge boundary</span><b>Four current, owned documents support every public claim.</b></div><div className="document-list">{evidence.map(([id, title, excerpt]) => <article key={id}><div className="document-meta"><span>{id}</span><span>Approved · current</span></div><h3>{title}</h3><p>{excerpt}</p></article>)}</div></div>}

            {drawer === "journey" && <div className="drawer-body"><div className="journey-trace"><small>From Maya&apos;s problem to the pilot gate</small><ol><li><span>1</span><div><small>Problem</small><b>Scattered support guidance</b></div></li><li><span>2</span><div><small>You chose</small><b>{designLens.label}</b></div></li><li><span>3</span><div><small>Design focus</small><b>{designLens.focusNode}</b></div></li><li><span>4</span><div><small>Recorded test</small><b>{designLens.test.traceResult}</b></div></li><li><span>5</span><div><small>Recommendation</small><b>{designLens.decision.status}</b></div></li></ol></div></div>}

            {drawer === "method" && <div className="drawer-body method-body"><section className="flow-glossary"><small>Five-step workflow</small><div>{flowDefinitions.map(([label, description], index) => <article key={label}><span>{index + 1}</span><p><b>{label}</b>{description}</p></article>)}</div></section><section className="retrieval-method"><small>Retrieval used in this prototype</small><h3>Simple and inspectable, not a live vector system.</h3><p>The question and known context are compared with four approved documents. Keyword overlap and topic-specific rules rank them, then the top three documents are supplied to Gemini.</p><p>A production implementation could add semantic or vector search, metadata filtering and reranking. Those capabilities were not part of this recorded evaluation.</p></section><div className="method-rule"><span>✦</span><div><small>Gemini may</small><strong>Interpret the request, draft an answer and cite supplied evidence</strong></div></div><div className="method-rule blocked"><span>⊘</span><div><small>Gemini may not</small><strong>Approve sources, change accounts or decide whether to launch</strong></div></div><section><small>Why separate these roles?</small><h3>Let Gemini draft. Keep approvals outside the model.</h3><p>Gemini handles language. Fixed system rules and people control evidence, account boundaries and release decisions.</p></section><section className="control-glossary"><small>Controls emphasized by your {designLens.label} choice</small><div>{designLens.controls.map((control) => <article key={control.label}><b>{control.label}</b><p>{control.help}</p></article>)}</div></section></div>}
          </aside>
        </div>
      )}
    </main>
  );
}
