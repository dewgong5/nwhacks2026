# Design

## Context

Active source contains hard-coded provider keys in `agents.py`, `server.py`, and `test_gemini.py`; `backend/.env` and Python bytecode are tracked. Ignore rules do not remove existing history. Provider revocation and Git-history rewriting are external/destructive operations that planning cannot execute.

## Goals / Non-Goals

**Goals:** establish a complete secret inventory, environment-only runtime configuration, safe startup behavior, rotation evidence, and a reviewable history-remediation path.

**Non-Goals:** choose hosting/authentication providers or perform unapproved provider-console and force-push actions.

## Decisions

1. **Separate current-tree remediation, provider rotation, and history remediation.** Each has distinct authority and evidence; a clean current tree does not prove keys are revoked or unreachable in history.
2. **Centralize configuration in a typed settings object.** Provider clients receive validated settings rather than reading constants. Deterministic mode is allowed without paid credentials; live mode fails closed.
3. **Use scanner output as a gate, not as the inventory artifact.** Inventory records file/ref and credential class only; values and recognizable fragments are excluded.
4. **Require explicit authorization before history rewrite.** Prepare exact refs, backup/recovery reference, collaborator instructions, and rescan commands first. Prefer `git filter-repo` if approved; never rewrite opportunistically.
5. **Keep rotation evidence metadata-only.** Provider, credential class, status, time, and verifier are sufficient.

## Risks / Trade-offs

- [Previously leaked keys may already be abused] → revoke before relying on source cleanup and inspect provider usage.
- [History rewrite disrupts clones and forks] → coordinate, preserve recovery reference, and document reclone/rebase steps.
- [Secret scanning false positives] → narrow allowlists with justification; never broad exclusions.

## Migration Plan

Inventory without printing values; introduce settings and tests; remove tracked secret/cache files; verify current-tree scan; obtain approval and rotate credentials; optionally obtain separate approval for history rewrite; rescan all refs and images; update contributor instructions. Roll back code through the normal commit path, but never restore revoked credentials.
