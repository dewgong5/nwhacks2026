# Spec Delta

## Purpose

Defines the repeatable local engineering checks and repository hygiene required before MarketMind feature changes can be considered implementation-ready.

## ADDED Requirements

### Requirement: A documented clean-check command verifies the repository
The repository SHALL provide documented commands that run frontend lint, type checking, tests and production build; backend tests; OpenSpec strict validation; and diff hygiene with non-zero exit status on failure.

#### Scenario: Clean checkout passes the baseline
- **WHEN** a contributor installs documented dependencies and runs the baseline commands on the authoritative branch
- **THEN** every required command completes successfully without requiring paid-provider credentials

#### Scenario: A quality violation is introduced
- **WHEN** a lint, type, test, build, specification, or diff-hygiene violation exists
- **THEN** the corresponding baseline command exits unsuccessfully and identifies the failing gate

### Requirement: Automated tests assert meaningful behavior
Frontend and backend test suites MUST contain deterministic assertions covering critical simulation and client event behavior rather than placeholder truths or print-only execution.

#### Scenario: Simulation trade behavior regresses
- **WHEN** order matching or portfolio accounting deviates from its characterized contract
- **THEN** at least one automated backend test fails with an assertion tied to that behavior

#### Scenario: Client event mapping regresses
- **WHEN** a supported WebSocket event no longer produces the required frontend state transition
- **THEN** at least one automated frontend test fails

### Requirement: Generated and local-only artifacts remain untracked
The repository MUST ignore dependency directories, build outputs, Python bytecode, local environment files, coverage output, and other documented generated artifacts.

#### Scenario: Local verification generates artifacts
- **WHEN** contributors run the documented build and test commands
- **THEN** Git status remains free of generated dependency, cache, build, coverage, and local environment files

### Requirement: Setup documentation describes the supported baseline
The root documentation SHALL identify the project purpose, supported toolchain, safe environment setup, local services, verification commands, and current demo limitations.

#### Scenario: New contributor follows the README
- **WHEN** a contributor starts from a clean checkout with no provider credentials
- **THEN** they can run deterministic local verification and understand which live features remain unavailable
