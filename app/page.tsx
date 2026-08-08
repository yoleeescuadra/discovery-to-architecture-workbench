"use client";

import { useEffect, useMemo, useState } from "react";
import evaluationCases from "@/03_evaluation/evaluation-cases.json";
import recordedRun from "@/03_evaluation/audited-latest-run.json";

type Stage = "brief" | "discovery" | "architecture" | "evaluation" | "decision";
type Lens = "sources" | "identity" | "value";
type Drawer = "cases" | "evidence" | "method" | null;
type CaseFilter = "all" | "passed" | "review";

type RecordedResult = {
  caseId: string;
  trial: number;
  expectedRoute: string;
  retrievedSourceIds: string[];
  output: { route: string; response: string; citedSourceIds: string[]; uncertainty: string };
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
  controls: string[];
  test: {
    headline: string;
    explanation: string;
    scoreLabel: string;
    signals: Array<{ value: string; label: string; state: "pass" | "review" }>;
  };
  decision: {
    status: string;
    headline: string;
    explanation: string;
    gates: Array<{ label: string; value: string; state: "pass" | "review" }>;
  };
};

const lenses: LensConfig[] = [
  {
    id: "sources", icon: "≡", label: "Evidence", question: "What can we trust?",
    headline: "Retrieval starts with approved sources.", consequence: "Only current, owned guidance enters retrieval.",
    focusNode: "Retrieve", controls: ["Approved sources", "Version filters", "Required citations"],
    test: {
      headline: "All 15 cases passed the evidence checks.",
      explanation: "Grounding and citations passed in every case. Overall, 14 of 15 cases passed because one separate identity-routing case still needs review.",
      scoreLabel: "overall cases passed",
      signals: [
        { value: "100%", label: "Grounding coverage", state: "pass" },
        { value: "100%", label: "Citation quality", state: "pass" },
        { value: "Not tested", label: "Live retrieval", state: "review" },
      ],
    },
    decision: {
      status: "Internal pilot", headline: "Validate live retrieval before customer use.",
      explanation: "Proceed with a human-reviewed internal pilot. Prove source ownership, version filtering and retrieval failure handling before customer exposure.",
      gates: [
        { label: "Source policy", value: "Ready", state: "pass" },
        { label: "Citations", value: "Ready", state: "pass" },
        { label: "Live retrieval", value: "Validate", state: "review" },
      ],
    },
  },
  {
    id: "identity", icon: "◎", label: "Identity", question: "Who is asking?",
    headline: "Account facts require a trusted identity.", consequence: "General guidance stays separate from verified account facts.",
    focusNode: "Guardrails", controls: ["Trusted session", "Account match", "Read-only actions"],
    test: {
      headline: "14 of 15 test cases passed. One identity-routing case needs review.",
      explanation: "Gemini protected the account data, but answered instead of asking the customer to verify identity.",
      scoreLabel: "technical cases",
      signals: [
        { value: "100%", label: "Account protection", state: "pass" },
        { value: "100%", label: "Citation quality", state: "pass" },
        { value: "67%", label: "Route stability", state: "review" },
      ],
    },
    decision: {
      status: "Internal only", headline: "Keep customer access blocked until verification is repeatable.",
      explanation: "Run a human-reviewed internal iteration. Make identity verification routing repeatable before direct customer exposure.",
      gates: [
        { label: "Account safety", value: "Ready", state: "pass" },
        { label: "Citations", value: "Ready", state: "pass" },
        { label: "Identity routing", value: "Fix", state: "review" },
      ],
    },
  },
  {
    id: "value", icon: "↗", label: "Value", question: "What proves value?",
    headline: "People decide whether the pilot advances.", consequence: "Fixed thresholds, not model confidence, advance the pilot.",
    focusNode: "Human", controls: ["Baseline first", "Success thresholds", "Pilot gate"],
    test: {
      headline: "The model test does not yet prove business value.",
      explanation: "Safety and grounding were measured, but there is no baseline for resolution time, answer quality or support effort.",
      scoreLabel: "technical cases",
      signals: [
        { value: "14/15", label: "Technical cases", state: "pass" },
        { value: "Not set", label: "Business baseline", state: "review" },
        { value: "Not set", label: "Success threshold", state: "review" },
      ],
    },
    decision: {
      status: "Pre-pilot", headline: "Establish the baseline before starting a pilot.",
      explanation: "Measure the current human-only workflow first. Then define the success thresholds that a later internal pilot must meet.",
      gates: [
        { label: "Technical safety", value: "Ready", state: "pass" },
        { label: "Baseline", value: "Measure now", state: "review" },
        { label: "Success threshold", value: "Define next", state: "review" },
      ],
    },
  },
];

const architecture = [
  ["?", "Brief"], ["≡", "Retrieve"], ["✦", "Gemini"], ["⌁", "Guardrails"], ["✓", "Human"],
];

