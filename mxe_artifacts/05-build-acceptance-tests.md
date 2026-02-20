# Build Acceptance Tests (Current)

## Journey
- User can understand and operate the experience without external docs.
- User can navigate only through left-side scenario cards.
- Right panel is locked/blurred until start action.

## Correctness
- Scenario 1 (`A A A A`) produces `Attested correct chain` with OFF and ON.
- Scenario 2 (`B A A A`) produces:
- OFF: `Attested wrong chain`
- ON: `Attested correct chain` via leader rotation (multi-round)
- Scenario 3 (`B B A A`) produces:
- OFF: `Attested wrong chain` (given starting leader on Fork B)
- ON: `No attestation (safety halt)`
- Slot trace reflects attempt progression and timeout/rotation when applicable.

## UX quality
- Exactly 3 scenarios are visible on left rail.
- No separate `Run`, `Next`, or `Previous scenario` buttons.
- `Chain Split Halt` control is a compact OFF/ON toggle with hover `?` info.
- `Validator outcome`, `Node details`, `Slot trace` titles match current naming.
- Node details round tabs show only available rounds.
- Highlighted consensus callout appears when resolution occurs after Round 1 timeout.
- Fork B nodes are consistently highlighted in red styling across panels.

## Copy quality
- Uses `scenario` terminology consistently.
- Uses `consensus` wording in explanatory callout.
- Avoids duplicate or conflicting labels in outcome panel.

## Layout and responsiveness
- Desktop: left rail + right analysis layout is stable.
- Mobile: cards, toggle, round tabs, and node cards remain readable and tappable.

## Measurement readiness
- Required events in `04-measurement-spec.md` can be emitted with needed props.

## Performance
- State transitions on scenario/toggle changes are immediate and stable.
- No visible jank in panel updates.
