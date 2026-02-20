# Thesis (Current)

## 1) Artifact name
Chain Split Halt: Interactive Product Walkthrough

## 2) Artifact type
MXE Product Asset (Product Walkthrough)

## 3) Audience
- Node operators evaluating Obol product features
- Capital allocators assessing supermajority safety risks
- Internal GTM teams needing a clear explainer asset
- Teams evaluating client-diversity and fault-tolerance posture

## 4) Pain points
- Confusion about what `chain_split_halt` does in practice
- Misunderstanding of OFF vs ON behavior under different fork conditions
- Limited intuition for leader effects and round rotation

## 5) Desired end outcome
After using the artifact, users can explain:
- What happens when `chain_split_halt` is OFF vs ON
- Why source and target mismatch leads to non-participation when ON
- How leader selection can influence OFF behavior
- Why the feature may halt attestations in contentious fork conditions
- The practical safety-vs-liveness tradeoff

## 6) Why MXE vs static
- Interactivity is required to understand consensus dynamics and leader rotation.
- A static page cannot demonstrate scenario-dependent outcomes clearly.

## 7) Core messages
- `chain_split_halt` is safety-first behavior during fork disagreement.
- OFF is more liveness-oriented and can follow wrong-fork leader data.
- ON gates participation by comparing leader data against local BN data.
- In contentious 2v2 conditions at 3/4 threshold, ON can intentionally halt attestation.
- Leader timeout and rotation can recover correct-chain attestation when healthy majority exists.

## 8) Education plan
1. Learn baseline behavior in a healthy network.
2. Compare OFF vs ON in a single-divergent-node scenario.
3. Observe contentious-fork outcome where safety halt is expected.

## 9) Hypothesis
If we provide a constrained, scenario-driven walkthrough with clear outcomes, users will correctly understand `chain_split_halt` mechanics and trust the feature intent, because they can see direct cause-and-effect instead of reading abstract docs.

## 10) Success signals
Primary:
- Learning completion rate: users view all 3 scenarios and toggle ON/OFF at least once.

Secondary:
- Scenario interaction rate (at least one scenario card click)
- Full scenario coverage rate (all 3 scenarios viewed)
- ON/OFF comparison rate (toggle changed at least once)

## 11) Distribution entry points
- Embedded in product marketing page
- Shared in technical threads addressing feature questions
- Linked from docs/change announcements

## 12) Constraints
- Web-first readability and fast load
- Claims must align with internal technical context
- Interaction surface remains intentionally small (fixed 4-node, 3/4 model)

## 13) Stop test
Do not continue with MXE if:
- Technical correctness cannot be maintained
- Instrumentation cannot be added
- Interaction complexity grows beyond core educational goals
