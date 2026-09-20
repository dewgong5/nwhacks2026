# Spec Delta

## Purpose

Defines a reproducible local Kubernetes learning environment for MarketMind that demonstrates safe orchestration without claiming unnecessary production scale.

## ADDED Requirements

### Requirement: A clean local cluster can reproduce the application
The documented workflow SHALL create a supported local cluster, load or pull identified images, apply configuration, and run the deterministic demo from a clean machine with prerequisites.

#### Scenario: Cluster is recreated from scratch
- **WHEN** an operator follows the bootstrap procedure after teardown
- **THEN** all required workloads become ready and the deterministic browser smoke journey completes

### Requirement: Configuration and secrets are separated
Non-sensitive configuration MUST use declarative configuration resources, sensitive values MUST enter through an ignored or external secret mechanism, and committed manifests MUST contain no live credential.

#### Scenario: Manifests are scanned
- **WHEN** all rendered Kubernetes resources are inspected in CI
- **THEN** no populated provider credential or session-signing value is present

### Requirement: Workloads expose truthful health and resources
Every workload MUST declare appropriate readiness and liveness/startup behavior plus CPU and memory requests and limits.

#### Scenario: Backend is alive but its required dependency is unavailable
- **WHEN** quota storage is unhealthy
- **THEN** readiness reports the protected feature unavailable according to policy rather than treating process liveness as full readiness

### Requirement: Networking follows least exposure
Only the intended Gateway or ingress entry point SHALL be externally reachable; internal services SHALL remain cluster-scoped and NetworkPolicies SHALL restrict unnecessary traffic.

#### Scenario: Frontend path upgrades to WebSocket
- **WHEN** a client connects through the configured external route
- **THEN** HTTP, API, and WebSocket paths reach their intended services while Redis remains externally unreachable

### Requirement: Stateful backend scaling is constrained
The backend MUST remain at one replica while active simulation/session coordination is process-local, and documentation MUST explain the invariant.

#### Scenario: Operator attempts unsupported scaling
- **WHEN** the backend replica count exceeds one before shared session coordination exists
- **THEN** validation or documented verification flags the configuration as unsupported rather than claiming successful scale-out

### Requirement: Rollout, rollback, failure, and teardown are demonstrable
The learning workflow SHALL include observable rollout, rollback, pod replacement, dependency-failure, log/describe inspection, and complete teardown exercises.

#### Scenario: A bad image is deployed
- **WHEN** readiness fails for a new backend revision
- **THEN** the rollout does not become healthy and the documented rollback restores the last known-good revision
