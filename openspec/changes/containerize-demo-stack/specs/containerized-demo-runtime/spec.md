# Spec Delta

## Purpose

Defines a reproducible container runtime for MarketMind that safely serves the frontend, backend, WebSockets, and quota storage on one host.

## ADDED Requirements

### Requirement: The stack builds reproducibly without embedded secrets
The documented container build SHALL produce frontend/proxy and backend images from a clean checkout without requiring runtime secrets, and image layers MUST NOT contain populated secret files.

#### Scenario: Clean image build
- **WHEN** the documented build runs from a clean checkout
- **THEN** all images build successfully and a credential scan of image contents finds no runtime secret

### Requirement: Containers run with bounded privileges and resources
Application containers MUST run as non-root where compatible, declare CPU and memory bounds for the production Compose profile, and mount writable paths only where documented.

#### Scenario: Runtime identity is inspected
- **WHEN** the production Compose stack is running
- **THEN** application processes do not run as root and required writes remain limited to declared paths

### Requirement: One origin serves HTTP and WebSocket traffic
The proxy SHALL serve the built frontend and route API and WebSocket traffic to the backend through the same external origin, preserving upgrade semantics and configured forwarding headers.

#### Scenario: Container smoke test runs
- **WHEN** a client loads the application and starts a deterministic session through the published port
- **THEN** static assets, health API, WebSocket upgrade, event stream, and completion succeed without a hard-coded localhost backend URL

### Requirement: Service health controls startup and recovery
The runtime SHALL expose health and readiness signals for required services and SHALL distinguish a running process from a ready dependency graph.

#### Scenario: Redis is unavailable
- **WHEN** a quota-dependent production profile starts without healthy Redis
- **THEN** protected paid features remain unready or fail closed while deterministic behavior follows its documented availability policy

### Requirement: Development and production configuration remain distinct
The repository SHALL provide a base Compose definition and an explicit production override that removes source bind mounts, applies restart/resource policy, and injects environment-specific configuration externally.

#### Scenario: Production configuration is rendered
- **WHEN** the documented Compose config command renders the production profile
- **THEN** no developer source bind mount or populated secret appears in the resolved configuration
