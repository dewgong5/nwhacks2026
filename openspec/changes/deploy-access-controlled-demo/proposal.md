# Proposal

## Why

A portfolio link must be reachable and reliable without exposing the origin or paid features to unrestricted use. Deployment needs HTTPS, an explicit access policy, bounded operational cost, and evidence that HTTP, WebSocket, and degraded demo flows work on the real hostname.

## What Changes

- Deploy the Compose stack to one documented single-host environment with reproducible configuration.
- Terminate TLS and prevent direct public access to backend/Redis ports and the unprotected origin.
- Add an identity-aware access boundary for paid/live features, with a documented public deterministic-demo policy if enabled.
- Configure DNS, trusted proxy headers, restricted origins, secure cookies/tickets, backups where applicable, and rollback.
- Add uptime/health monitoring, redacted logs, resource/cost alerts, and a provider kill switch.
- Perform separate deployed HTTP, WebSocket, access-denial, quota, provider-failure, and human demo acceptance checks.

### Non-goals

- No Kubernetes production deployment, broad public SaaS launch, multi-region availability, arbitrary-email access, or claim of enterprise security.
- No production change without explicit authorization for the selected host, DNS, and access provider.

### Change dependencies

- Depends on `containerize-demo-stack`, `protect-cost-bearing-ai-features`, and `remove-and-rotate-exposed-secrets`; the UI should already expose deterministic fallback states.

## Capabilities

### New Capabilities

- `access-controlled-demo-deployment`: HTTPS deployment with origin protection, explicit access policy, monitoring, rollback, and real-host acceptance evidence.

### Modified Capabilities

- None.

## Impact

Affects hosting infrastructure, DNS/TLS, reverse proxy/tunnel configuration, runtime secrets, access policies, monitoring, operational documentation, and deployed acceptance procedures.