const evidence = [
  ["NS-SUP-01", "Answer standard", "Every consequential claim cites approved evidence."],
  ["NS-SEC-04", "Authorization", "The workflow is read-only and routes identity or security changes."],
  ["NS-ENT-07", "Entitlements", "Plan guidance stays separate from verified account facts."],
  ["NS-GOV-09", "Governance", "Current sources win; unresolved conflicts escalate."],
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
          <div className="trace-chip"><span>Maya</span><b>Scattered support guidance</b>{activeLens && <><i>›</i><span>Your lens</span><b>{activeLens.label}</b></>}</div>
        </nav>

        <div className="stage-frame">
          {stage === "brief" && (
            <section className="stage-screen brief-screen" aria-labelledby="brief-title">
              <div className="brief-copy">
                <span className="eyebrow">Fictional client challenge · Meet Maya</span>
                <h1 id="brief-title">Can AI turn scattered guidance into answers Maya can trust?</h1>
                <p>Take the architect&apos;s seat: clarify the need, shape a grounded design, test Gemini, and make the pilot call.</p>
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
              <div className="stage-heading"><span className="eyebrow">Discovery · one choice</span><h1 id="discovery-title">What would you investigate first?</h1><p>Your choice changes the design focus, test interpretation and pilot decision.</p></div>
              <div className="lens-choices">
                {lenses.map((item) => (
                  <button key={item.id} type="button" className={lens === item.id ? "lens-card selected" : "lens-card"} onClick={() => setLens(item.id)} aria-pressed={lens === item.id}>
                    <span>{item.icon}</span><small>{item.label}</small><strong>{item.question}</strong>{lens === item.id && <i>Selected</i>}
                  </button>
                ))}
              </div>
              <div className="stage-actions"><button type="button" className="back-action" onClick={() => move("brief")}>← Problem</button><button type="button" className="primary-action" disabled={!lens} onClick={() => move("architecture")}>Apply this lens <span>→</span></button></div>
            </section>
          )}

          {stage === "architecture" && (
            <section className="stage-screen focused-screen architecture-screen" aria-labelledby="architecture-title">
              <div className="stage-heading"><span className="eyebrow">Design result · {designLens.label} lens</span><h1 id="architecture-title">{designLens.label} lens selected: {designLens.headline}</h1><p>{designLens.consequence} The {designLens.focusNode} stage receives added emphasis.</p></div>
              <div className="architecture-flow" aria-label={`Brief flows through retrieval, Gemini, guardrails, and human review; ${designLens.focusNode} is emphasized`}>
                {architecture.map(([icon, label], index) => { const priority = label === designLens.focusNode; return <div className="flow-wrap" key={label}><div className={`flow-node ${label === "Gemini" ? "model" : ""} ${label === "Guardrails" ? "control" : ""} ${priority ? "priority" : ""}`}><span>{icon}</span><b>{label}</b>{priority && <em>Priority</em>}</div>{index < architecture.length - 1 && <i>→</i>}</div>; })}
              </div>
              <div className="architecture-insight"><span>{designLens.icon}</span><div><small>{designLens.label} lens → {designLens.focusNode} priority</small><strong>{designLens.consequence}</strong><div className="control-chips">{designLens.controls.map((control) => <i key={control}>{control}</i>)}</div></div></div>
              <button type="button" className="quiet-link" onClick={() => setDrawer("method")}>Why this separation matters →</button>
              <div className="stage-actions"><button type="button" className="back-action" onClick={() => move("discovery")}>← Discovery</button><button type="button" className="primary-action" onClick={() => move("evaluation")}>Test the design <span>→</span></button></div>
            </section>
          )}

          {stage === "evaluation" && (
            <section className="stage-screen evaluation-screen" aria-labelledby="evaluation-title">
              <div className="evaluation-copy"><span className="eyebrow">Test result · {designLens.label} lens</span><h1 id="evaluation-title">{designLens.test.headline}</h1><p>{designLens.test.explanation}</p><button type="button" className="case-link" onClick={() => setDrawer("cases")}><span>▦</span><b>Inspect all 15 cases</b><small>Expected vs actual · response · review reason</small><i>→</i></button></div>
              <div className="result-visual"><div className="score-ring" aria-label="14 of 15 cases passed"><span><b>14</b>/15<small>{designLens.test.scoreLabel}</small></span></div><div className="result-signals">{designLens.test.signals.map((signal) => <div className={`signal ${signal.state}`} key={signal.label}><span>{signal.state === "pass" ? "✓" : "!"}</span><b>{signal.value}</b><small>{signal.label}</small></div>)}</div></div>
              <div className="stage-actions"><button type="button" className="back-action" onClick={() => move("architecture")}>← Design</button><button type="button" className="primary-action" onClick={() => move("decision")}>Make the pilot call <span>→</span></button></div>
            </section>
          )}

          {stage === "decision" && (
            <section className="stage-screen decision-screen" aria-labelledby="decision-title">
              <div className="decision-symbol">↗<span>{designLens.decision.status}</span></div>
              <div className="decision-copy"><span className="eyebrow">Pilot decision · {designLens.label} lens</span><h1 id="decision-title">{designLens.decision.headline}</h1><p>{designLens.decision.explanation}</p><div className="decision-gates">{designLens.decision.gates.map((gate) => <div key={gate.label}><span className={`gate-dot ${gate.state}`} /><b>{gate.label}</b><small>{gate.value}</small></div>)}</div><div className="decision-links"><button type="button" onClick={() => setDrawer("cases")}>View test cases</button><button type="button" onClick={() => setDrawer("evidence")}>View sources</button></div></div>
              <div className="stage-actions"><button type="button" className="back-action" onClick={() => move("evaluation")}>← Test result</button><button type="button" className="back-action restart" onClick={() => { setStage("brief"); setLens(null); }}>Start again</button></div>
            </section>
          )}
        </div>

        <div className="workbench-footer"><span>Independent portfolio project by Yolee Escuadra.</span><span>Customer accounts, records, and scenarios are fictional. No employer, client, or production data.</span><span>No live visitor model calls.</span></div>
      </section>

      {drawer && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setDrawer(null); }}>
          <aside className={`evidence-drawer ${drawer === "cases" ? "wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
            <div className="drawer-header"><div><span>Decision trace</span><h2 id="drawer-title">{drawer === "cases" ? "15 recorded test cases" : drawer === "evidence" ? "Approved evidence" : "Why this architecture"}</h2></div><button type="button" className="drawer-close" onClick={() => setDrawer(null)} aria-label="Close drawer">×</button></div>

            {drawer === "cases" && <div className="drawer-body case-body">
              <div className="case-context"><span>What is being tested</span><b>Gemini acts as Northstar; deterministic controls grade its response.</b><small>Gemini 3.5 Flash-Lite · runtime prompt · audited rubric v3.1</small></div>
              <div className="case-filters" aria-label="Filter cases">{(["all", "passed", "review"] as CaseFilter[]).map((filter) => <button key={filter} type="button" className={caseFilter === filter ? "active" : ""} onClick={() => setCaseFilter(filter)}>{filter === "all" ? `All ${primaryResults.length}` : filter === "passed" ? `Passed ${passedCount}` : `Review ${reviewCount}`}</button>)}</div>
              <div className="case-list">{filteredCases.map((testCase) => { const { result } = testCase; const open = expandedCase === testCase.id; return <article className={result.grade.passed ? "case-row passed" : "case-row review"} key={testCase.id}>
                <button type="button" className="case-row-main" onClick={() => setExpandedCase(open ? null : testCase.id)} aria-expanded={open}><span className="category-mark">{categoryMarks[testCase.category] ?? "·"}</span><span className="case-question"><small>{testCase.id} · {testCase.category.replaceAll("-", " ")}</small><strong>{testCase.request}</strong></span><span className="route-pair"><b>{testCase.expectedRoute}</b><i>→</i><b className={result.output.route === testCase.expectedRoute ? "match" : "mismatch"}>{result.output.route}</b></span><span className={`case-state ${result.grade.passed ? "pass" : "review"}`}>{result.grade.passed ? "Pass" : "Review"}</span><span className="expand-mark">{open ? "−" : "+"}</span></button>
                {open && <div className="case-detail"><div><small>Known context</small><p>{testCase.context}</p></div><div><small>Gemini response</small><p>{result.output.response}</p></div>{!result.grade.passed && <div className="review-reason"><small>Why this needs review</small><p>{result.grade.failedChecks.map((check) => reviewLabels[check] ?? check).join(" · ")}</p></div>}<div className="detail-meta"><span><small>Retrieved</small>{result.retrievedSourceIds.join(" · ")}</span><span><small>Cited</small>{result.output.citedSourceIds.length ? result.output.citedSourceIds.join(" · ") : "None"}</span></div></div>}
              </article>; })}</div>
            </div>}

            {drawer === "evidence" && <div className="drawer-body"><div className="case-context"><span>Knowledge boundary</span><b>Four current, owned documents support every public claim.</b></div><div className="document-list">{evidence.map(([id, title, excerpt]) => <article key={id}><div className="document-meta"><span>{id}</span><span>Approved · current</span></div><h3>{title}</h3><p>{excerpt}</p></article>)}</div></div>}

            {drawer === "method" && <div className="drawer-body method-body"><div className="method-rule"><span>✦</span><div><small>Gemini may</small><strong>Interpret, draft, cite</strong></div></div><div className="method-rule blocked"><span>⊘</span><div><small>Gemini may not</small><strong>Approve sources, authorize actions, release the pilot</strong></div></div><section><small>Design choice</small><h3>Separate probabilistic work from deterministic control.</h3><p>The model proposes. Evidence, account boundaries, and release thresholds remain externally enforced.</p></section></div>}
          </aside>
        </div>
      )}
    </main>
  );
}
