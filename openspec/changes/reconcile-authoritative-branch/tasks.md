# Tasks

## 1. Compare and Select

- [x] 1.1 Fetch all remote refs and create a commit/file/behavior divergence report for `a`, `main`, and `afterhack`; verify the report covers security/config, simulation, API/WebSocket, frontend, docs, and generated files.
- [x] 1.2 Characterize each branch with available build, lint, test, compile, and smoke commands; verify failures are recorded per branch without modifying them.
- [x] 1.3 Recommend the future default base and integration method with a conflict matrix; obtain user confirmation before any merge/rebase/default-branch mutation.

## 2. Reconcile in Bounded Commits

- [x] 2.1 Create a non-destructive reconciliation branch and integrate secret-safe configuration first; verify secret scanning passes before later changes.
- [x] 2.2 Integrate backend/simulation behavior with explicit conflict rationale; verify characterized market and completion behavior remains intentional.
- [x] 2.3 Integrate WebSocket/frontend contracts, removing unsafe raw fallback and hard-coded endpoints; verify same-origin local communication and supported event parsing.
- [x] 2.4 Integrate documentation/ignore hygiene and remove tracked generated artifacts; verify Git status stays clean after baseline commands.

## 3. Acceptance and Handoff

- [x] 3.1 Run the full baseline matrix and strict OpenSpec validation on the reconciled branch; verify results distinguish pre-existing failures from regressions.
- [x] 3.2 Review the range diff and commit history for lost or duplicated work; verify every selected branch capability maps to a reconciliation decision.
- [x] 3.3 Present the branch for review and obtain separate authorization before changing remote defaults, force pushing, or deleting branches; verify no such mutation occurs during unapproved apply work.
