// Mirror of src/ChainSplitHaltLandingPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Info, RotateCcw, Shield } from "lucide-react";

function cn() {
  return Array.from(arguments).filter(Boolean).join(" ");
}

function Pill({ tone = "neutral", children }) {
  const tones = {
    neutral: "bg-zinc-100 text-zinc-800 border-zinc-200",
    good: "bg-emerald-50 text-emerald-900 border-emerald-200",
    warn: "bg-amber-50 text-amber-900 border-amber-200",
    bad: "bg-rose-50 text-rose-900 border-rose-200",
    dark: "bg-zinc-900 text-zinc-50 border-zinc-800",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
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
    scenarioName: "Healthy network",
    title: "Healthy network",
    scenarioKey: "orient",
    leaderIndex: 0,
  },
  {
    key: "single-divergent-node",
    scenarioName: "One node on a different chain",
    title: "One node on a different chain",
    scenarioKey: "singleBug",
    leaderIndex: 0,
  },
  {
    key: "contentious-fork",
    scenarioName: "Contentious fork",
    title: "Contentious fork (2v2)",
    scenarioKey: "contentious",
    leaderIndex: 0,
  },
];

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
  if (scenarioKey === "orient") {
    return `We are simulating how this cluster behaves in a traditional scenario with chain_split_halt turned ${chainSplitHalt ? "ON" : "OFF"}.`;
  }
  if (scenarioKey === "singleBug") {
    return `We are simulating how this cluster behaves when one node follows a different chain (for example: client bug or misconfiguration) with chain_split_halt turned ${chainSplitHalt ? "ON" : "OFF"}.`;
  }
  return `We are simulating how this cluster behaves during a contentious split (2 vs 2) with chain_split_halt turned ${chainSplitHalt ? "ON" : "OFF"}.`;
}

