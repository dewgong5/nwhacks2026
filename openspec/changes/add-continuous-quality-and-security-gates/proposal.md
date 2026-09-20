# Proposal

## Why

Local checks are currently inconsistent and there is no automated protection against regressions, leaked credentials, vulnerable dependencies, or broken container builds. A small CI pipeline should enforce the quality baseline without pretending that automation proves browser, provider, or deployment acceptance.

## What Changes

- Add pull-request and default-branch workflows for frontend lint/typecheck/tests/build and backend tests.
- Add strict OpenSpec validation and diff/format checks for planning artifacts.
- Add secret scanning, dependency auditing, and container image/build checks with explicit failure policies.
- Pin actions and toolchain versions, use least-privilege workflow permissions, and avoid exposing provider secrets to untrusted pull requests.
- Add cache strategy, concurrency cancellation, artifact retention, and a documented local/CI command mapping.
- Keep deployment and live-provider checks separate and manually authorized.

### Non-goals

- No automatic production deployment, provider calls from forked pull requests, Kubernetes rollout, or replacement for browser/human acceptance.
- No blanket dependency auto-upgrade or unrelated source cleanup.

### Change dependencies

- Depends on `restore-repository-quality-baseline`; container checks depend on `containerize-demo-stack` but the source-test jobs may land earlier.

## Capabilities

### New Capabilities

- None. This change automates existing engineering and security gates without changing product behavior.

### Modified Capabilities

- None.

## Impact

Adds CI workflow files, pinned actions/tool versions, security scanning configuration, package scripts, status-check documentation, and possibly a dependency-update policy.
