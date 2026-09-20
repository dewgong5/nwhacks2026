# Design

## Context

No workflow files exist. Local commands are split across Python and `frontend/`, provider tests can incur cost, and future container/OpenSpec artifacts need validation.

## Goals / Non-Goals

**Goals:** fast least-privilege PR feedback with explicit security gates and reproducible local parity.

**Non-Goals:** deploy automatically or call paid providers for routine CI.

## Decisions

1. **Split fast source jobs from slower container/security jobs.** Frontend and backend jobs run in parallel; container build/scan starts after inputs are ready.
2. **Call repository scripts, not duplicate commands in YAML.** Local and CI behavior share one authority.
3. **Run without application secrets.** Deterministic fakes cover tests; forked PRs never receive provider credentials.
4. **Use least permissions and pinned actions.** Default contents read; elevate only a job that demonstrably needs it; pin immutable action revisions.
5. **Layer security checks.** Secret scan over history/changes as appropriate, dependency audit with documented severity policy, and image scan after containerization.
6. **Do not conflate evidence.** CI status reports automated gates only; browser, deployment, provider, and human acceptance remain external checks.

## Risks / Trade-offs

- [Noisy scanners normalize failure] → severity/allowlist policy with expiry and rationale.
- [Supply-chain risk in actions] → pinned revisions and minimal action count.
- [Slow CI discourages use] → caches, concurrency cancellation, and scoped jobs.

## Migration Plan

Land source verification workflow first; protect it after a green observation period; add security and container jobs incrementally; document local mapping; periodically review pinned action/tool versions. Rollback removes only the failing optional gate while retaining core tests, with an issue tracking restoration.
