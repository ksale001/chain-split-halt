# Context Pack Spec (Current)

## 1) Source of truth
- `internal_context.md` for mechanics and language constraints
- `src/ChainSplitHaltLandingPage.jsx` for current production copy and interaction behavior
- Approved docs/FAQ for distributed validators and Charon terminology

## 2) Product copy inventory to preserve
- Scenario names:
- `Healthy network`
- `One node on a different chain`
- `Contentious fork (2v2)`
- Outcome labels:
- `Attested correct chain`
- `Attested wrong chain`
- `No attestation (safety halt)`
- Node details helper copy:
- `Which nodes participate in each round`
- Rotation callout:
- `Consensus was reached in Round X after Round 1 timeout.`

## 3) Brand kit
- Tailwind tokens currently used in app
- Obol visual guidance when available:
- Logos
- Color tokens
- Typography rules

## 4) Proof assets
- Holesky/Pectra chain split trigger summary
- Internal technical excerpts used for exact terminology
- Approved material on client-diversity risk reduction and supermajority failure modes
- Optional screenshots of scenario states for distribution channels

## 5) Legal/disclaimers
- Do not present as slashing-proof guarantee
- Keep wording scoped to mechanism and modeled conditions
- Include educational simulation framing where required by channel

## 6) Voice and terminology guardrails
- Prefer `scenario` over `step` in user-facing copy
- Prefer `consensus` terminology in explanatory copy
- Avoid duplicate/conflicting labels that increase cognitive load

## 7) Measurement spec pointer
- See `04-measurement-spec.md`

## Open gaps
- Approved brand kit assets are not yet in repo
- Final legal copy constraints are not fully documented
- Distribution-specific UTM conventions not yet defined
