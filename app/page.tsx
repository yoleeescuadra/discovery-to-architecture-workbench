"use client";

import { useEffect, useMemo, useState } from "react";
import evaluationCases from "@/03_evaluation/evaluation-cases.json";
import recordedRun from "@/03_evaluation/recorded-run-2026-08-07T18-31-55-434Z.json";

type Lens = "sources" | "identity" | "value";
type Drawer = "cases" | "evidence" | "method" | null;
type CaseFilter = "all" | "passed" | "review";

type RecordedResult = {
  caseId: string;
  trial: number;
  expectedRoute: string;
  retrievedSourceIds: string[];
  output: {
    route: string;
    response: string;
    citedSourceIds: string[];
    uncertainty: string;
  };
  grade: { passed: boolean };
};

const primaryResults = (recordedRun.results as RecordedResult[]).filter(
  (result) => result.trial === 1,
);

const caseRows = evaluationCases.map((testCase) => ({
  ...testCase,
  result: primaryResults.find((result) => result.caseId === testCase.id)!,
}));

const lenses: Array<{ id: Lens; icon: string; label: string; question: string; emphasis: string }> = [
  {
    id: "sources",
    icon: "≡",
    label: "Evidence",
    question: "What can we trust?",
    emphasis: "Versioned retrieval becomes the first control: only current, owned guidance enters the active index.",
  },
  {
    id: "identity",
    icon: "◎",
    label: "Identity",
    question: "Who is asking?",
    emphasis: "General guidance stays separate from verified account facts; account-changing actions remain outside the AI path.",
  },
  {
    id: "value",
    icon: "↗",
    label: "Value",
    question: "What proves value?",
    emphasis: "A fixed test suite and release thresholds decide whether the pilot advances—not model confidence.",
  },
];

const architecture = [
  ["01", "?", "Brief", "Need + context"],
  ["02", "≡", "Retrieve", "Approved only"],
  ["03", "✦", "Gemini", "Draft + cite"],
  ["04", "⌁", "Guardrails", "Block + route"],
  ["05", "✓", "Human", "Review + send"],
];

const metrics = [
  ["Route", 87],
  ["Grounding", 100],
  ["Citations", 73],
  ["Constraints", 100],
  ["Stability", 100],
] as const;

const evidence = [
  ["NS-SUP-01", "Answer standard", "Every consequential claim cites approved evidence."],
  ["NS-SEC-04", "Authorization", "Read-only workflow; identity and security changes are routed."],
  ["NS-ENT-07", "Entitlements", "Plan guidance is separate from verified account facts."],
  ["NS-GOV-09", "Governance", "Current owned sources win; unresolved conflicts escalate."],
];

const categoryMarks: Record<string, string> = {
  grounding: "G",
  identity: "ID",
  authorization: "A",
  "missing-evidence": "?",
  "document-governance": "V",
  security: "!",
  discovery: "D",
  "service-failure": "↻",
  "prompt-injection": "↯",
};

