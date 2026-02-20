# Experience Design (Current)

## A) Journey blueprint

### 1) Start state -> End state
- Start: user has partial understanding of chain split risk and limited intuition for how leader choice and fork alignment affect outcomes.
- End: user can explain when `chain_split_halt` prevents wrong-chain attestations and when it intentionally halts attestations under contention.

### 2) Journey model
- Guided-first experience with constrained controls.
- Fixed simulation model across the full experience: 4-node cluster, threshold 3/4.
- Three scenarios only:
1. Healthy network
2. One node on a different chain
3. Contentious fork (2v2)
- Each scenario is explored with the `Chain Split Halt` toggle (`OFF`/`ON`) rather than separate ON/OFF steps.

### 3) Navigation and control model
- Left panel is the primary navigation.
- Scenario cards (`1`, `2`, `3`) are directly clickable.
- Initial CTA is a breathing `Start` indicator on Scenario 1.
- After start, scenario cards show status (`Now`, `Done`, `View`).
- No separate `Run`, `Next`, or `Previous scenario` button.
- Right panel is blurred/locked before the user starts.

## B) Screen and interaction spec

### 4) Left panel (walkthrough rail)
- Title: product-specific mission statement focused on Obol Chain Split Halt.
- Scenario list:
- Scenario 1: `Healthy network`
- Scenario 2: `One node on a different chain`
- Scenario 3: `Contentious fork (2v2)`
- Progressive de-emphasis:
- As user advances, farther-future scenarios become lightly blurred to reduce distraction.
- `Restart` control is available after the walkthrough begins.

### 5) Top-right overview block
- Compact status area with:
- `Scenario X of 3` pill
- `Chain Split Halt` toggle with explicit `OFF` and `ON` labels
- `?` info icon with hover tooltip
- Tooltip text is dynamic by mode:
- OFF: `Peers participate once they receive leader attester data and do not wait for local BN data in that round.`
- ON: `Peers compare source and target votes with local BN data. If the data doesn't match they do not participate.`
- One-line scenario explainer below toggle (short heading-style sentence).

### 6) Right-side analysis panels
- Panel 1: `Validator outcome`
- Shows one clear outcome label:
- `Attested correct chain`
- `Attested wrong chain`
- `No attestation (safety halt)`
- Shows concise explanation sentence only (leader/result fork duplicates removed).

- Panel 2: `Node details`
- Subtitle: `Which nodes participate in each round`
- Round selector is dynamic:
- Shows only rounds that exist for that simulation (`R1`, `R2`, etc.).
- Defaults to the resolved round if attestation succeeds.
- If attestation resolves after rotation, show highlighted context line:
- `Consensus was reached in Round X after Round 1 timeout.`
- Per-node cards show:
- Node number
- Role (`Leader`/`Peer`)
- Fork (`A`/`B`)
- Participation status (`Participates` / `Does not participate`)

- Panel 3: `Slot trace`
- Compact textual trace of scenario, mode, and attempt-by-attempt leader progression.

### 7) Visual semantics
- `Fork B` is consistently treated as wrong-chain risk state.
- Any node on Fork B uses red-tinted treatment and glow across panels.
- Leader indicator in top-level outcome context and node cards is consistent.
- Outline/ring styling is consistent across the three right-side panels.

## C) Deterministic scenario definitions

### 8) Scenario 1: Healthy network
- Node forks: `A A A A`
- Starting leader: `N1`
- OFF expected outcome: `Attested correct chain`
- ON expected outcome: `Attested correct chain`
- Purpose: establish baseline mechanics and show that safety checks do not alter healthy outcome.

### 9) Scenario 2: One node on a different chain
- Node forks: `B A A A` (Node 1 diverged due to client bug/misconfiguration class of issue)
- Starting leader: `N1`
- OFF expected outcome: `Attested wrong chain` (leader-sensitive behavior)
- ON expected outcome: `Attested correct chain` after leader rotation (Round 1 timeout, Round 2 success)
- Purpose: teach why ON blocks wrong-fork participation and preserves correct-chain outcome when healthy majority exists.

### 10) Scenario 3: Contentious fork (2v2)
- Node forks: `B B A A`
- Starting leader: `N1`
- OFF expected outcome: `Attested wrong chain` (if leader is on Fork B)
- ON expected outcome: `No attestation (safety halt)` because 3/4 threshold cannot be reached.
- Purpose: make safety-vs-liveness tradeoff explicit under true contention.

## D) Content and copy rules

### 11) Terminology
- Use `scenario` (not `step`) for user-facing flow labels.
- Use `consensus` terminology in user-visible explanatory copy.
- Keep protocol wording direct and avoid deep jargon.

### 12) Simplicity constraints
- Keep control surface minimal:
- Scenario select, ON/OFF toggle, round tabs, restart.
- Do not reintroduce dense helper copy, recap wall-of-text, or duplicate status fields.
- Prioritize one clear takeaway per panel.

### 13) Completion objective
- Success in-session means user has:
1. Viewed all three scenarios
2. Toggled ON/OFF at least once
3. Seen at least one multi-round resolution case (Scenario 2 ON) and one safety halt case (Scenario 3 ON)
