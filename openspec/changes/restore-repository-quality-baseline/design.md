# Design

## Context

The Vite build succeeds with warnings, ESLint reports 31 errors and 10 warnings, Vitest has one placeholder assertion, and `test_simulation.py` prints results without assertions. The frontend README is template text and no root README defines the supported workflow.

## Goals / Non-Goals

**Goals:** create fast deterministic gates that future CI can call and make a clean checkout understandable.

**Non-Goals:** maximize coverage percentage or refactor architecture under the guise of lint fixes.

## Decisions

1. **Define explicit scripts per evidence type plus one aggregate verifier.** Individual failure remains diagnosable; aggregation is convenience, not hidden orchestration.
2. **Use pytest for backend assertions and Vitest for frontend contract/state tests.** Provider calls use fakes and deterministic seeds.
3. **Characterize critical behavior before changing it.** Order matching, portfolio accounting, market-index calculation, WebSocket parsing, and session completion receive assertions.
4. **Fix source lint errors narrowly.** Generated shadcn fast-refresh warnings may be configured intentionally if documented; hook-rule violations and unsafe application `any` values are fixed.
5. **Make artifact hygiene testable.** Ignore policy plus a post-verification Git-status check prevents caches/build outputs from recurring.

## Risks / Trade-offs

- [Tests freeze accidental behavior] → distinguish intended contracts from observations and document changes.
- [Lint cleanup creates noisy diffs] → avoid bulk formatting and separate mechanical changes.
- [Toolchain drift] → declare supported Python/Node versions and lock dependencies.

## Migration Plan

Add test tooling/scripts; replace placeholders; fix failing lint in application code; define warning policy; clean tracked generated artifacts; write root documentation; run all gates from a clean checkout and verify Git remains clean.
