# Tasks

## 1. Contracts and Provider Boundaries

- [ ] 1.1 Define validated mode, scenario version, seed, provenance, and canonical event schemas; verify invalid mode/scenario inputs are rejected by schema tests.
- [ ] 1.2 Introduce injectable market, news, and decision provider interfaces around current behavior; verify existing characterized live behavior still passes without UI contract changes.
- [ ] 1.3 Add a deterministic random-source boundary and remove relevant global randomness; verify identical seeds produce normalized identical event streams.

## 2. Curated Demo Scenario

- [ ] 2.1 Define and validate a versioned 60–90 second scenario fixture with market baseline, pivotal news, differentiated decisions, and final result; verify fixture schema and asset references pass.
- [ ] 2.2 Implement deterministic providers and completion/replay behavior; verify no provider client or outbound request is invoked in deterministic tests.
- [ ] 2.3 Add limits for ticks, events, duration, reconnect/restart semantics, and exactly-once completion; verify timeout, invalid seed, disconnect, and replay tests.

## 3. Frontend Experience and Evidence

- [ ] 3.1 Add mode selection and persistent deterministic/live provenance labels; verify component tests never label deterministic decisions as live AI.
- [ ] 3.2 Add explicit provider-unavailable handling that offers intentional fallback without silent switching; verify simulated provider failures produce the specified state.
- [ ] 3.3 Run backend/frontend tests, build, lint, strict OpenSpec validation, and a credential-free browser journey twice with the same seed; verify normalized results match and record browser evidence separately.
