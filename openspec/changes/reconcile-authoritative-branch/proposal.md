# Proposal

## Why

Development is split across `a`, `main`, and the newer `afterhack` branch, so there is no trustworthy baseline for subsequent work. The branches must be compared and reconciled deliberately without hiding security regressions or overwriting useful demo behavior.

## What Changes

- Produce a file- and behavior-level comparison of the three branches, including the WebSocket ticket work on `afterhack` and demo behavior on `a`.
- Select one explicitly documented authoritative branch and integration strategy.
- Reconcile changes in bounded commits while preserving repository history and attribution.
- Resolve configuration, documentation, generated-file, API-contract, and simulation-behavior conflicts with recorded rationale.
- Run baseline frontend, backend, and smoke checks on the reconciled result.

### Non-goals

- No feature redesign, broad lint cleanup, Docker/Kubernetes work, production deployment, or Git-history secret purge.
- No automatic assumption that the newest branch is fully correct or secure.

### Change dependencies

- Depends on `remove-and-rotate-exposed-secrets` for the credential-handling policy; reconciliation may be prepared earlier but must not reintroduce exposed values.

## Capabilities

### New Capabilities

- None. This is repository reconciliation with no intended user-visible behavior change.

### Modified Capabilities

- None.

## Impact

Touches Git branches and commits plus divergent versions of `server.py`, `agents.py`, the WebSocket hook, documentation, ignore rules, and generated cache files. The implementation requires explicit approval before merges, rebases, force pushes, or branch deletion.
