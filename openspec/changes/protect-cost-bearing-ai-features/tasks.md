# Tasks

## 1. Policy, Identity, and Quota Foundation

- [ ] 1.1 Define bounded authorization/quota policy settings with conservative defaults and absolute maxima; verify invalid or missing production policy fails closed.
- [ ] 1.2 Implement trusted-proxy-aware identity extraction and server validation of the selected edge/session identity; verify forged headers and invalid/expired credentials are rejected.
- [ ] 1.3 Implement Redis-backed atomic quota reservation/finalization with an in-memory test fake; verify expiry, idempotency, concurrency races, and restart persistence.

## 2. Protect Paid Entry Points

- [ ] 2.1 Wrap chat admission with authorization, per-identity/IP/global/concurrency quotas, input bounds, timeout/retry bounds, and redacted errors; verify rejected requests make zero fake-provider calls.
- [ ] 2.2 Replace WebSocket admission with short-lived single-use purpose-bound tickets and remove raw fallback; verify altered, replayed, expired, cross-origin, and oversized requests fail.
- [ ] 2.3 Protect live-agent simulation commands with server-owned tick/duration/concurrency maxima; verify client-supplied excessive values cannot expand work.
- [ ] 2.4 Add provider-budget kill switch and deterministic fallback availability; verify global exhaustion disables paid calls without disabling deterministic sessions.

## 3. Observability and Acceptance

- [ ] 3.1 Add correlated usage/quota/security logs and metrics without credentials or full prompts; verify log-capture tests enforce redaction.
- [ ] 3.2 Add frontend authentication, quota, retry, and unavailable states; verify component/browser tests expose a useful next action without internal error details.
- [ ] 3.3 Run abuse, race, Redis-outage, provider-timeout, HTTP/WebSocket contract, and deterministic fallback tests plus strict OpenSpec validation; keep edge-provider and real-provider verification open until deployment.
