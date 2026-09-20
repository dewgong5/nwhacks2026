# Spec Delta

## Purpose

Defines a reliable, repeatable portfolio demonstration that runs without paid AI providers while clearly distinguishing simulated decisions from live model output.

## ADDED Requirements

### Requirement: Deterministic sessions require no paid provider
The system SHALL run a complete market session in deterministic demo mode without Gemini, OpenRouter, or another paid AI credential or outbound model request.

#### Scenario: No provider credentials are configured
- **WHEN** a visitor starts deterministic demo mode
- **THEN** the session reaches a final leaderboard and analysis without an external model call

### Requirement: Seeded sessions are reproducible
The backend MUST derive market movements, news timing, agent decisions, and final results from a declared scenario version and seed.

#### Scenario: Same scenario is replayed
- **WHEN** two sessions use the same scenario version and seed
- **THEN** they emit equivalent ordered domain events and final results, excluding transport timestamps and generated session identifiers

#### Scenario: Unsupported scenario is requested
- **WHEN** a client requests an unknown scenario version or invalid seed
- **THEN** the server rejects the request with a stable validation error and starts no simulation

### Requirement: Demo mode is disclosed throughout the experience
The frontend SHALL label deterministic mode before start, during the session, and in results, and MUST NOT describe deterministic agent output as a live provider response.

#### Scenario: Reviewer inspects an agent decision
- **WHEN** the current session is deterministic
- **THEN** the decision explanation identifies it as a scripted or simulated demo decision

### Requirement: Sessions are bounded and replayable
Each deterministic session MUST have a server-enforced maximum duration and event count and SHALL provide a replay action after completion or recoverable failure.

#### Scenario: Session completes normally
- **WHEN** the final configured tick is processed
- **THEN** the server emits exactly one completion event and the UI offers replay

#### Scenario: Client reconnects during a session
- **WHEN** transport interruption is recoverable within the supported session policy
- **THEN** the client restores a coherent current state or is offered a clean restart without presenting partial results as complete

### Requirement: Live-provider failure degrades explicitly
When live AI mode cannot use its provider, the system SHALL either offer deterministic mode or end the live request with a stable unavailable state; it MUST NOT silently substitute simulated output as live output.

#### Scenario: Provider times out before a live session
- **WHEN** the configured provider exceeds its timeout
- **THEN** the visitor sees the live feature as unavailable and can deliberately choose deterministic demo mode
