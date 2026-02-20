MXE Core Operations Outline (execution-first draft)
this is the internal “how we ship” backbone. no history, no philosophy. just the operating system we’ll use to build MXE artifacts, ship them, measure them, and compound them.



0) What MXE is (operational definition)
Marketing Experience Engineering (MXE) is the practice of building interactive, on-brand, product-quality digital experiences that educate users through a clearly defined user journey and actions, in a world shaped by short attention spans.
An MXE artifact is successful when:
	•	it teaches something meaningful (education is built in)
	•	it feels like the brand (voice, visuals, behavior)
	•	it keeps momentum through a clear journey (users know what to do next)
	•	it drives a measurable outcome (even if the metric is “learning completed”)
	•	it’s built from a thesis and shipped through a repeatable framework



1) MXE principles (used as checkpoints, not vibes)
These principles are gates. they prevent wasted builds.
	1	Always interactive — the user does something.
	2	Education is built in — each step teaches, not just entertains.
	3	On-brand by design — brand shows up in tone, visuals, and behavior.
	4	Clear user journey and actions — users always know what to do next.
	5	Quality over quantity — ship fast, but don’t ship jank.
	6	Measured success — every artifact has a success signal.
	7	Thesis-led — hypothesis + plan before build.
	8	Campaign-optional — can be evergreen or campaign-tied.
	9	Product-optional — can teach brand promise/story/beliefs, not only product.
	10	Framework-bound — built via the MXE process and artifacts below.



2) Taxonomy of MXE artifacts (so we don’t argue)
This taxonomy drives: design decisions, metrics, and “what good looks like.”
A) Utility
promise: “give me an answer or output i couldn’t easily get otherwise.” mechanism: compute/transformation. examples: ROI calculator, forecasting tool, planner, configurator, generator. north star: output completion + downstream action.
B) Diagnostic
promise: “tell me what situation i’m in and what to do next.” mechanism: structured questions → classification → recommendation. examples: audit, assessment, troubleshooting flow, readiness check. north star: completion + recommendation click-through + lead quality (if gated).
C) Product Walkthrough (formerly “simulator”)
promise: “let me experience how the product works without reading docs.” mechanism: guided interactive demo/sandbox/proof steps. examples: interactive demo, guided sandbox, feature tour with actions. north star: key-step reach + signup/activation intent.
D) Narrative
promise: “help me understand what’s true and why it matters.” mechanism: interactive learning ladder; sequenced reveal. examples: interactive brand story, case study journey, belief ladder. north star: completion + recall proxies (share, return, message test).
E) Challenge
promise: “this is fun and i want to finish / come back.” mechanism: game-like progression, rewards, repeat loops (ethically). examples: quests, mini-games, streak challenges, puzzles. north star: repeat rate + completion + share + conversion.
System Pattern (not a category): Orchestrator (Hub/Room)
A container that routes users through multiple artifacts. treat as packaging, not a single artifact type.



3) The MXE craft stack (5 skills to develop)
These are the core competencies we’ll evaluate ourselves against.
	1	Taste + Standards Set the quality bar. know what to cut. keep it clean.
	2	Experience Design (clear journey + actions) Design the path. one primary action per step. reduce cognitive load. keep momentum.
	3	Product Translation (PM + UX sense) Turn product complexity into interaction. simplify without lying. prioritize proof.
	4	Story + Brand Fidelity Make it feel like the brand. use narrative to carry learning. hook → reveal → payoff.
	5	Systems Thinking (thesis, measurement, iteration, library) Make it compound. define success. learn fast. template what works.
(prompt engineering is assumed as a build tactic inside Step 4; it’s required, but not one of the five leadership-defining skills.)



4) MXE Build Loop (the framework we execute)
Steps: Thesis + Education Plan → Experience Design → Context Pack → Build → Launch/Distribute/Measure → Iterate/Library (recommended)
Step 1 — Thesis + Education Plan
time: ~1 hour of hard thinking output: Thesis.pdf (1–2 pages)
Thesis.pdf template (required)
	1	Artifact name (user-facing)
	2	Artifact type: MXE Brand Asset or MXE Product Asset
	3	Audience: who exactly
	4	Pain points: confusion/friction we’re solving
	5	Desired end outcome: what they know/believe/can do after
	6	Why MXE vs static: what interactivity unlocks here
	7	Core messages: 3–5 truths we must land
	8	Education plan (learning ladder): 3–7 learnings in order
	9	Hypothesis: if we build X, then Y because Z
	10	Success signals: 1 primary + 2 secondary; define targets if possible
	11	Distribution entry point: where users start
	12	Constraints: time, tooling, legal, mobile, brand rules
	13	Stop test: reasons not to build MXE for this goal
Step 1 checkpoint (principles)
thesis-led ✅ measured ✅ education ✅ “is MXE needed?” ✅



Step 2 — Experience Design (Journey + UI/UX + Creative Direction)
time: 1–3 hours (varies) output: Experience-Design.pdf (3–6 pages)
Experience-Design.pdf template (required)
A) Journey blueprint
	1	Start state → End state
	2	Step map (5–9 steps max) For each step:
	•	step name
	•	user action (one primary action)
	•	learning delivered (from ladder)
	•	what they see (UI elements)
	•	friction risks
	•	event to track
	3	Payoff: final output/reveal/proof
	4	CTA path: soft CTA + hard CTA
	5	Drop-off handling: what happens if they quit mid-way
B) UI/UX + Creative Direction 6) Look + feel: 3 bullets (brand vibe) 7) Screen list: start screen, step screens, payoff, CTA 8) Interaction ingredients: list interactive elements + keep count intentional 9) Voice rules: tone, microcopy style, do/don’t list 10) Quality bar: mobile, speed, clarity, accessibility basics



Step 3 — Context Pack (fill the model’s brain)
time: 30–90 min depending on org maturity output: Context-Pack (folder, or zip, etc)
Frequent Context-Pack Contents (required)
	1	Source of truth: docs, messaging, pricing, FAQ, approved claims
	2	Brand kit: logo, colors, type, components/tokens if any
	3	Proof assets: stats, screenshots, testimonials, case studies
	4	Legal/disclaimers: what can’t be said
	5	Inspiration references (optional): “make it feel like this” + “avoid this”
	6	Measurement spec: event names + properties + where it logs



Step 4 — Build (LLM / vibe-code execution)
time: 1–6 hours depending on complexity + iteration output: working artifact + instrumentation
Upload Artifacts
	•	Thesis.pdf
	•	Experience-Design.pdf
	•	Context Pack Folder
Base MXE prompt - TBD
	1	objective + artifact category
	2	non-negotiables (principles + must-follow journey)
	3	inputs (where docs are)
	4	build requirements (responsive, fast, accessible basics)
	5	instrumentation requirements (events + properties)
	6	deliverables (deployable build + analytics firing)
	7	acceptance tests (what must be true)
Build exit criteria (definition of done)
	•	journey implemented as designed
	•	mobile works
	•	fast enough (no sluggish UI)
	•	brand fidelity passes
	•	events fire correctly
	•	payoff + CTA work



Step 5 — Launch / Distribute / Measure
	•	Ship
	•	Measure 
	•	Report
6) How we evaluate an MXE artifact (scorecard)
	1	clarity: users always know what to do next
	2	education: each step teaches, not just entertains
	3	brand: it feels like us
	4	quality: no jank, fast enough, mobile works
	5	measurement: success signal exists + events fire
	6	outcome: did it move the intended metric or learning completion?
	7	reusability: can we template any part?
