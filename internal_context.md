What happens when Charon has to attest, without the feature being enabled: 1/3 of slot time kicks in (4th second) All charon nodes ask their respective BNs for attester data at the same time In parallel to the above, at the same time, QBFT consensus is started, a leader is chosen and everyone awaits on the leader to supply them with data When a node fetches data (from the request from point 2), it saves it to its DB. If this node is a leader, it also propagates it to the other nodes When a non-leader node receives data from the leader it sends back acknowledgment to the leader and the other nodes. QBFT roundtrips start kicking in, in order for everyone to agree on the same data Once QBFT is finished everyone that participated (at least threshold of peers) has the same type of data (the one from the leader) and they return it to their respective VC. If a node did not participate it simply doesn't have the data When the VC receives it, it signs it and sends the (partial) sig to its respective Charon A Charon node saves it in its DB and sends it to the other peers Once a Charon node receives enough partial sigs, it sends the aggregated sig to the beacon node. In practise multiple Charon nodes send those to their respective BNs [9:20 AM]So, how does this change if we enable chain_split_halt? [9:24 AM]This feature kicks in between point 4 and 5 4. When a node fetches data (from the request from point 2), it saves it to its DB. If this node is a leader, it also propagates it to the other nodes 5. When a non-leader node receives data from the leader it sends back acknowledgment to the leader and the other nodes. QBFT roundtrips start kicking in, in order for everyone to agree on the same data With the feature enabled, when a non-leader node receives the data, it will compare it with the data it fetched by its own BN. Precisely, it will compare the source and target votes (without the head vote). However, that is with the assumption that it already has data from its own BN. If its own BN has not fetched attester data yet, it will hold until it receives it and won't continue further. Not continuing further means it will potentially not participate in QBFT. Or it will start participating later in QBFT (potentially too late). [9:25 AM]If either source or target votes differ, it will simply deduct it missmatches and won't participate in the proposal by this leader. If the leader cannot get enough peers to accept its data (either because their data differs OR because they have not yet fetched it), the round will timeout and the next leader will be chosen[9:30 AM]LMK if that answers your questions. I can give you precise answers, but if you are about to roll out this feature, I think it's better to fully understand its mechanics and implications Kody Sale [9:42 AM] when a non-leader node receives the data, it will compare it with the data it fetched by its own BN. Precisely, it will compare the source and target votes (without the head vote). However, that is with the assumption that it already has data from its own BN. If its own BN has not fetched attester data yet, it will hold until it receives it and won't continue further. Not continuing further means it will potentially not participate in QBFT. Super helpful, okay, so in the scenario where chain_split_halt is NOT enabled, we trust the leaders data. In the scenario where chain_split_halt IS enabled, we compare the leaders source and target votes with our data. So this COULD degrade performance because each node waits to verify the leaders data with their own before they participate in QBFT? Kaloyan Tanev [9:48 AM] exactly [9:51 AM]the actual comparison takes barely any time, what potentially takes more time is waiting on your BN imagine the leader's BN takes 150ms to fetch attester data and 100ms to send it to some other peer A (in total 250ms) then if this peer A's BN takes 350ms to fetch attester data, it will slow down the consensus by 100ms (edited) Kody Sale [9:55 AM] Understood. What I was missing was the fact that without this feature enabled, peers don't wait to recieve data from their own node. Participating in QBFT depends on whether or not you've received the leaders data. (edited) Kaloyan Tanev [9:57 AM] peers don't have to have received data from their own nodecorrect, they still do ask their BN for data, receive it and store it, but it's not utilised in any way it's utilised in the case current leader timeouts and they turn out to be the next leader

---

User Journey (Landing Page v1)

1. Entry and framing
- User lands on the page and immediately sees the core claim: do not sign through a chain split.
- They get the outcome status right away: "Attestation produced" or "No attestation."

2. Mental model in the hero
- User reads the short explanation of what `chain_split_halt` does.
- They understand the key branch:
- OFF: peers participate when leader attester data arrives.
- ON: peers compare source + target votes (excluding head), may wait on local BN, and may not participate.

3. Interactive validation
- User toggles `chain_split_halt`, cluster size, quorum, and leader.
- User applies scenarios (all A, split forks, leader minority, slow BN tail).
- User runs one slot and sees the outcome plus a trace log.

4. Evidence in the simulator
- User checks the flow panel for where the process changes.
- User checks per-node cards for participation status:
- "Match -> participates"
- "Mismatch -> does not participate"
- "Waiting on BN"
- User learns that waiting on BN affects liveness more than the comparison itself.

5. Context and motivation
- User scrolls to "Why this exists" to connect the mechanism to Holesky/chain-split/slashing risk.
- User reads OFF vs ON mechanics in plain language.

6. Decision support
- User reviews benefits and tradeoff:
- Safety gain: avoid wrong-fork participation.
- Cost: possible timeout/missed attestations due to BN wait.
- User sees enablement snippet and FAQ to decide rollout posture.

7. Intended conversion
- User leaves with one clear operational understanding:
- `chain_split_halt` is a safety-first mode that intentionally trades some liveness under split/latency stress.
