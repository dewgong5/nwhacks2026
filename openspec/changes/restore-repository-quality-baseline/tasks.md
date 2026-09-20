# Tasks

## 1. Tooling and Test Baseline

- [ ] 1.1 Declare supported Node/Python versions and add backend test/development dependencies; verify clean dependency installation succeeds using documented commands.
- [ ] 1.2 Replace print-only order-book/simulation checks with deterministic pytest assertions; verify intentional matching/accounting regressions fail tests.
- [ ] 1.3 Replace the placeholder Vitest test with WebSocket event/state behavior tests; verify an intentional parser/state regression fails tests.

## 2. Static Quality and Hygiene

- [ ] 2.1 Fix application lint errors including hook misuse, unsafe `any`, and configuration imports without broad formatting; verify frontend lint exits zero under the documented warning policy.
- [ ] 2.2 Add an explicit TypeScript typecheck command and resolve discovered errors; verify it exits zero independently of the Vite build.
- [ ] 2.3 Remove tracked generated/cache/local-environment artifacts and complete ignore rules; verify running all checks leaves Git status free of generated files.
- [ ] 2.4 Resolve build warnings that represent correctness issues and record any accepted performance warning; verify production build succeeds with reviewed output.

## 3. Documentation and Aggregate Gate

- [ ] 3.1 Write a root README covering purpose, architecture, safe setup, deterministic/live modes, supported commands, and current limitations; verify a credential-free clean-check walkthrough follows it successfully.
- [ ] 3.2 Add one aggregate local verification entry point that invokes frontend, backend, OpenSpec, and diff checks while preserving individual exit failures; verify a synthetic failing subcommand makes the aggregate command fail.
- [ ] 3.3 Run every documented gate plus strict validation and `git diff --check`; record automated results separately from browser/provider acceptance not performed by this change.
