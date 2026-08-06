"use client";

import { useEffect, useState } from "react";

type Stage = "problem" | "discovery" | "architecture" | "decision";
type DiscoveryChoice = "sources" | "identity" | "success";
type PilotChoice = "proceed" | "conditions" | "not-yet";
type Drawer = "architecture" | "evidence" | "evaluation" | null;

const stages: { id: Stage; number: string; label: string }[] = [
  { id: "problem", number: "01", label: "Maya's problem" },
  { id: "discovery", number: "02", label: "Discovery" },
  { id: "architecture", number: "03", label: "Architecture" },
  { id: "decision", number: "04", label: "Pilot decision" },
];

const discoveryChoices: {
  id: DiscoveryChoice;
  title: string;
  description: string;
  response: string;
}[] = [
  {
    id: "sources",
    title: "Which information can be trusted?",
    description: "Start with document ownership, approval, and freshness.",
    response:
      "A strong first question. Without approved, current sources, the assistant cannot produce defensible answers.",
  },
  {
    id: "identity",
    title: "How will customer identity be verified?",
    description: "Clarify what account context the assistant may use.",
    response:
      "A critical control question. Account-specific answers require trusted session context, not details typed into a chat.",
  },
  {
    id: "success",
    title: "What would make the pilot worthwhile?",
    description: "Define value, quality, and acceptable escalation early.",
    response:
      "An important business question. A pilot without a baseline or release threshold cannot produce a useful decision.",
  },
];

const evidence = [
  {
    id: "NS-SUP-01",
    title: "Support Answer Standard",
    owner: "Customer Support Operations",
    excerpt:
      "Every consequential product, plan, entitlement, security, or troubleshooting claim must cite an approved source.",
  },
  {
    id: "NS-SEC-04",
    title: "Account Authorization Policy",
    owner: "Identity and Security",
    excerpt:
      "The AI-assisted support workflow is read-only and cannot modify accounts, subscriptions, identity settings, or security controls.",
  },
  {
    id: "NS-ENT-07",
    title: "Subscription and Entitlement Guide",
    owner: "Product Operations",
    excerpt:
      "Specific customer entitlements require trusted account context and must be checked against the authoritative account record.",
  },
  {
    id: "NS-GOV-09",
    title: "Knowledge Governance Standard",
    owner: "Knowledge Management",
    excerpt:
      "Superseded material remains available for audit history but must be excluded from the active retrieval index.",
  },
];

const architectureFocus: Record<DiscoveryChoice, { title: string; copy: string }> = {
  sources: {
    title: "Approved-source retrieval",
    copy: "The active index contains only current, owned documents. Version conflicts are surfaced instead of silently resolved.",
  },
  identity: {
    title: "Trusted account boundary",
    copy: "General guidance and verified account facts remain separate. Account changes stay outside the AI workflow.",
  },
  success: {
    title: "Evaluation before exposure",
    copy: "A fixed test suite and release gates determine whether the pilot advances; the model does not grade itself.",
  },
};

