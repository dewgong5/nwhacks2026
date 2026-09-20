# Design

## Context

`server.py` owns FastAPI setup, global clients/state, simulation construction, agent execution, WebSocket protocol, chat tools, and provider fallbacks. The simulation/order-book modules already provide a partial domain seam.

## Goals / Non-Goals

**Goals:** isolate change reasons, enable fakes and contract tests, and preserve current client behavior.

**Non-Goals:** distributed simulation or an order-book rewrite.

## Decisions

1. **Adopt an application-factory package.** `main` wires settings, routes, services, and lifespan; imports do not initialize provider clients.
2. **Separate domain, application, adapters, and transport.** Simulation/order book stay provider-agnostic; application services orchestrate sessions; adapters handle LLM/Redis; transport maps HTTP/WebSocket schemas.
3. **Introduce a session registry abstraction.** Initial implementation is in-process and explicitly single-replica, with lifecycle/cancellation owned per session. The interface permits later shared coordination.
4. **Version and validate event schemas.** Preserve current messages through an adapter while moving frontend/backend to typed canonical events.
5. **Characterize before moving.** Tests cover current expected market calculations and event sequences; refactor commits keep behavior stable.
6. **Use structured redacted logging.** Correlation/session IDs replace ad hoc full payload console output.

## Risks / Trade-offs

- [Large refactor obscures regression] → vertical slices and compatibility tests.
- [Duplicate old/new routes drift] → temporary adapter with one canonical service, then delete old path.
- [Single-replica constraint overlooked] → readiness/config validation and deployment documentation.

## Migration Plan

Add package skeleton/settings; extract schemas; wrap provider clients; introduce session service; move chat and WebSocket routes; add application factory/lifespan; switch entry point; remove duplicate legacy code only after contract suite and frontend smoke pass.