function deriveVerdict(sim, correctFork) {
  if (sim.outcome === "halt") {
    return {
      label: "No attestation (safety halt)",
      tone: "warn",
      explanation: "No leader reached 3/4 threshold, so cluster intentionally did not attest.",
    };
  }

  if (sim.fork === correctFork) {
    return {
      label: "Attested correct chain",
      tone: "good",
      explanation: "Cluster reached consensus on the intended fork.",
    };
  }

  return {
    label: "Attested wrong chain",
    tone: "bad",
    explanation: "Cluster followed leader data on a non-intended fork in this scenario.",
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

  const currentStep = GUIDED_STEPS[currentStepIndex];

  function executeStep(step, mode) {
    setCurrentScenarioKey(step.scenarioKey);
    setNodes(buildScenarioNodes(step.scenarioKey));
    setChainSplitHalt(mode);
    setLeaderIndex(step.leaderIndex);
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

    setLastRun({ stepKey: step.key, sim, verdict, trace });
    const finalRoundIndex = sim.outcome === "attest" ? Math.max(0, sim.attempts.findIndex((a) => a.ok)) : Math.max(0, sim.attempts.length - 1);
    setRoundView(finalRoundIndex);

    setCompletedSteps((prev) => {
      if (prev.includes(step.key)) return prev;
      return [...prev, step.key];
    });
  }

  useEffect(() => {
    if (!started) return;
    executeStep(currentStep, false);
  }, [started, currentStepIndex]);

  const scenarioMeta = useMemo(() => getScenarioMeta(currentScenarioKey), [currentScenarioKey]);

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
  const reachedRound = useMemo(() => {
    if (!lastRun || lastRun.sim.outcome !== "attest") return null;
    const idx = lastRun.sim.attempts.findIndex((a) => a.ok);
    return idx >= 0 ? idx + 1 : null;
  }, [lastRun]);

  function startWalkthrough() {
    setStarted(true);
    setCurrentStepIndex(0);
    setCompletedSteps([]);
    setLastRun(null);
    setRoundView(0);
  }

  function restartWalkthrough() {
    startWalkthrough();
  }

  function onToggleMode(v) {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm">
              <Shield size={18} />
            </div>
            <div>
              <div className="text-sm font-extrabold leading-tight">Chain Split Halt Walkthrough</div>
            </div>
          </div>
          <Pill tone="dark">Fixed cluster: 4 nodes, threshold 3/4</Pill>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-bold text-zinc-600">Walkthrough mission</div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Lets walk through how Obols Chain Split Halt feature protects your validator in various scenarios</h1>

              <div className="mt-4 space-y-2">
                {GUIDED_STEPS.map((step, index) => {
                  const status = getStepStatus(index);
                  const done = status === "done";
                  const now = status === "now";
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
                          <Pill tone={now ? "dark" : done ? "good" : "neutral"}>{now ? "Now" : done ? "Done" : "View"}</Pill>
                        )}
                      </div>
                      <div className={cn("mt-1 text-zinc-600", blurClass, opacityClass)}>{step.scenarioName}</div>
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
              <div className="absolute inset-0 z-20 rounded-3xl border border-zinc-200 bg-white/70 backdrop-blur-xl">
                <div className="flex h-full items-center justify-center px-6 text-center">
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
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-nowrap items-center gap-2">
                    <Pill tone="neutral">Scenario {currentStepIndex + 1} of {GUIDED_STEPS.length}</Pill>
                  </div>
                  <div
                    className={cn(
                      "w-64 min-h-[52px] rounded-xl border px-3 py-1.5 text-xs",
                      chainSplitHalt ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-zinc-200 bg-zinc-50 text-zinc-700"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] font-semibold text-zinc-900">Chain Split Halt</div>
                      <div className="flex items-center gap-1 text-[10px] font-semibold">
                        <span className={cn(!chainSplitHalt ? "text-zinc-900" : "text-zinc-400")}>OFF</span>
                        <button
                          type="button"
                          onClick={() => onToggleMode(!chainSplitHalt)}
                          aria-pressed={chainSplitHalt}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full border transition",
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
                        <div className="pointer-events-none absolute right-0 top-7 z-30 hidden w-56 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[11px] leading-snug text-zinc-700 shadow group-hover:block">
                          {chainSplitHalt
                            ? "Peers compare source and target votes with local BN data. If the data doesn't match they do not participate."
                            : "Peers participate once they receive leader attester data and do not wait for local BN data in that round."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800">
                  {getScenarioSentence(currentScenarioKey, chainSplitHalt)}
                </div>
              </div>
            ) : null}
            <div className="rounded-3xl border-2 border-zinc-900 bg-white p-5 shadow-sm ring-2 ring-zinc-900/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-zinc-900">Validator outcome</div>
                </div>
                {lastRun ? <Pill tone={lastRun.verdict.tone}>{lastRun.verdict.label}</Pill> : <Pill tone="neutral">Start walkthrough</Pill>}
              </div>

              {lastRun ? (
                <div className="mt-3 grid gap-3">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">{lastRun.verdict.explanation}</div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-zinc-600">Start the walkthrough to compute and display the scenario result.</div>
              )}
            </div>

            <div className="rounded-3xl border-2 border-zinc-900 bg-white p-5 shadow-sm ring-2 ring-zinc-900/10">
              <div>
                <div className="text-sm font-bold text-zinc-900">Node details</div>
                <div className="mt-1 text-xs text-zinc-600">Which nodes participate in each round</div>
              </div>

              {lastRun ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 text-xs">
                    {lastRun.sim.attempts.map((_, idx) => (
                      <button
                        key={`round-${idx}`}
                        type="button"
                        onClick={() => setRoundView(idx)}
                        className={cn("rounded-md px-2 py-1 font-semibold transition", roundView === idx ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100")}
                      >
                        R{idx + 1}
                      </button>
                    ))}
                  </div>
                  {reachedRound && reachedRound > 1 ? (
                    <div className="rounded-lg border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
                      Consensus was reached in Round {reachedRound} after Round 1 timeout.
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
                        "rounded-2xl border p-3",
                        onForkB ? "border-rose-300 bg-rose-50/70 shadow-[0_0_18px_rgba(244,63,94,0.2)]" : isLeader ? "border-zinc-900" : "border-zinc-200"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-bold text-zinc-900">Node {i + 1}</div>
                        <div className="flex items-center gap-1">
                          {isLeader ? <Pill tone={onForkB ? "bad" : "dark"}>Leader</Pill> : <Pill tone="neutral">Peer</Pill>}
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

            <div className="rounded-3xl border-2 border-zinc-900 bg-white p-5 shadow-sm ring-2 ring-zinc-900/10">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
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