function Arrow() {
  return <span className="flow-arrow" aria-hidden="true">→</span>;
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("problem");
  const [discoveryChoice, setDiscoveryChoice] =
    useState<DiscoveryChoice | null>(null);
  const [pilotChoice, setPilotChoice] = useState<PilotChoice | null>(null);
  const [decisionRevealed, setDecisionRevealed] = useState(false);
  const [drawer, setDrawer] = useState<Drawer>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const activeChoice = discoveryChoice
    ? discoveryChoices.find((choice) => choice.id === discoveryChoice)
    : null;

  const focus = architectureFocus[discoveryChoice ?? "identity"];

  const goToStage = (next: Stage) => {
    if (next !== "problem" && !discoveryChoice) return;
    setStage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Discovery-to-Architecture Workbench home">
          <span className="brand-mark" aria-hidden="true">D→A</span>
          <span>
            <strong>Discovery-to-Architecture Workbench</strong>
            <small>Evidence-backed solution design</small>
          </span>
        </a>
        <div className="header-note">
          <span className="status-dot" aria-hidden="true" />
          Independent project · synthetic case
        </div>
      </header>

      <section className="workbench" id="top">
        <nav className="stage-nav" aria-label="Project stages">
          {stages.map((item) => {
            const locked = item.id !== "problem" && !discoveryChoice;
            return (
              <button
                key={item.id}
                type="button"
                className={stage === item.id ? "stage-button active" : "stage-button"}
                onClick={() => goToStage(item.id)}
                aria-current={stage === item.id ? "step" : undefined}
                disabled={locked}
              >
                <span>{item.number}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {stage === "problem" && (
          <section className="stage-content problem-stage" aria-labelledby="problem-title">
            <div className="human-label">Meet Maya, a support lead</div>
            <h1 id="problem-title">
              Her team knows the answers.
              <br />Finding them is the problem.
            </h1>
            <p className="lead">
              Maya&apos;s team repeatedly answers questions about product setup,
              plans, and account access. The correct guidance exists, but it is
              scattered across documentation, policies, and troubleshooting notes.
            </p>

            <blockquote className="maya-brief">
              <p>
                “I want AI to help draft consistent answers. It must cite trusted
                sources, admit when information is missing, and never change a
                customer&apos;s account.”
              </p>
              <footer>— Maya&apos;s fictional project brief</footer>
            </blockquote>

            <div className="question-block">
              <div className="question-heading">
                <span>Your turn</span>
                <h2>What would you investigate first?</h2>
                <p>There is no bad starting point. Your choice changes what the architecture emphasizes.</p>
              </div>
              <div className="choice-grid">
                {discoveryChoices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    className={discoveryChoice === choice.id ? "choice-card selected" : "choice-card"}
                    onClick={() => setDiscoveryChoice(choice.id)}
                    aria-pressed={discoveryChoice === choice.id}
                  >
                    <span className="choice-indicator" aria-hidden="true" />
                    <strong>{choice.title}</strong>
                    <small>{choice.description}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="stage-actions right-aligned">
              <button
                type="button"
                className="primary-action"
                disabled={!discoveryChoice}
                onClick={() => goToStage("discovery")}
              >
                See what the Workbench found <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        )}

        {stage === "discovery" && (
          <section className="stage-content" aria-labelledby="discovery-title">
            <div className="stage-kicker">Discovery synthesis</div>
            <h1 id="discovery-title">Start with what is known—and expose what is not.</h1>
            <p className="lead narrow">
              The Workbench structures Maya&apos;s brief. A human architect still confirms every fact, assumption, and unanswered question.
            </p>

            {activeChoice && (
              <div className="choice-response">
                <span>You started with</span>
                <strong>{activeChoice.title}</strong>
                <p>{activeChoice.response}</p>
              </div>
            )}

            <div className="discovery-columns">
              <section className="quiet-panel">
                <div className="panel-heading">
                  <span className="panel-number">01</span>
                  <h2>What Maya told us</h2>
                </div>
                <ul className="finding-list confirmed">
                  <li><strong>Business goal</strong><span>Reduce repetitive work and improve answer consistency.</span></li>
                  <li><strong>Evidence requirement</strong><span>Cite a trusted source for every important claim.</span></li>
                  <li><strong>Hard boundary</strong><span>Never change an account, subscription, or security setting.</span></li>
                  <li><strong>Pilot user</strong><span>Support specialists review drafts before anything reaches customers.</span></li>
                </ul>
              </section>

              <section className="quiet-panel emphasized">
                <div className="panel-heading">
                  <span className="panel-number">02</span>
                  <h2>What Maya still needs to answer</h2>
                </div>
                <ul className="finding-list unknown">
                  <li><strong>Trusted identity</strong><span>How will verified account context enter the workflow?</span></li>
                  <li><strong>Source ownership</strong><span>Who approves guidance and removes outdated material?</span></li>
                  <li><strong>Pilot value</strong><span>What baseline and quality threshold justify expansion?</span></li>
                  <li><strong>Failure route</strong><span>What happens when retrieval or account context is unavailable?</span></li>
                </ul>
              </section>
            </div>

            <div className="principle-line">
              <span>Design principle</span>
              <strong>A missing answer becomes a discovery question—not a model assumption.</strong>
            </div>

            <div className="stage-actions">
              <button type="button" className="text-action" onClick={() => goToStage("problem")}>← Revisit your choice</button>
              <button type="button" className="primary-action" onClick={() => goToStage("architecture")}>Reveal the architecture <span aria-hidden="true">→</span></button>
            </div>
          </section>
        )}

        {stage === "architecture" && (
          <section className="stage-content" aria-labelledby="architecture-title">
            <div className="stage-kicker">Proposed architecture</div>
            <h1 id="architecture-title">Useful AI inside rules it cannot override.</h1>
            <p className="lead narrow">
              The model interprets and drafts. Approved evidence, account boundaries, and release decisions remain externally controlled.
            </p>

            <div className="selected-focus">
              <span>Because you prioritized</span>
              <strong>{activeChoice?.title ?? "How will customer identity be verified?"}</strong>
              <p><b>{focus.title}.</b> {focus.copy}</p>
            </div>

            <div className="architecture-flow" role="img" aria-label="Support request flows through context capture, approved-source retrieval, Gemini drafting, deterministic controls, and then to a cited draft or human escalation">
              <div className="flow-node">
                <span className="node-step">1</span>
                <strong>Understand the request</strong>
                <small>Question, trusted context, and known constraints</small>
              </div>
              <Arrow />
              <div className="flow-node">
                <span className="node-step">2</span>
                <strong>Find approved guidance</strong>
                <small>Current documents only; source versions preserved</small>
              </div>
              <Arrow />
              <div className="flow-node model-node">
                <span className="node-step">3</span>
                <strong>Draft with Gemini</strong>
                <small>Structured recommendation with claim-level citations</small>
              </div>
              <Arrow />
              <div className="flow-node control-node">
                <span className="node-step">4</span>
                <strong>Apply rules AI cannot override</strong>
                <small>Authorization, citations, source approval, escalation</small>
              </div>
              <Arrow />
              <div className="flow-node">
                <span className="node-step">5</span>
                <strong>Return a safe next step</strong>
                <small>Cited draft, clarification, or specialist route</small>
              </div>
            </div>

            <div className="architecture-note">
              <div>
                <span>Implemented prototype</span>
                <strong>Interactive workflow, synthetic evidence, 15-case evaluation design, and rule-based pilot gate</strong>
              </div>
              <div>
                <span>Proposed production path</span>
                <strong>Managed runtime, versioned retrieval, Gemini structured output, logging, and monitoring</strong>
              </div>
            </div>

            <div className="evidence-actions" aria-label="Inspect project evidence">
              <button type="button" onClick={() => setDrawer("architecture")}>Why this architecture?</button>
              <button type="button" onClick={() => setDrawer("evidence")}>View source evidence</button>
              <button type="button" onClick={() => setDrawer("evaluation")}>View evaluation design</button>
            </div>

            <div className="stage-actions">
              <button type="button" className="text-action" onClick={() => goToStage("discovery")}>← Back to discovery</button>
              <button type="button" className="primary-action" onClick={() => goToStage("decision")}>Make the pilot decision <span aria-hidden="true">→</span></button>
            </div>
          </section>
        )}

        {stage === "decision" && (
          <section className="stage-content decision-stage" aria-labelledby="decision-title">
            <div className="stage-kicker">Pilot decision</div>
            <h1 id="decision-title">Would you let Maya begin?</h1>
            <p className="lead narrow">
              Choose before seeing the designed release decision. The pilot gate uses explicit conditions—not model confidence.
            </p>

            <div className="pilot-choices">
              {[
                ["proceed", "Proceed", "Begin the customer-facing pilot now."],
                ["conditions", "Proceed with conditions", "Start narrowly while specific safeguards are completed."],
                ["not-yet", "Not yet", "Resolve the open questions before any pilot."],
              ].map(([id, label, description]) => (
                <button
                  key={id}
                  type="button"
                  className={pilotChoice === id ? "pilot-choice selected" : "pilot-choice"}
                  onClick={() => {
                    setPilotChoice(id as PilotChoice);
                    setDecisionRevealed(false);
                  }}
                  aria-pressed={pilotChoice === id}
                >
                  <span className="pilot-radio" aria-hidden="true" />
                  <strong>{label}</strong>
                  <small>{description}</small>
                </button>
              ))}
            </div>

            {!decisionRevealed ? (
              <div className="decision-reveal-action">
                <button
                  type="button"
                  className="primary-action"
                  disabled={!pilotChoice}
                  onClick={() => setDecisionRevealed(true)}
                >
                  Compare with the release gate <span aria-hidden="true">→</span>
                </button>
              </div>
            ) : (
              <div className="decision-result" aria-live="polite">
                <div className="decision-summary">
                  <span>Designed reference decision</span>
                  <h2>Proceed with conditions</h2>
                  <p>
                    Start with internal support specialists reviewing every draft. Do not expose the assistant directly to customers until identity, access-control, and recorded-model evaluations pass.
                  </p>
                  <div className="comparison-note">
                    {pilotChoice === "conditions"
                      ? "You and the release gate reached the same decision."
                      : pilotChoice === "proceed"
                        ? "The release gate is more cautious than your choice because two critical controls remain unverified."
                        : "Your choice is more cautious. The reference design allows a restricted internal pilot while customer-facing use remains blocked."}
                  </div>
                </div>
                <div className="gate-list">
                  <div><span className="gate-state defined">Defined</span><strong>Approved-source boundary</strong><small>Only current, owned documents enter retrieval.</small></div>
                  <div><span className="gate-state defined">Defined</span><strong>No account-changing actions</strong><small>The workflow is read-only by policy and design.</small></div>
                  <div><span className="gate-state pending">Pending</span><strong>Recorded Gemini evaluation</strong><small>Run the 15-case suite, inspect failures, then expand to 30.</small></div>
                  <div><span className="gate-state pending">Pending</span><strong>Identity and monitoring validation</strong><small>Required before any direct customer exposure.</small></div>
                </div>
              </div>
            )}

            <div className="evidence-actions" aria-label="Inspect project evidence">
              <button type="button" onClick={() => setDrawer("evidence")}>View source evidence</button>
              <button type="button" onClick={() => setDrawer("evaluation")}>View evaluation design</button>
            </div>

            <div className="stage-actions">
              <button type="button" className="text-action" onClick={() => goToStage("architecture")}>← Back to architecture</button>
              <button
                type="button"
                className="text-action"
                onClick={() => {
                  setDiscoveryChoice(null);
                  setPilotChoice(null);
                  setDecisionRevealed(false);
                  setStage("problem");
                }}
              >
                Start again
              </button>
            </div>
          </section>
        )}
      </section>

      <footer className="site-footer">
        <p>
          Independent reference implementation by Yolee Escuadra. All organizations,
          policies, account details, and evaluation cases are fictional.
        </p>
        <p>No employer, client, or production data is used.</p>
      </footer>

      {drawer && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setDrawer(null);
        }}>
          <aside className="evidence-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
            <div className="drawer-header">
              <div>
                <span>Inspect the work</span>
                <h2 id="drawer-title">
                  {drawer === "evidence"
                    ? "Approved source evidence"
                    : drawer === "evaluation"
                      ? "Evaluation design"
                      : "Architecture decision"}
                </h2>
              </div>
              <button type="button" className="drawer-close" onClick={() => setDrawer(null)} aria-label="Close evidence drawer">×</button>
            </div>

            {drawer === "evidence" && (
              <div className="drawer-body">
                <p className="drawer-intro">Four synthetic documents form the approved V1 knowledge boundary.</p>
                <div className="document-list">
                  {evidence.map((document) => (
                    <article key={document.id}>
                      <div className="document-meta"><span>{document.id}</span><span>Approved · current</span></div>
                      <h3>{document.title}</h3>
                      <small>Owner: {document.owner}</small>
                      <blockquote>“{document.excerpt}”</blockquote>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {drawer === "evaluation" && (
              <div className="drawer-body">
                <div className="evaluation-status">
                  <span>Current build status</span>
                  <strong>15 cases defined · recorded Gemini run pending</strong>
                  <p>The interface does not present placeholder model scores as real results.</p>
                </div>
                <div className="evaluation-groups">
                  <div><strong>5</strong><span>Evidence, citation, and source-version cases</span></div>
                  <div><strong>6</strong><span>Identity, authorization, and security cases</span></div>
                  <div><strong>3</strong><span>Discovery-quality cases</span></div>
                  <div><strong>1</strong><span>Retrieval-service failure case</span></div>
                </div>
                <section className="drawer-section">
                  <span>Critical release gates</span>
                  <ul>
                    <li>Every account-changing request is denied.</li>
                    <li>Every cross-account request is blocked.</li>
                    <li>Every consequential claim uses an approved current source.</li>
                    <li>Retrieval failure never falls back to model memory.</li>
                  </ul>
                </section>
                <section className="drawer-section">
                  <span>Expansion plan</span>
                  <p>Validate the complete workflow with 15 cases, inspect failures, then expand to approximately 30 cases before public launch.</p>
                </section>
              </div>
            )}

            {drawer === "architecture" && (
              <div className="drawer-body">
                <section className="drawer-section first">
                  <span>Decision</span>
                  <h3>Separate probabilistic interpretation from deterministic control.</h3>
                  <p>Gemini may extract requirements and draft a recommendation. It cannot approve sources, authorize actions, or declare the pilot ready.</p>
                </section>
                <section className="drawer-section">
                  <span>Rejected alternative</span>
                  <h3>Prompt-only support assistant</h3>
                  <p>Rejected because a prompt alone cannot reliably enforce document approval, account boundaries, or version-aware evidence.</p>
                </section>
                <section className="drawer-section">
                  <span>Still provisional</span>
                  <p>The production architecture remains conditional on Maya&apos;s unanswered questions about trusted identity, document ownership, baselines, and monitoring.</p>
                </section>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
