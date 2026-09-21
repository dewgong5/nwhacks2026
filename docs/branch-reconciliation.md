# Branch Reconciliation Record

Date: 2026-09-20

## Decision

`main` remains the authoritative default and merge target. `portfolio-rebuild`
was created from `origin/main`, merged the three commits unique to `a`, applied
the preserved secret-remediation/OpenSpec checkpoint, and manually ported the
useful final `afterhack` WebSocket hardening. The remote `a` branch is removed
after the rebuilt tip is merged. `afterhack` is retained temporarily for
historical comparison.

## Source Comparison

| Area | `main` | `a` | `afterhack` | Reconciliation |
| --- | --- | --- | --- | --- |
| History | Default branch; one squash-style afterhack commit | Three unique demo commits | Eleven unique commits, most represented in `main` by the squash commit | Base on `main`; merge `a`; manually port only the final afterhack delta |
| Simulation | Earlier market behavior | Updated index, agent, news, order-book, and demo timing behavior | Mostly earlier simulation behavior | Retain `a` demo behavior |
| Frontend | Same baseline dashboard and localhost fix from merged afterhack | Demo/result presentation updates | Same-origin WebSocket URL and ticket fetch | Retain `a` UI and use fail-closed same-origin ticket connection |
| WebSocket/backend | Unauthenticated socket and permissive CORS | Same plus demo changes | HMAC ticket, size/rate bounds, but raw client fallback and untrusted forwarded-IP use | Port bounds/tickets; remove fallback; restrict origins; bind direct peer; add replay protection |
| Configuration/security | Committed credentials/cache artifacts | Additional committed credentials/cache artifacts | Ignores caches and `.env`, but does not remove all credentials | Apply centralized environment configuration, delete tracked secrets/caches, and scan current tree |
| Documentation | Root README from afterhack squash | No root README | Expanded deployment README with stale public endpoints | Keep `main` README for later case-study rewrite; do not add stale endpoint changes |

## Baseline Evidence

The three remote tips were checked in isolated detached worktrees. All three
had the same result:

- Python compilation: passed.
- `python3 test_simulation.py`: completed, but remains a print-oriented smoke
  script rather than an assertion suite.
- Vitest: one placeholder test passed.
- Vite production build: passed with existing CSS/chunk warnings.
- ESLint: failed with 31 errors and 10 warnings.

On `portfolio-rebuild`, the focused security suite passed 9 tests in a clean
temporary virtual environment, the tracked-tree secret scan reported zero
findings, the WebSocket ticket connection smoke passed, and frontend test/build
results remained green. The unchanged lint failure is assigned to
`restore-repository-quality-baseline` rather than hidden by this reconciliation.

## Commit Mapping

- `7639475`: existing `main` squash-style afterhack integration.
- `73b6892`: traceable merge of `origin/a` into the rebuild.
- `ccc9db3`: preserved security remediation and OpenSpec planning checkpoint.
- `1cfbac9`: manual safe port of the useful `c378284` WebSocket work, with
  original-author attribution.

## Remaining Boundaries

- Provider credentials still require revocation/rotation outside Git.
- Reachable historical refs still contain old secret material until the
  separately planned, coordinated history rewrite is authorized and executed.
- Chat/live-AI authorization and Redis-backed cost quotas remain separate
  OpenSpec changes.
- Passing local checks does not establish deployed, provider, browser, or human
  acceptance.