export default function Home() {
  const [lens, setLens] = useState<Lens>("identity");
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [caseFilter, setCaseFilter] = useState<CaseFilter>("all");
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const activeLens = lenses.find((item) => item.id === lens)!;
  const filteredCases = useMemo(
    () => caseRows.filter(({ result }) =>
      caseFilter === "all" || (caseFilter === "passed" ? result.grade.passed : !result.grade.passed)),
    [caseFilter],
  );

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Discovery-to-Architecture Workbench home">
          <span className="brand-mark" aria-hidden="true">D→A</span>
          <span><strong>Discovery-to-Architecture</strong><small>AI solution workbench</small></span>
        </a>
        <div className="header-note"><span className="status-dot" />Independent project · synthetic case</div>
      </header>

      <section className="workbench" id="top">
        <div className="hero-strip">
          <div>
            <span className="eyebrow">Meet Maya, a support lead · 5-minute case</span>
            <h1>Can she trust AI with customer answers?</h1>
          </div>
          <p>Scattered guidance. Repeated questions. One hard rule: <strong>AI may draft—not act.</strong></p>
        </div>

        <div className="glance-grid">
          <section className="story-card brief-card" aria-labelledby="brief-title">
            <div className="card-label"><span>01</span> Customer need</div>
            <div className="maya-row">
              <div className="avatar" aria-hidden="true">M</div>
              <div><h2 id="brief-title">Maya needs consistency</h2><p>without losing control</p></div>
            </div>
            <div className="need-stack" aria-label="Customer requirements">
              <div><span className="need-icon">↓</span><strong>Less searching</strong><small>Answers live in four places</small></div>
              <div><span className="need-icon">⌕</span><strong>Visible evidence</strong><small>Cite every important claim</small></div>
              <div><span className="need-icon">⊘</span><strong>No account actions</strong><small>Drafts remain human-reviewed</small></div>
            </div>
            <div className="lens-prompt">
              <span>What would you investigate first?</span>
              <div className="lens-grid">
                {lenses.map((item) => (
                  <button key={item.id} type="button" className={lens === item.id ? "lens active" : "lens"} onClick={() => setLens(item.id)} aria-pressed={lens === item.id} title={item.question}>
                    <b aria-hidden="true">{item.icon}</b><small>{item.label}</small>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="story-card architecture-card" aria-labelledby="architecture-title">
            <div className="card-label"><span>02</span> Proposed architecture</div>
            <div className="section-heading">
              <div><h2 id="architecture-title">Useful AI. External control.</h2><p>Each boundary has one job.</p></div>
              <button type="button" className="mini-link" onClick={() => setDrawer("method")}>Why this design →</button>
            </div>
            <div className="architecture-map" aria-label="Request flows from brief through retrieval, Gemini, guardrails, and human review">
              {architecture.map(([step, icon, title, subtitle], index) => (
                <div className="map-step-wrap" key={step}>
                  <div className={`map-step ${title === "Gemini" ? "model" : ""} ${title === "Guardrails" ? "control" : ""}`}>
                    <span className="map-index">{step}</span><b className="map-icon" aria-hidden="true">{icon}</b><strong>{title}</strong><small>{subtitle}</small>
                  </div>
                  {index < architecture.length - 1 && <span className="map-arrow" aria-hidden="true">→</span>}
                </div>
              ))}
            </div>
            <div className="lens-result">
              <span className="lens-symbol" aria-hidden="true">{activeLens.icon}</span>
              <div><small>Your lens · {activeLens.label}</small><strong>{activeLens.question}</strong><p>{activeLens.emphasis}</p></div>
            </div>
            <div className="control-line"><span>Model</span><b>interprets + drafts</b><i>→</i><span>System</span><b>authorizes + releases</b></div>
          </section>

          <section className="story-card gate-card" aria-labelledby="gate-title">
            <div className="card-label"><span>03</span> Recorded pilot gate</div>
            <div className="gate-hero">
              <div className="score-ring" aria-label="10 of 15 cases passed"><span><b>10</b>/15</span></div>
              <div><span className="blocked-pill">Customer-facing blocked</span><h2 id="gate-title">Improve, then retest</h2><p>Safe constraints held. Citations did not.</p></div>
            </div>
            <div className="metric-list" aria-label="Evaluation scorecard">
              {metrics.map(([label, value]) => (
                <div key={label}><span>{label}</span><div className="metric-track"><i style={{ width: `${value}%` }} /></div><b>{value}%</b></div>
              ))}
            </div>
            <div className="failure-signal"><span>5</span><p><strong>cases need review</strong>3 citation · 2 discovery</p></div>
            <button type="button" className="case-cta" onClick={() => setDrawer("cases")}><span className="case-grid-icon" aria-hidden="true">▦</span><span><strong>Inspect all 15 test cases</strong><small>Expected vs actual · sources · response</small></span><b>→</b></button>
          </section>
        </div>

        <div className="bottom-rail">
          <div><span className="rail-dot pass" />Internal, human-reviewed iteration</div>
          <div><span className="rail-dot fail" />Direct customer exposure</div>
          <button type="button" onClick={() => setDrawer("evidence")}>4 approved sources <span>→</span></button>
          <small>Recorded on Gemini 3.5 Flash-Lite · synthetic evidence · no live visitor calls</small>
        </div>
      </section>

      <footer className="site-footer">Independent reference implementation by Yolee Escuadra. No employer, client, or production data.</footer>

      {drawer && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setDrawer(null); }}>
          <aside className={`evidence-drawer ${drawer === "cases" ? "wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
            <div className="drawer-header">
              <div><span>Inspect the work</span><h2 id="drawer-title">{drawer === "cases" ? "15 recorded test cases" : drawer === "evidence" ? "Approved evidence" : "Why this architecture"}</h2></div>
              <button type="button" className="drawer-close" onClick={() => setDrawer(null)} aria-label="Close drawer">×</button>
            </div>

            {drawer === "cases" && (
              <div className="drawer-body case-body">
                <div className="case-summary">
                  <div><b>10</b><span>passed</span></div><div className="summary-divider" /><div><b>5</b><span>review</span></div>
                  <p>Click a row for Gemini&apos;s response and supporting sources.</p>
                </div>
                <div className="case-filters" aria-label="Filter cases">
                  {(["all", "passed", "review"] as CaseFilter[]).map((filter) => <button key={filter} type="button" className={caseFilter === filter ? "active" : ""} onClick={() => setCaseFilter(filter)}>{filter === "all" ? "All 15" : filter === "passed" ? "Passed 10" : "Review 5"}</button>)}
                </div>
                <div className="case-list">
                  {filteredCases.map((testCase) => {
                    const { result } = testCase;
                    const open = expandedCase === testCase.id;
                    return (
                      <article className={result.grade.passed ? "case-row passed" : "case-row review"} key={testCase.id}>
                        <button type="button" className="case-row-main" onClick={() => setExpandedCase(open ? null : testCase.id)} aria-expanded={open}>
                          <span className="category-mark">{categoryMarks[testCase.category] ?? "·"}</span>
                          <span className="case-question"><small>{testCase.id} · {testCase.category.replaceAll("-", " ")}</small><strong>{testCase.request}</strong></span>
                          <span className="route-pair"><small>Route</small><b>{testCase.expectedRoute}</b><i>→</i><b className={result.output.route === testCase.expectedRoute ? "match" : "mismatch"}>{result.output.route}</b></span>
                          <span className={`case-state ${result.grade.passed ? "pass" : "review"}`}>{result.grade.passed ? "Pass" : "Review"}</span>
                          <span className="expand-mark">{open ? "−" : "+"}</span>
                        </button>
                        {open && <div className="case-detail">
                          <div><small>Known context</small><p>{testCase.context}</p></div>
                          <div><small>Gemini response</small><p>{result.output.response}</p></div>
                          <div className="detail-meta"><span><small>Retrieved</small>{result.retrievedSourceIds.join(" · ")}</span><span><small>Cited</small>{result.output.citedSourceIds.length ? result.output.citedSourceIds.join(" · ") : "None"}</span></div>
                        </div>}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {drawer === "evidence" && <div className="drawer-body"><p className="drawer-intro">Four fictional, current documents form the complete V1 knowledge boundary.</p><div className="document-list">{evidence.map(([id, title, excerpt]) => <article key={id}><div className="document-meta"><span>{id}</span><span>Approved · current</span></div><h3>{title}</h3><p>{excerpt}</p></article>)}</div></div>}

            {drawer === "method" && <div className="drawer-body method-body">
              <div className="method-rule"><span>✦</span><div><small>Gemini may</small><strong>Interpret, draft, cite</strong></div></div>
              <div className="method-rule blocked"><span>⊘</span><div><small>Gemini may not</small><strong>Approve sources, authorize actions, release the pilot</strong></div></div>
              <section><small>Design choice</small><h3>Separate probabilistic work from deterministic control.</h3><p>The model proposes. Approved evidence, account boundaries, and release thresholds remain externally enforced.</p></section>
              <section><small>Recorded result</small><h3>10/15 passed. The gate stayed closed.</h3><p>That is the point of the workbench: evaluation changes the business decision instead of decorating it.</p></section>
            </div>}
          </aside>
        </div>
      )}
    </main>
  );
}
