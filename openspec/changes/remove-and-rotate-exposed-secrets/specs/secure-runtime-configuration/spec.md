# Spec Delta

## Purpose

Defines how MarketMind obtains sensitive runtime configuration without committing credentials and how it fails safely when required configuration is unavailable.

## ADDED Requirements

### Requirement: Source-controlled content contains no active secrets
The repository SHALL contain no active provider credential, session-signing secret, or populated environment file in tracked source or generated artifacts.

#### Scenario: Secret scan of the complete tracked tree
- **WHEN** the configured secret scanner examines every tracked file
- **THEN** it reports no unapproved credential finding and exposes no replacement secret in its output

#### Scenario: Developer prepares local configuration
- **WHEN** a developer follows the setup documentation
- **THEN** they can discover every required variable from a redacted example without retrieving a credential from Git

### Requirement: Sensitive configuration is validated before serving dependent features
The backend MUST load sensitive values from the runtime environment or approved secret mount and MUST refuse to enable a dependent paid feature when its configuration is missing or invalid.

#### Scenario: Required live-provider credential is missing
- **WHEN** live AI mode is enabled without its required provider credential
- **THEN** startup or feature initialization fails with a stable redacted error and no outbound provider request occurs

#### Scenario: Deterministic mode has no provider credentials
- **WHEN** the application starts in deterministic demo mode without provider credentials
- **THEN** deterministic functionality remains available and paid features are visibly unavailable

### Requirement: Exposed credentials are revoked and independently verified
Every identified live credential MUST be revoked or rotated at its provider, and verification evidence MUST identify the credential class and verification time without recording the secret value.

#### Scenario: Rotation is recorded
- **WHEN** an operator finishes a provider rotation
- **THEN** the evidence records provider, affected application, revocation/rotation status, verifier, and timestamp without the old or new secret

### Requirement: History remediation is coordinated and verifiable
Any rewrite of reachable Git history MUST use a reviewed target list, preserve an external recovery reference, communicate required collaborator actions, and be followed by a full-history rescan.

#### Scenario: History rewrite has not been authorized
- **WHEN** current-tree remediation is implemented without explicit approval to rewrite history
- **THEN** no force push, branch deletion, tag deletion, or history rewrite occurs

#### Scenario: Authorized remediation completes
- **WHEN** an authorized history rewrite and coordinated force push complete
- **THEN** all reachable refs pass the configured secret scan and collaborator recovery instructions are available
