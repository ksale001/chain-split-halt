import React, { useEffect, useMemo, useState } from "react";
import { Info, RotateCcw } from "lucide-react";
import obolLogoInverted from "../media/obol-logo-inverted.svg";
import obolBgTemplate01 from "../media/obol-bg-template-01.png";

function cn() {
  return Array.from(arguments).filter(Boolean).join(" ");
}

function Pill({ tone = "neutral", className, children }) {
  const tones = {
    neutral: "bg-zinc-100 text-zinc-800 border-zinc-200",
    good: "bg-emerald-50 text-emerald-900 border-emerald-200",
    warn: "bg-amber-50 text-amber-900 border-amber-200",
    bad: "bg-rose-50 text-rose-900 border-rose-200",
    dark: "bg-zinc-900 text-zinc-50 border-zinc-800",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

function Button({ variant = "solid", size = "md", className, children, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-base",
  };
  const variants = {
    solid: "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm",
    subtle: "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50",
    ghost: "bg-transparent text-zinc-900 hover:bg-zinc-100",
  };

  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

function makeDefaultNodes() {
  const base = [150, 220, 260, 180];
  return Array.from({ length: 4 }, (_, i) => ({
    id: i,
    fork: "A",
    bnLatency: base[i],
  }));
}

function simulateSlot({
  nodes,
  quorum,
  chainSplitHalt,
  leaderIndex,
  propagateDelay,
  qbftTimeout,
  ackDelay,
  qbftOverhead,
}) {
  const attempts = [];

  function attemptWithLeader(li) {
    const leader = nodes[li];
    const leaderFork = leader.fork;
    const leaderSendTime = leader.bnLatency + propagateDelay;

    const perNode = nodes.map((n, i) => {
      const receivesLeaderAt = leaderSendTime;
      const hasLocalBy = n.bnLatency;

      if (!chainSplitHalt) {
        return {
          i,
          isLeader: i === li,
          fork: n.fork,
          forkMatch: n.fork === leaderFork,
          receivesLeaderAt,
          hasLocalBy,
          waitsOnBnMs: 0,
          participates: true,
          reason: i === li ? "Leader" : "Accepts leader attester data",
          ackAt: receivesLeaderAt + ackDelay,
        };
      }

      const forkMatch = n.fork === leaderFork;
      if (!forkMatch) {
        return {
          i,
          isLeader: i === li,
          fork: n.fork,
          forkMatch,
          receivesLeaderAt,
          hasLocalBy,
          waitsOnBnMs: 0,
          participates: false,
          reason: "Mismatch -> does not participate",
          ackAt: Number.POSITIVE_INFINITY,
        };
      }

      const waitsOnBnMs = Math.max(0, hasLocalBy - receivesLeaderAt);
      return {
        i,
        isLeader: i === li,
        fork: n.fork,
        forkMatch,
        receivesLeaderAt,
        hasLocalBy,
        waitsOnBnMs,
        participates: true,
        reason: waitsOnBnMs > 0 ? "Waiting on BN" : "Match -> participates",
        ackAt: Math.max(receivesLeaderAt, hasLocalBy) + ackDelay,
      };
    });

    const participating = perNode.filter((p) => p.participates);
    if (participating.length < quorum) {
      return {
        ok: false,
        leaderIndex: li,
        leaderFork,
        leaderSendTime,
        perNode,
        quorumTime: Number.POSITIVE_INFINITY,
        failure: "Not enough peers participate -> timeout",
        quorumParticipants: [],
      };
    }

    const sorted = [...participating].sort((a, b) => a.ackAt - b.ackAt);
    const quorumSet = sorted.slice(0, quorum);
    const quorumAckAt = quorumSet[quorum - 1].ackAt;
    const quorumTime = quorumAckAt + qbftOverhead;

    if (quorumTime > qbftTimeout) {
      return {
        ok: false,
        leaderIndex: li,
        leaderFork,
        leaderSendTime,
        perNode,
        quorumTime,
        failure: "QBFT timeout -> new leader",
        quorumParticipants: quorumSet.map((p) => p.i),
      };
    }

    return {
      ok: true,
      leaderIndex: li,
      leaderFork,
      leaderSendTime,
      perNode,
      quorumTime,
      failure: null,
      quorumParticipants: quorumSet.map((p) => p.i),
    };
  }

  let li = leaderIndex;
  for (let k = 0; k < nodes.length; k += 1) {
    const res = attemptWithLeader(li);
    attempts.push(res);
    if (res.ok) {
      return {
        outcome: "attest",
        leaderIndex: res.leaderIndex,
        fork: res.leaderFork,
        quorumTime: res.quorumTime,
        leaderSendTime: res.leaderSendTime,
        perNode: res.perNode,
        quorumParticipants: res.quorumParticipants,
        attempts,
      };
    }
    li = (li + 1) % nodes.length;
  }

  const last = attempts[attempts.length - 1];
  return {
    outcome: "halt",
    leaderIndex: last ? last.leaderIndex : leaderIndex,
    fork: null,
    quorumTime: Number.POSITIVE_INFINITY,
    leaderSendTime: last ? last.leaderSendTime : 0,
    perNode: last ? last.perNode : [],
    quorumParticipants: last ? last.quorumParticipants : [],
    attempts,
  };
}

const GUIDED_STEPS = [
  {
    key: "healthy-network",
    title: "Healthy network",
    scenarioKey: "orient",
    leaderIndex: 0,
  },
  {
    key: "single-divergent-node",
    title: "Single node following a different fork",
    scenarioKey: "singleBug",
    leaderIndex: 0,
  },
  {
    key: "contentious-fork",
    title: "Contentious fork (2 vs 2)",
    scenarioKey: "contentious",
    leaderIndex: 0,
  },
];

const BRAND_STYLE = {
  pageClass: "bg-gradient-to-b from-teal-50 via-white to-emerald-50 text-zinc-900",
  headerClass: "border-emerald-200/70 bg-white/80 backdrop-blur",
  logo: obolLogoInverted,
  logoClass: "h-9",
  heroClass: "bg-white/72 border-white/70 text-zinc-900 backdrop-blur-xl",
  rightPanelClass: "bg-white/72 border-white/70 text-zinc-900 backdrop-blur-xl",
  bgImage: obolBgTemplate01,
  bgImageStyle: {
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center bottom",
    opacity: 0.08,
  },
};

function buildScenarioNodes(scenarioKey) {
  const nodes = makeDefaultNodes();

  if (scenarioKey === "singleBug") {
    return nodes.map((n, i) => ({ ...n, fork: i === 0 ? "B" : "A" }));
  }

  if (scenarioKey === "contentious") {
    return nodes.map((n, i) => ({ ...n, fork: i < 2 ? "B" : "A" }));
  }

  return nodes.map((n) => ({ ...n, fork: "A" }));
}

function getScenarioMeta(scenarioKey) {
  if (scenarioKey === "singleBug") {
    return { label: "one node follows a different chain (1 wrong, 3 correct)", correctFork: "A" };
  }
  if (scenarioKey === "contentious") {
    return { label: "contentious split (2 vs 2)", correctFork: "A" };
  }
  return { label: "traditional scenario", correctFork: "A" };
}

function getScenarioSentence(scenarioKey, chainSplitHalt) {
  const modeLabel = `Chain Split Halt ${chainSplitHalt ? "ON" : "OFF"}`;

  if (scenarioKey === "orient") {
    return `Healthy network simulation. ${modeLabel}.`;
  }
  if (scenarioKey === "singleBug") {
    return `Simulation of a single node following a different fork. ${modeLabel}.`;
  }
  return `Contentious 2 vs 2 fork simulation. ${modeLabel}.`;
}

function deriveVerdict(sim, correctFork) {
  if (sim.outcome === "halt") {
    return {
      label: "Did not attest to either fork",
      tone: "warn",
      explanation: "Cluster did not complete QBFT with threshold, so no attestation was produced.",
    };
  }

  if (sim.fork === correctFork) {
    return {
      label: `Attested to Fork ${sim.fork}`,
      tone: "good",
      explanation: `Cluster completed QBFT and attested to the canonical chain (Fork ${sim.fork}).`,
    };
  }

  return {
    label: `Attested to Fork ${sim.fork}`,
    tone: "bad",
    explanation: `Cluster completed QBFT and attested to a non-canonical chain (Fork ${sim.fork}).`,
  };
}

function buildTrace(step, sim) {
  const lines = [];
  lines.push(`Scenario: ${getScenarioMeta(step.scenarioKey).label}`);
  lines.push(`Mode: ${step.mode.toUpperCase()} | Starting leader: N${step.leaderIndex + 1}`);

  sim.attempts.forEach((attempt, index) => {
    lines.push(`Attempt ${index + 1}: Leader N${attempt.leaderIndex + 1} (Fork ${attempt.leaderFork})`);
    if (attempt.ok) {
      lines.push("Round completed.");
    } else {
      lines.push(attempt.failure || "Timeout");
    }
  });

  return lines;
}

export default function ChainSplitHaltLandingPage() {
  const CLUSTER_SIZE = 4;
  const QUORUM = 3;
  const DEFAULT_PROPAGATE_DELAY = 100;
  const DEFAULT_QBFT_TIMEOUT = 450;
  const DEFAULT_ACK_DELAY = 20;
  const DEFAULT_QBFT_OVERHEAD = 80;

  const [started, setStarted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  const [nodes, setNodes] = useState(() => buildScenarioNodes("orient"));
  const [chainSplitHalt, setChainSplitHalt] = useState(false);
  const [leaderIndex, setLeaderIndex] = useState(0);
  const [currentScenarioKey, setCurrentScenarioKey] = useState("orient");

  const [lastRun, setLastRun] = useState(null);
  const [roundView, setRoundView] = useState(0);
  const [toggledModeByStep, setToggledModeByStep] = useState({});
  const [landingCursor, setLandingCursor] = useState({ x: 0, y: 0, active: false });

  const currentStep = GUIDED_STEPS[currentStepIndex];
  const brandVariant = BRAND_STYLE;
  const isMintGlow = true;
  const rightPanelShellClass = cn(
    "rounded-3xl border-2 p-5 shadow-sm ring-2",
    isMintGlow ? "border-white/70 bg-white/68 ring-emerald-400/15 backdrop-blur-xl shadow-[0_18px_60px_rgba(16,185,129,0.12)]" : "border-zinc-900 bg-white ring-zinc-900/10"
  );
  const rightPanelTitleClass = "text-sm font-semibold tracking-tight text-zinc-900";
  const rightPanelSubtextClass = "mt-1 text-xs text-zinc-600";
  const correctFork = useMemo(() => getScenarioMeta(currentScenarioKey).correctFork, [currentScenarioKey]);
  const hasToggledCurrentStepMode = Boolean(toggledModeByStep[currentStep?.key]);

  function buildRun(step, mode) {
    const runNodes = buildScenarioNodes(step.scenarioKey);
    const sim = simulateSlot({
      nodes: runNodes,
      quorum: QUORUM,
      chainSplitHalt: mode,
      leaderIndex: step.leaderIndex,
      propagateDelay: DEFAULT_PROPAGATE_DELAY,
      qbftTimeout: DEFAULT_QBFT_TIMEOUT,
      ackDelay: DEFAULT_ACK_DELAY,
      qbftOverhead: DEFAULT_QBFT_OVERHEAD,
    });

    const verdict = deriveVerdict(sim, getScenarioMeta(step.scenarioKey).correctFork);
    const trace = buildTrace({ ...step, mode: mode ? "on" : "off" }, sim);
    const run = { stepKey: step.key, sim, verdict, trace };
    const finalRoundIndex = sim.outcome === "attest" ? Math.max(0, sim.attempts.findIndex((a) => a.ok)) : Math.max(0, sim.attempts.length - 1);

    return {
      scenarioKey: step.scenarioKey,
      runNodes,
      leader: step.leaderIndex,
      mode,
      run,
      finalRoundIndex,
    };
  }

  function executeStep(step, mode) {
    const next = buildRun(step, mode);

    setCurrentScenarioKey(next.scenarioKey);
    setNodes(next.runNodes);
    setChainSplitHalt(next.mode);
    setLeaderIndex(next.leader);
    setLastRun(next.run);
    setRoundView(next.finalRoundIndex);

    setCompletedSteps((prev) => {
      if (prev.includes(step.key)) return prev;
      return [...prev, step.key];
    });
  }

  useEffect(() => {
    if (!started) return;
    executeStep(currentStep, false);
  }, [started, currentStepIndex]);

  const attemptForView = useMemo(() => {
    if (!lastRun) return null;
    return lastRun.sim.attempts[roundView] || lastRun.sim.attempts[lastRun.sim.attempts.length - 1] || null;
  }, [lastRun, roundView]);

  const perNodeView = useMemo(() => {
    if (!attemptForView) return [];
    const quorumSet = new Set(attemptForView.quorumParticipants || []);
    return attemptForView.perNode.map((p) => ({ ...p, inQuorum: quorumSet.has(p.i) }));
  }, [attemptForView]);
  const displayedLeaderIndex = attemptForView ? attemptForView.leaderIndex : leaderIndex;
  const selectedRoundStatus = useMemo(() => {
    if (!attemptForView) return null;
    const roundNumber = roundView + 1;

    if (attemptForView.ok) {
      const attestedFork = attemptForView.leaderFork;
      const attestedCorrectFork = attestedFork === correctFork;
      const priorTimeouts = roundView;
      if (priorTimeouts > 0) {
        return {
          tone: attestedCorrectFork ? "good" : "bad",
          text: `Round ${roundNumber} reached consensus after ${priorTimeouts} earlier timeout${priorTimeouts > 1 ? "s" : ""}.`,
        };
      }
      return { tone: attestedCorrectFork ? "good" : "bad", text: `Round ${roundNumber} reached consensus.` };
    }

    if (attemptForView.failure && attemptForView.failure.includes("Not enough peers participate")) {
      return { tone: "warn", text: `Round ${roundNumber} timeout, not enough peers participated.` };
    }
    if (attemptForView.failure && attemptForView.failure.includes("QBFT timeout")) {
      return { tone: "warn", text: `Round ${roundNumber} timeout, quorum was not reached before the QBFT deadline.` };
    }

    return { tone: "warn", text: `Round ${roundNumber} timed out.` };
  }, [attemptForView, roundView, correctFork]);

  function startWalkthrough() {
    setStarted(true);
    setCurrentStepIndex(0);
    setCompletedSteps([]);
    setLastRun(null);
    setRoundView(0);
    setToggledModeByStep({});
  }

  function restartWalkthrough() {
    startWalkthrough();
  }

  function onToggleMode(v) {
    setToggledModeByStep((prev) => ({ ...prev, [currentStep.key]: true }));
    executeStep(currentStep, v);
  }

  function getStepStatus(index) {
    if (index < currentStepIndex) return "done";
    if (index === currentStepIndex) return "now";
    return "next";
  }

  function selectScenario(index) {
    if (!started) setStarted(true);
    setCurrentStepIndex(index);
  }

  function handleLandingMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setLandingCursor({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true,
    });
  }

  function handleLandingMouseLeave() {
    setLandingCursor((prev) => ({ ...prev, active: false }));
  }

  return (
    <div className={cn("relative min-h-screen overflow-hidden", brandVariant.pageClass)}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${brandVariant.bgImage})`, ...brandVariant.bgImageStyle }} />
        <>
          <div className="absolute -top-28 right-[-12%] h-[420px] w-[420px] rounded-full bg-emerald-300/30 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-10%] h-[360px] w-[460px] rounded-full bg-teal-200/30 blur-3xl" />
        </>
      </div>

      <header className={cn("relative z-10 border-b", brandVariant.headerClass)}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={brandVariant.logo} alt="Obol" className={cn("w-auto", brandVariant.logoClass)} />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-extrabold leading-tight text-zinc-900">Chain Split Halt Walkthrough</div>
            <Pill tone="dark">Fixed cluster: 4 nodes, threshold 3/4</Pill>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-5 space-y-4">
            <div className={cn("rounded-3xl border p-5 shadow-sm", brandVariant.heroClass, isMintGlow ? "shadow-[0_18px_60px_rgba(16,185,129,0.14)]" : "")}>
              <div className="text-xs font-bold text-zinc-600">Walkthrough mission</div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Obol&apos;s Chain Split Halt feature protects your validator from following contentious forks</h1>

              <div className="mt-4 space-y-2">
                {GUIDED_STEPS.map((step, index) => {
                  const status = getStepStatus(index);
                  const done = status === "done";
                  const now = status === "now";
                  const isNextStep = started && index === currentStepIndex + 1;
                  const stepsAhead = index - currentStepIndex;
                  let blurClass = "";
                  let opacityClass = "";

                  if (started && stepsAhead >= 2) {
                    if (stepsAhead === 2) {
                      blurClass = "blur-[1px]";
                      opacityClass = "opacity-90";
                    } else if (stepsAhead <= 4) {
                      blurClass = "blur-[2px]";
                      opacityClass = "opacity-80";
                    } else {
                      blurClass = "blur-[3px]";
                      opacityClass = "opacity-70";
                    }
                  }

                  return (
                    <button
                      type="button"
                      onClick={() => selectScenario(index)}
                      key={step.key}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-left text-xs transition",
                        isNextStep ? "breathe-next-scenario" : "",
                        now ? "border-zinc-900 bg-zinc-50" : done ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-white"
                      )}
                    >
                      <div className={cn("flex items-center justify-between gap-2", blurClass, opacityClass)}>
                        <span className="font-semibold text-zinc-800">
                          {index + 1}. {step.title}
                        </span>
                        {!started && index === 0 ? (
                          <Pill tone="dark" className="breathe-cta">
                            Start
                          </Pill>
                        ) : (
                          <Pill tone={now ? "dark" : done ? "good" : isNextStep ? "warn" : "neutral"} className={isNextStep ? "breathe-next-pill" : ""}>
                            {now ? "Now" : done ? "Done" : isNextStep ? "Next" : "View"}
                          </Pill>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {started ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="subtle" size="sm" onClick={restartWalkthrough}>
                    <RotateCcw size={14} />
                    Restart
                  </Button>
                </div>
              ) : null}
            </div>

          </section>

          <section className="relative lg:col-span-7 space-y-4">
            {!started ? (
              <div
                className="absolute inset-0 z-20 overflow-hidden rounded-3xl border border-zinc-200 bg-white/70 backdrop-blur-xl"
                onMouseMove={handleLandingMouseMove}
                onMouseLeave={handleLandingMouseLeave}
              >
                {landingCursor.active ? (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: `radial-gradient(180px circle at ${landingCursor.x}px ${landingCursor.y}px, rgba(0,0,0,0.28), rgba(0,0,0,0) 70%)`,
                    }}
                  />
                ) : null}
                <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
                  <div className="max-w-sm">
                    <div className="text-sm font-bold text-zinc-900">Start on the left</div>
                    <div className="mt-1 text-xs text-zinc-700">
                      Click a scenario on the left to unlock this panel.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {started ? (
              <div className={cn("rounded-3xl border p-5 shadow-sm", brandVariant.rightPanelClass, isMintGlow ? "shadow-[0_18px_60px_rgba(16,185,129,0.14)]" : "")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-nowrap items-center gap-2">
                    <Pill tone="neutral">Scenario {currentStepIndex + 1} of {GUIDED_STEPS.length}</Pill>
                  </div>
                  <div className="relative">
                    {!hasToggledCurrentStepMode ? (
                      <div className="pointer-events-none absolute right-full top-1/2 z-10 mr-2 hidden -translate-y-1/2 text-right sm:block">
                        <div className="breathe-toggle-pointer text-2xl leading-none text-zinc-900">→</div>
                        <div className="mt-1 w-36 text-[11px] font-semibold leading-snug text-zinc-700">Toggle to see how behavior changes</div>
                      </div>
                    ) : null}
                    <div
                      className={cn(
                        "w-64 min-h-[52px] rounded-xl border px-3 py-1.5 text-xs",
                        chainSplitHalt ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-zinc-200 bg-zinc-50 text-zinc-700"
                      )}
                    >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-zinc-900">Chain Split Halt</div>
                      <div className="flex items-center gap-1 text-xs font-semibold">
                        <span className={cn(!chainSplitHalt ? "text-zinc-900" : "text-zinc-400")}>OFF</span>
                        <button
                          type="button"
                          onClick={() => onToggleMode(!chainSplitHalt)}
                          aria-pressed={chainSplitHalt}
                          className={cn(
                            "breathe-toggle-control relative inline-flex h-6 w-11 items-center rounded-full border transition",
                            chainSplitHalt ? "border-emerald-500 bg-emerald-500" : "border-zinc-300 bg-zinc-200"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition",
                              chainSplitHalt ? "translate-x-5" : "translate-x-0.5"
                            )}
                          />
                        </button>
                        <span className={cn(chainSplitHalt ? "text-zinc-900" : "text-zinc-400")}>ON</span>
                      </div>
                      <div className="group relative">
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                          aria-label="Mode help"
                        >
                          <Info size={12} />
                        </button>
                        <div className="pointer-events-none absolute right-0 top-7 z-30 hidden w-56 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs leading-snug text-zinc-700 shadow group-hover:block">
                          {chainSplitHalt
                            ? "Peers compare source and target votes with local BN data. If the data doesn't match they do not participate."
                            : "Peers participate once they receive leader attester data and do not wait for local BN data in that round."}
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>

                <div className={cn("mt-3 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-800", isMintGlow ? "border border-white/60 bg-white/55 backdrop-blur-md" : "bg-zinc-50")}>
                  {getScenarioSentence(currentScenarioKey, chainSplitHalt)}
                </div>
              </div>
            ) : null}
            <div className={rightPanelShellClass}>
              <div className={rightPanelTitleClass}>Validator outcome</div>

              {lastRun ? (
                <div className="mt-3 grid gap-3">
                  <div
                    className={cn(
                      "rounded-2xl border px-4 py-4 text-center text-2xl font-extrabold tracking-tight",
                      lastRun.verdict.tone === "good"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                        : lastRun.verdict.tone === "bad"
                          ? "border-rose-300 bg-rose-50 text-rose-900"
                          : "border-amber-300 bg-amber-50 text-amber-900"
                    )}
                  >
                    {lastRun.verdict.label}
                  </div>
                  <div className={cn("rounded-2xl border px-3 py-2 text-sm text-zinc-700", isMintGlow ? "border-white/65 bg-white/55 backdrop-blur-md" : "border-zinc-200 bg-zinc-50")}>{lastRun.verdict.explanation}</div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-zinc-600">Start the walkthrough to compute and display the scenario result.</div>
              )}
            </div>

            <div className={rightPanelShellClass}>
              <div>
                <div className={rightPanelTitleClass}>Cluster behavior</div>
                <div className={rightPanelSubtextClass}>Which nodes participate in each round</div>
              </div>

              {lastRun ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className={cn("inline-flex rounded-xl p-1 text-xs", isMintGlow ? "border border-white/70 bg-white/70 backdrop-blur-md" : "border border-zinc-200 bg-white")}>
                    {lastRun.sim.attempts.map((_, idx) => (
                      <button
                        key={`round-${idx}`}
                        type="button"
                        onClick={() => setRoundView(idx)}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                          lastRun.sim.attempts.length > 1 ? "breathe-round-tab" : "",
                          roundView === idx
                            ? "bg-zinc-900 text-white"
                            : isMintGlow
                              ? "text-zinc-700 hover:bg-emerald-100/70"
                              : "text-zinc-700 hover:bg-zinc-100"
                        )}
                      >
                        R{idx + 1}
                      </button>
                    ))}
                  </div>
                  {selectedRoundStatus ? (
                    <div
                      className={cn(
                        "rounded-xl px-2.5 py-1 text-xs font-semibold",
                        selectedRoundStatus.tone === "good"
                          ? "border border-emerald-300 bg-emerald-100 text-emerald-900"
                          : selectedRoundStatus.tone === "bad"
                            ? "border border-rose-300 bg-rose-50 text-rose-900"
                            : "border border-amber-300 bg-amber-50 text-amber-900"
                      )}
                    >
                      {selectedRoundStatus.text}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {nodes.map((node, i) => {
                  const p = perNodeView.find((x) => x.i === i);
                  const isLeader = i === displayedLeaderIndex;
                  const onForkB = node.fork === "B";
                  return (
                    <div
                      key={node.id}
                      className={cn(
                        "rounded-2xl border-2 p-3",
                        onForkB
                          ? "border-rose-400 bg-rose-50/70 shadow-[0_0_0_1px_rgba(251,113,133,0.35),0_0_18px_rgba(244,63,94,0.18)]"
                          : isLeader
                            ? "border-zinc-900 bg-white/70 shadow-[0_0_0_1px_rgba(24,24,27,0.22)]"
                            : isMintGlow
                              ? "border-emerald-200/80 bg-white/60 shadow-[0_0_0_1px_rgba(52,211,153,0.18)] backdrop-blur-sm"
                              : "border-zinc-200 bg-white"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-zinc-900">Node {i + 1}</div>
                        <div className="flex items-center gap-1">
                          {isLeader ? <Pill tone="dark">Leader</Pill> : <Pill tone="neutral">Peer</Pill>}
                          <Pill tone={onForkB ? "bad" : "good"}>Fork {node.fork}</Pill>
                        </div>
                      </div>
                      {p ? (
                        <div className="mt-2 text-xs">
                          <Pill tone={p.participates ? "good" : "bad"}>{p.participates ? "Participates" : "Does not participate"}</Pill>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-zinc-500">Start the walkthrough to show participation status.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={rightPanelShellClass}>
              <div className={cn("flex items-center gap-2", rightPanelTitleClass)}>
                <RotateCcw size={14} />
                Slot trace
              </div>
              {lastRun ? (
                <div className="mt-2 space-y-1 text-xs leading-relaxed text-zinc-700">
                  {lastRun.trace.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap">{line}</div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-xs text-zinc-600">Start the walkthrough to generate scenario trace output.</div>
              )}
            </div>
          </section>
        </div>

      </main>
    </div>
  );
}
