# Tasks

## 1. Characterization and Structure

- [ ] 1.1 Add characterization tests for market calculations, order/portfolio behavior, HTTP chat, WebSocket commands/events, completion, and disconnect cleanup; verify they pass against the pre-refactor entry point.
- [ ] 1.2 Create the backend application package, factory, lifespan, and typed settings without moving behavior; verify import and health smoke tests have no provider side effects.
- [ ] 1.3 Define typed transport/event schemas and a compatibility adapter for current frontend messages; verify recorded protocol fixtures round-trip.

## 2. Extract Responsibilities

- [ ] 2.1 Move provider construction behind injected adapters with deterministic fakes; verify unit tests never need network credentials.
- [ ] 2.2 Extract simulation lifecycle into an application service and explicit single-replica session registry; verify start/conflict/cancel/complete tests and cleanup after disconnect.
- [ ] 2.3 Move chat tools and route handling into bounded services/adapters; verify public errors, timeouts, and current market context contracts.
- [ ] 2.4 Move WebSocket transport/broadcast concerns into dedicated modules; verify client isolation, invalid messages, backpressure bounds, and completion delivery.
- [ ] 2.5 Replace ad hoc payload logging with structured redacted logs; verify sensitive fields are absent in captured output.

## 3. Cutover and Cleanup

- [ ] 3.1 Switch the supported entry point to the application factory while preserving CLI/local startup behavior; verify frontend deterministic smoke and API contracts.
- [ ] 3.2 Remove superseded duplicate server/chat code after coverage confirms the new path; verify imports and route inventory contain one authority per endpoint.
- [ ] 3.3 Run backend tests, frontend contract tests, lint/typecheck/build, strict OpenSpec validation, and `git diff --check`; record single-replica limitation in operational docs.
