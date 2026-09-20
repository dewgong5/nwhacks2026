# Design

## Context

Market movement, news, and several agent decisions currently use randomness and external LLMs. The WebSocket start command supplies ticks and delay, while the server constructs agents directly inside one simulation function.

## Goals / Non-Goals

**Goals:** make a compelling scenario reproducible and provider-independent without disguising scripted behavior as live AI.

**Non-Goals:** prove market realism or remove live mode.

## Decisions

1. **Make mode, scenario version, and seed server-owned session inputs.** Clients may select supported values but cannot upload executable fixtures or provider configuration.
2. **Use one domain event stream for deterministic and live modes.** The UI consumes the same typed events with added provenance metadata, avoiding parallel products.
3. **Inject market/news/decision providers.** A deterministic provider reads versioned fixtures and seeded generators; live providers remain behind the same bounded interface.
4. **Curate a short narrative.** A checked-in scenario contains an opening baseline, meaningful news, differentiated agent response, turning point, and completion within the target duration.
5. **Compare normalized event sequences in tests.** Transport timestamps and random session IDs are excluded; economic/domain values and ordering are asserted.
6. **Fallback requires visitor intent.** Provider failure offers demo mode rather than silently switching an active live session.

## Risks / Trade-offs

- [Demo feels fake] → transparent labeling and rationale; show architecture rather than claiming model spontaneity.
- [Fixture drifts from event schema] → schema validation and replay tests.
- [Seeded code still depends on global random state] → pass dedicated random sources through simulation boundaries.

## Migration Plan

Define mode/event provenance; extract providers; add fixture schema and first scenario; add normalized replay tests; expose mode selection; implement failure/replay states; browser-test the timed journey. Live mode remains behind a feature flag during migration.
