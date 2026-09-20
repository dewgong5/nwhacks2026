# Tasks

## 1. Reproducible Local Cluster

- [ ] 1.1 Pin and document the selected `k3d`, Kubernetes, Gateway/controller, Kustomize, and kubectl versions; verify prerequisite checks fail clearly for incompatible versions.
- [ ] 1.2 Add idempotent cluster create, image load, and teardown workflows; verify create-teardown-create succeeds without orphaned project resources.

## 2. Declarative Runtime

- [ ] 2.1 Create a dedicated namespace and base frontend, backend, and Redis workloads/services using container contracts; verify server-side dry run/schema validation and expected resource inventory.
- [ ] 2.2 Add ConfigMaps and external/ignored secret bootstrap with no committed values; verify rendered manifests and secret scans contain no live credential.
- [ ] 2.3 Add truthful startup/liveness/readiness probes and CPU/memory requests/limits; verify pod readiness changes during controlled dependency failure.
- [ ] 2.4 Add Gateway API HTTP/WebSocket routing with a documented fallback overlay if required; verify deterministic browser flow through the cluster entry point.
- [ ] 2.5 Add least-privilege service accounts and NetworkPolicies for required flows only; verify allowed frontend/backend/Redis paths and denied external Redis/unnecessary pod paths.
- [ ] 2.6 Enforce/document one backend replica and demonstrate safe frontend scaling; verify validation flags unsupported backend scale-out.

## 3. Learning Exercises and Evidence

- [ ] 3.1 Script pod replacement, Redis outage, resource inspection, events/logs, and recovery exercises; verify expected state transitions and no paid-provider dependency.
- [ ] 3.2 Demonstrate a bad-image rollout and rollback to known good; verify readiness prevents false success and deterministic flow recovers.
- [ ] 3.3 Document architecture, commands, troubleshooting, production differences, and teardown; verify a fresh local cluster walkthrough follows the runbook.
- [ ] 3.4 Run manifest validation, policy/secret checks, repository gates, strict OpenSpec validation, and `git diff --check`; record local-cluster evidence without claiming public deployment or scale.
