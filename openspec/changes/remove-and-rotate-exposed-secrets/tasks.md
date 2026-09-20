# Tasks

## 1. Inventory and Current-Tree Remediation

- [x] 1.1 Inventory tracked and reachable-history secret locations by credential class without printing values; verify the inventory covers all Git refs and environment files.
- [x] 1.2 Add centralized environment-backed settings and replace hard-coded provider/signing values; verify deterministic startup succeeds without paid credentials and live mode fails closed when required values are absent.
- [x] 1.3 Remove tracked populated environment/cache artifacts, extend ignore rules, and add a redacted `.env.example`; verify local setup artifacts do not appear in Git status.
- [x] 1.4 Add configured secret scanning for the tracked tree and history; verify a synthetic canary is detected and repository content passes after remediation.

## 2. External Credential Response

- [x] 2.1 Prepare a provider-by-provider rotation checklist and obtain explicit authorization before provider-console mutation; verify approval and affected credential classes are recorded without values.
- [ ] 2.2 Revoke/rotate each authorized credential and inspect provider usage; verify old credentials fail, replacements work only from approved runtime configuration, and evidence remains metadata-only.

## 3. History and Completion

- [x] 3.1 Prepare exact history-rewrite targets, recovery reference, collaborator impact, and commands; verify no rewrite or force push occurs without separate explicit approval.
- [ ] 3.2 If authorized, rewrite affected refs and coordinate publication/reclone steps; verify a full-ref scan passes and protected/current branches point to reviewed commits.
- [x] 3.3 Run backend tests, deterministic smoke checks, strict OpenSpec validation, and `git diff --check`; record current-tree, provider, and history evidence as separate outcomes.
