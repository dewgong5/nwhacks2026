# Proposal

## Why

The current dashboard exposes many similarly weighted panels at once and does not guide a first-time reviewer through the product story. The portfolio version should make setup, a meaningful market event, agent reasoning, and the result understandable within 60–90 seconds.

## What Changes

- Create a focused pre-session briefing and concise agent-strategy builder with strong presets.
- Clearly label deterministic demo versus protected live AI modes and their availability.
- Recompose the live dashboard around chart, key event, agent rationale, and leaderboard hierarchy.
- Add polished loading, disconnected, reconnecting, provider-unavailable, quota-exhausted, empty, and completed states.
- Add agent-trade explanation affordances, replay, end-of-session summary, and post-market analysis.
- Meet keyboard, focus, contrast, reduced-motion, responsive laptop, and mobile acceptance criteria.

### Non-goals

- No backend provider rewrite, authentication implementation, containerization, deployment, or invented performance/financial claims.
- No requirement to redesign unused generated UI primitives.

### Change dependencies

- Depends on `add-deterministic-demo-mode`; should consume stable session/event contracts from `modularize-and-test-backend` and quota states from `protect-cost-bearing-ai-features` when available.

## Capabilities

### New Capabilities

- `guided-demo-experience`: A coherent, accessible, responsive demo journey from strategy selection through explainable results and replay.

### Modified Capabilities

- None.

## Impact

Touches the main page composition, profile builder, simulation controls, chart/market/activity panels, result and analysis components, frontend state/events, CSS/design tokens, accessibility tests, and browser visual evidence.
