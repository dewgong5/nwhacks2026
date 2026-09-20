# Tasks

## 1. Image Boundaries

- [ ] 1.1 Add minimal build contexts and ignore rules for frontend/proxy and backend; verify Git, local environments, caches, and credentials are absent from build context inspection.
- [ ] 1.2 Add a multi-stage frontend build and unprivileged static/proxy runtime; verify image build, non-root identity, static health, and asset serving.
- [ ] 1.3 Add a locked, non-root backend image with graceful shutdown; verify import/startup, health endpoints, signal handling, and no embedded secrets.

## 2. Compose Runtime

- [ ] 2.1 Replace client hard-coded backend locations with same-origin routing; verify local container API and WebSocket connections require no rebuild-time host value.
- [ ] 2.2 Add proxy routing for frontend, API, health/ticket, and WebSocket upgrade with request forwarding policy; verify HTTP and WebSocket smoke tests.
- [ ] 2.3 Add base/development Compose services for proxy, backend, and Redis with health dependencies; verify deterministic stack startup from a clean checkout.
- [ ] 2.4 Add production override with immutable images, restart/resource policy, external configuration, and no code bind mounts; verify rendered config contains no populated secret or development mount.

## 3. Verification and Operations

- [ ] 3.1 Add automated image/config checks for non-root runtime, health, target architecture, image contents, and secrets; verify a synthetic bad image/config is rejected.
- [ ] 3.2 Run a browser deterministic journey through the published proxy and simulate backend/Redis restart; verify recovery/fail-closed behavior and record browser/runtime evidence separately.
- [ ] 3.3 Document build, start, stop, upgrade, rollback, logs, storage policy, and troubleshooting; verify another clean environment can follow the runbook.
- [ ] 3.4 Run repository gates, strict OpenSpec validation, Compose config validation, and `git diff --check`; record that container proof is not deployment proof.
