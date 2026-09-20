# Proposal

## Why

Chat and live-agent requests can spend provider quota and are currently reachable without a durable identity, distributed quota, or global budget guard. The demo needs defense in depth so anonymous traffic cannot create unbounded cost even if the front-door control is bypassed.

## What Changes

- Gate chat and live-AI simulation features behind a server-validated demo identity/session.
- Add Redis-backed per-identity, per-IP, concurrency, and global daily quotas with atomic accounting.
- Bound prompt length, conversation history, simulation ticks, request size, provider timeout, and retry behavior.
- Issue authenticated short-lived WebSocket tickets with no unauthenticated fallback.
- Restrict origins and trusted proxy handling; return stable quota/authentication errors without leaking provider details.
- Add provider-budget configuration, audit-safe usage metrics, and deterministic fallback behavior.

### Non-goals

- No general-purpose user account system, subscription billing, permanent recruiter database, UI redesign, or deployment-provider configuration.
- No reliance on browser-only checks or in-memory counters as the authoritative limit.

### Change dependencies

- Depends on `remove-and-rotate-exposed-secrets` and `add-deterministic-demo-mode`; backend modularization may be coordinated but is not required to define the behavior.

## Capabilities

### New Capabilities

- `protected-ai-access`: Server-side authorization, durable rate/cost quotas, bounded input, secure WebSocket admission, and deterministic fallback for paid AI features.

### Modified Capabilities

- None.

## Impact

Touches `/api/chat`, `/ws-ticket`, `/ws`, simulation start commands, reverse-proxy trust configuration, provider clients, Redis, frontend mode/quota states, and security-focused tests.
