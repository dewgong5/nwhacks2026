# Proposal

## Why

The frontend builds but fails lint, its only automated assertion is a placeholder, and the Python smoke script has no assertions. A credible portfolio project needs repeatable local quality gates and accurate setup documentation before feature work compounds the prototype debt.

## What Changes

- Fix current TypeScript/React lint errors and triage warnings without mass-formatting unrelated code.
- Replace placeholder frontend tests and print-only Python checks with meaningful deterministic assertions.
- Add explicit frontend typecheck, backend test, lint, build, and OpenSpec validation commands.
- Remove tracked generated artifacts and stale template text; add a root README with supported local workflows.
- Normalize environment/configuration documentation without including secrets.
- Define a single local verification command suitable for later CI use.

### Non-goals

- No backend architecture rewrite, visual redesign, containerization, authentication, or live deployment.
- No requirement to eliminate every low-value generated-component warning if it does not weaken the agreed gate.

### Change dependencies

- Depends on `reconcile-authoritative-branch`; secret-safe configuration from `remove-and-rotate-exposed-secrets` must be preserved.

## Capabilities

### New Capabilities

- `repository-quality-baseline`: Reproducible setup, meaningful automated checks, clean generated-file policy, and a documented developer verification gate.

### Modified Capabilities

- None.

## Impact

Affected areas include frontend ESLint and Vitest configuration, Python test tooling, package scripts, requirements/development dependencies, `.gitignore`, README content, and selected source files currently failing lint.
