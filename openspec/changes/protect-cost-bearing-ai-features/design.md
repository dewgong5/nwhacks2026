# Design

## Context

Current chat and WebSocket simulation entry points can reach providers without durable quotas. `backend/chat_api.py` has an in-memory IP limiter, while the main `server.py` chat path lacks equivalent enforcement. The `afterhack` ticket draft trusts forwarding headers and permits raw fallback.

## Goals / Non-Goals

**Goals:** fail closed before provider spend, enforce consistent quotas across restarts, and retain deterministic access.

**Non-Goals:** build general customer identity or depend on obscurity/private URLs.

## Decisions

1. **Use edge identity plus application authorization.** The edge may authenticate, but the backend validates signed identity/capability data or an application session before paid work.
2. **Use Redis atomic operations for quota reservations.** Reserve before provider calls, finalize usage afterward, and use TTLs/idempotency keys to handle retries. In-memory counters are only test fakes.
3. **Model limits as policy configuration.** Per-identity/IP/day, global/day, concurrency, bytes, turns, tokens, ticks, timeouts, and retries have conservative defaults and absolute server maxima.
4. **Issue short-lived single-use WebSocket tickets.** Bind to session, origin, purpose, and expiry; never fall back to raw protected access.
5. **Trust proxy headers only from configured peers.** Direct clients cannot choose quota identity through `X-Forwarded-For`.
6. **Keep prompts out of default logs.** Record correlation, category, model, quota units, latency, and redacted error class.

## Risks / Trade-offs

- [Redis outage blocks paid demo] → fail closed for paid features and keep deterministic mode independent.
- [Shared-IP recruiters collide] → identity is primary, IP is secondary abuse control.
- [Edge bypass reaches origin] → firewall/tunnel origin and still validate authorization in app.
- [Quota reservation leaks on crash] → expirations and reconciliation metrics.

## Migration Plan

Add policy/config models and Redis fake; wrap providers with authorization/quota admission; protect chat; replace WebSocket tickets; add frontend error states; exercise races and failures locally; later verify edge identity and provider limits separately in deployment.
