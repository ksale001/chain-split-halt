# Measurement Spec (Current)

## Primary success metric
- `learning_completed`
- Definition: user views all 3 scenarios and toggles `chain_split_halt` at least once in the same session.

## Secondary metrics
- `scenario_interaction_rate`: clicked at least 1 scenario card.
- `full_scenario_coverage_rate`: viewed all 3 scenario cards.
- `mode_comparison_rate`: toggled ON/OFF at least once.
- `multi_round_inspection_rate`: viewed Scenario 2 with ON and selected at least one round tab.

## Event list

1. `mxe_page_view`
- Props:
- `artifact_name`: `"chain_split_halt_walkthrough"`
- `artifact_type`: `"product_walkthrough"`

2. `mxe_scenario_select`
- Props:
- `scenario_id`: `"healthy_network" | "single_divergent_node" | "contentious_fork_2v2"`
- `scenario_index`: `1 | 2 | 3`

3. `mxe_toggle_change`
- Props:
- `control`: `"chain_split_halt"`
- `value`: `"on" | "off"`
- `scenario_id`

4. `mxe_round_select`
- Props:
- `scenario_id`
- `round_index`: number (1-based)
- `mode`: `"on" | "off"`

5. `mxe_restart`
- Props:
- `from_scenario_index`: `1 | 2 | 3`
- `mode_last_used`: `"on" | "off"`

6. `mxe_outcome_rendered`
- Trigger: when a scenario + mode state is computed and displayed.
- Props:
- `scenario_id`
- `mode`: `"on" | "off"`
- `leader_id`: `"N1" | "N2" | "N3" | "N4"`
- `result_outcome`: `"attested_correct_chain" | "attested_wrong_chain" | "no_attestation_safety_halt"`
- `attempt_count`: number

7. `learning_completed`
- Trigger:
- all three `scenario_id` values have been viewed
- plus at least one `mxe_toggle_change`
- Props:
- `scenarios_viewed_count`
- `mode_last_used`
- `scenario_last_used`

## Funnel
1. `mxe_page_view`
2. `mxe_scenario_select`
3. `mxe_toggle_change`
4. `mxe_outcome_rendered`
5. `learning_completed`

## Instrumentation notes
- Fire events client-side.
- Debounce repeated `mxe_outcome_rendered` emissions for identical scenario+mode states.
- Use a session id for completion logic.
