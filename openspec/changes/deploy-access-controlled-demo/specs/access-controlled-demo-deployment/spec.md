# Spec Delta

## Purpose

Defines the externally reachable portfolio deployment, its access boundary, operational protections, rollback behavior, and real-host acceptance evidence.

## ADDED Requirements

### Requirement: The deployed demo uses HTTPS and protects its origin
All visitor HTTP and WebSocket traffic MUST use the configured HTTPS hostname, while backend, Redis, administrative ports, and the unprotected origin MUST NOT be directly reachable from the public internet.

#### Scenario: Visitor opens the public hostname
- **WHEN** an allowed visitor loads the demo
- **THEN** frontend, API, and WebSocket traffic use TLS on the approved hostname with no mixed-content request

#### Scenario: Caller targets a backend port
- **WHEN** an internet caller attempts direct access to an internal service port or origin address
- **THEN** the connection is blocked or denied before reaching the application service

### Requirement: Access policy distinguishes public demo and protected paid features
The deployment MUST document and enforce whether deterministic demo access is public or gated, and MUST require approved identity for every paid AI route and command.

#### Scenario: Unapproved visitor uses deterministic mode
- **WHEN** policy permits public deterministic access
- **THEN** the visitor can complete that mode but cannot invoke chat or live AI

#### Scenario: Unapproved visitor requests protected functionality
- **WHEN** identity policy does not authorize the visitor
- **THEN** access is denied before provider quota can be consumed

### Requirement: Operations have monitoring and a kill switch
The deployment SHALL monitor health, resource usage, access denials, and provider-consumption signals and MUST provide a documented way to disable paid features without disabling deterministic mode.

#### Scenario: Unexpected provider usage occurs
- **WHEN** usage crosses the configured alert threshold
- **THEN** an operator is alerted and can activate the kill switch without rebuilding the application

### Requirement: Deployment and rollback are reproducible
The operator MUST be able to deploy an identified image set, verify readiness, and roll back to the previous known-good set using documented commands and configuration backups.

#### Scenario: New release fails readiness
- **WHEN** a deployed version does not pass readiness or the smoke suite
- **THEN** traffic is not declared healthy and the operator can restore the previous version

### Requirement: Acceptance evidence remains evidence-class specific
A release SHALL record automated deployment checks, real-browser journey checks, access-denial checks, provider checks, and human visual acceptance separately.

#### Scenario: Automated smoke checks pass
- **WHEN** HTTP and WebSocket smoke checks succeed on the real hostname
- **THEN** the release is not labeled visually accepted or live-provider verified unless those checks were separately completed
