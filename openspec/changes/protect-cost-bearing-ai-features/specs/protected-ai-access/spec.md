# Spec Delta

## Purpose

Defines server-enforced identity, quota, input, and provider-budget boundaries for MarketMind features that can incur external AI cost.

## ADDED Requirements

### Requirement: Paid AI requests require validated authorization
Chat, live-agent simulation, and live-provider WebSocket commands MUST require a valid, short-lived server-validated identity or capability before any provider call is made.

#### Scenario: Anonymous visitor requests chat
- **WHEN** a request has no valid authorization
- **THEN** the server returns an authentication-required response and makes no provider request

#### Scenario: WebSocket ticket validation fails
- **WHEN** a WebSocket presents an expired, altered, replayed, or wrong-origin ticket
- **THEN** the server rejects the connection or protected command without an unauthenticated fallback

### Requirement: Durable quotas bound visitor and global usage
The server MUST atomically enforce configurable per-identity, per-network-source, concurrent, and global daily limits using durable shared state before spending provider quota.

#### Scenario: Per-identity chat limit is exhausted
- **WHEN** an authorized identity submits another chat request after its limit
- **THEN** the server returns a stable quota-exhausted response with retry information and makes no provider request

#### Scenario: Global provider budget is exhausted
- **WHEN** the configured global daily allowance has been consumed
- **THEN** all further paid requests are denied while deterministic demo mode remains available

#### Scenario: Two requests race for the last allowance
- **WHEN** concurrent requests contend for one remaining quota unit
- **THEN** no more than one request acquires the unit

### Requirement: Inputs and execution are bounded
The server MUST enforce maximum request bytes, prompt length, conversation turns, simulation ticks, concurrent simulations, provider timeout, and retry count using server-owned values.

#### Scenario: Client requests excessive work
- **WHEN** a client exceeds any configured input or execution bound
- **THEN** the server rejects or truncates according to the documented policy before unbounded work occurs

### Requirement: Origins and proxy identity are trustworthy
Production HTTP and WebSocket endpoints MUST accept only configured origins, and client-network identity MUST derive from forwarding headers only when the immediate proxy is trusted.

#### Scenario: Untrusted caller spoofs a forwarding header
- **WHEN** a direct request supplies a forged client-IP header
- **THEN** quota identity uses the actual peer address rather than the forged value

### Requirement: Operational records are safe and actionable
The system SHALL record authorization outcome, quota decision, provider category, latency, and redacted failure category without storing credentials or full visitor prompts by default.

#### Scenario: Provider request fails
- **WHEN** a paid request returns an upstream error
- **THEN** operators receive a correlated redacted error while the visitor receives a stable public error
