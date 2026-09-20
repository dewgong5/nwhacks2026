# Proposal

## Why

`server.py` currently combines configuration, HTTP routes, WebSockets, simulation lifecycle, global market state, provider calls, and chat tooling. This makes security changes difficult to review and prevents meaningful isolated testing.

## What Changes

- Introduce a backend package with explicit configuration, API, WebSocket, simulation, provider, and domain boundaries.
- Move code incrementally behind compatibility-preserving interfaces while retaining existing client event contracts.
- Replace process-global coordination with an explicit session/service abstraction, initially supporting a documented single-replica deployment.
- Add typed event/request models, dependency injection, fake providers, and focused unit/integration/contract tests.
- Add structured, redacted logs and lifecycle cleanup for disconnects, cancellation, and provider timeouts.

### Non-goals

- No new end-user feature, UI redesign, multi-replica distributed simulation, provider change, or deployment.
- No simultaneous rewrite of the order-book domain unless characterization tests identify a defect.

### Change dependencies

- Depends on `reconcile-authoritative-branch` and `restore-repository-quality-baseline`; must preserve deterministic demo and protected-AI contracts if those changes land first.

## Capabilities

### New Capabilities

- None. This is a compatibility-preserving refactor and testability change.

### Modified Capabilities

- None.

## Impact

Primarily affects `server.py`, `backend/`, provider construction in `agents.py`/`custom_agent.py`, shared schemas, Python dependencies, and backend tests. Frontend changes are limited to contract fixes discovered through characterization.
