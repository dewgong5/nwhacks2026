# Design

## Context

The frontend and backend are launched separately; the client currently embeds backend URL assumptions. Production needs one origin for static files, API, and WebSocket traffic, plus Redis for durable quotas.

## Goals / Non-Goals

**Goals:** reproducible non-root images, a same-origin proxy, explicit configuration, health checks, and local production-like smoke tests.

**Non-Goals:** orchestrator-specific manifests or public deployment.

## Decisions

1. **Use two application images plus Redis.** A multi-stage Node build produces static assets served by an unprivileged proxy image; a Python image runs the FastAPI application.
2. **Proxy a single origin.** `/api`, health/ticket routes, and `/ws` route internally; WebSocket upgrade and request IDs are configured explicitly.
3. **Use base plus production override Compose files.** Development may bind source/use Vite; production uses immutable images, restart/resource policy, and no code mounts.
4. **Run as non-root with minimal contexts.** `.dockerignore` excludes Git, environments, caches, tests where appropriate, and local artifacts. Dependencies are installed from locked inputs.
5. **Separate liveness and readiness.** Backend readiness reflects required dependencies per feature policy; proxy health verifies local serving, not downstream provider health.
6. **Do not persist simulation state.** Redis persistence policy is documented for quota durability; application sessions remain ephemeral.

## Risks / Trade-offs

- [Non-root proxy needs port changes] → bind an unprivileged internal port and publish externally.
- [Platform-specific native packages] → build/test target architectures explicitly.
- [Health dependency cycles] → use dependency conditions only for startup convenience; application retries remain bounded.

## Migration Plan

Add ignore/build files; make client URLs same-origin; add health endpoints; create base/dev Compose; add production override/resource policy; add Redis; run build/config/image scans and deterministic browser smoke; document operations.
