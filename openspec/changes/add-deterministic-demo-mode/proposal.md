# Proposal

## Why

The current demo depends on external model availability and nondeterministic market behavior, making the portfolio experience costly and unreliable. Recruiters need a repeatable 60–90 second experience that works without provider credentials while still demonstrating the system design.

## What Changes

- Add an explicit deterministic demo mode selected server-side and visible in the UI.
- Introduce seeded market, news, agent-decision, and leaderboard fixtures that produce a curated narrative.
- Define a provider abstraction with deterministic fake implementations for demo and automated tests.
- Keep live AI mode separate and never silently represent deterministic output as live model output.
- Support restart/replay with the same seed and bounded session duration.
- Provide graceful fallback messaging when paid providers are unavailable or disabled.

### Non-goals

- No authentication, Redis quota system, visual overhaul, deployment, or removal of live AI mode.
- No claim that deterministic behavior models real financial markets or provides financial advice.

### Change dependencies

- Depends on `reconcile-authoritative-branch` and benefits from `restore-repository-quality-baseline`; must preserve secret-safe configuration.

## Capabilities

### New Capabilities

- `deterministic-demo-session`: Repeatable, provider-independent simulation sessions with explicit mode labeling, replay, and graceful degradation.

### Modified Capabilities

- None.

## Impact

Touches the simulation orchestrator, agent/provider construction, news generation, WebSocket start command and events, frontend state/controls, fixtures, and regression tests.
