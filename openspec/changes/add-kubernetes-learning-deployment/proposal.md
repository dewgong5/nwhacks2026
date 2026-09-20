# Proposal

## Why

The user wants hands-on Kubernetes experience after establishing a working containerized demo. A separate learning deployment can demonstrate workloads, networking, configuration, observability, and failure recovery without misrepresenting Kubernetes as necessary for this project’s traffic.

## What Changes

- Add a reproducible local cluster workflow using one selected tool such as `k3d` or `kind`.
- Define frontend, backend, and Redis workloads; Services; ConfigMaps; Secrets interfaces; probes; and resource requests/limits.
- Add Gateway API or a clearly documented ingress fallback for HTTP and WebSocket routing.
- Add namespace isolation, least-privilege service accounts, NetworkPolicies, disruption/rollout behavior, and local secret injection.
- Keep the stateful backend at one replica until session coordination is externalized; demonstrate scaling only for safe components.
- Document deploy, inspect, roll out, roll back, failure injection, teardown, and evidence collection.

### Non-goals

- No claim of production scale, no managed-cloud cluster requirement, no public Kubernetes deployment, and no unsafe backend horizontal scaling.
- No duplication of application features or embedding real provider credentials in manifests.

### Change dependencies

- Depends on `containerize-demo-stack`; should reuse health/config contracts and preserve the access-control boundary from `protect-cost-bearing-ai-features`.

## Capabilities

### New Capabilities

- `kubernetes-learning-runtime`: Reproducible local Kubernetes deployment with safe configuration, probes, resources, networking, rollout/rollback, and explicit single-replica state constraints.

### Modified Capabilities

- None.

## Impact

Adds Kubernetes/Kustomize manifests or charts, cluster bootstrap scripts, Gateway/ingress configuration, NetworkPolicies, runbooks, and local infrastructure verification. Application changes should be limited to container, health, shutdown, and configuration compatibility.
