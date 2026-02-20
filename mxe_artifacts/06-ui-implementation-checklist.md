# UI Implementation Checklist (Current)

## 1) Guided shell and navigation
- [x] Constrain flow to 3 scenarios only.
- [x] Make left scenario cards directly clickable.
- [x] Use `Start` breathing CTA on Scenario 1 pre-start state.
- [x] Remove explicit `Run`, `Next`, and `Previous scenario` buttons.
- [x] Keep `Restart` action after user starts.
- [x] Lock/blur right panel until a scenario is selected.

## 2) Scenario model and deterministic behavior
- [x] Fixed cluster model is always visible: 4 nodes, threshold 3/4.
- [x] Scenario 1: healthy network (`A A A A`).
- [x] Scenario 2: one node on different chain (`B A A A`).
- [x] Scenario 3: contentious fork (`B B A A`).
- [x] Starting leader deterministic (`N1`) for all scenarios.

## 3) Chain Split Halt control
- [x] Compact `Chain Split Halt` OFF/ON toggle in top overview.
- [x] Explicit OFF/ON labels rendered with toggle.
- [x] Dynamic tooltip copy behind `?` icon based on OFF/ON state.
- [x] Remove extra ON/OFF path prose from the box body.

## 4) Outcomes and panel structure
- [x] Rename outcome panel to `Validator outcome`.
- [x] Keep outcome labels constrained:
- [x] `Attested correct chain`
- [x] `Attested wrong chain`
- [x] `No attestation (safety halt)`
- [x] Remove duplicate leader/result-fork rows from outcome panel.
- [x] Rename node panel to `Node details`.
- [x] Remove nonessential latency copy from node details.
- [x] Keep `Slot trace` as compact round/attempt log.

## 5) Node details clarity improvements
- [x] Add subtitle: `Which nodes participate in each round`.
- [x] Add round selector tabs (`R1..Rn`) that only show available rounds.
- [x] Default round tab to resolved round for successful attestations.
- [x] Add highlighted callout when consensus is reached after rotation.
- [x] Keep leader role and fork state visible per node card.

## 6) Visual semantics and focus
- [x] Apply red styling/glow for Fork B nodes consistently.
- [x] Keep leader indicator consistent across node cards and current round state.
- [x] Use progressive blur/de-emphasis for farther future scenarios in left rail.
- [x] Use consistent strong outlines for right-side analysis panels.

## 7) Content simplification
- [x] Replace `step` language with `scenario` in user-visible copy.
- [x] Remove `Walkthrough recap` section.
- [x] Remove extra explanatory subheading under mission title.
- [x] Keep scenario explainer sentence concise and mode-aware.

## 8) Delivery
- [x] Keep source in `src/ChainSplitHaltLandingPage.jsx`.
- [x] Mirror to `chain_split_halt_landing_page.jsx` for artifact sharing.
- [x] Ensure production build succeeds after each significant UX update.
