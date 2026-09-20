# Tasks

## 1. Shared Verification Contract

- [ ] 1.1 Inventory authoritative local frontend, backend, OpenSpec, diff, container, and security commands; verify CI can invoke repository-owned scripts without duplicated command drift.
- [ ] 1.2 Define supported runtime versions, lockfile/cache keys, timeout policy, and required-vs-advisory gates; verify the policy is documented before workflows are protected.

## 2. CI Workflows

- [ ] 2.1 Add parallel frontend and backend pull-request jobs with pinned toolchains/actions and read-only permissions; verify they pass without provider secrets and fail on synthetic test/lint errors.
- [ ] 2.2 Add strict OpenSpec and diff-hygiene validation; verify malformed proposal/spec/task fixtures or a whitespace error causes failure.
- [ ] 2.3 Add secret scanning with history/change coverage and narrow reviewed allowlists; verify a canary credential is detected without printing it unnecessarily.
- [ ] 2.4 Add dependency audit policy with severity thresholds and documented exception expiry; verify a controlled vulnerable fixture or report parser exercises failure behavior.
- [ ] 2.5 After containerization lands, add image build, metadata, non-root, and vulnerability scanning; verify no registry push or deployment occurs from untrusted pull requests.
- [ ] 2.6 Add concurrency cancellation, bounded caches, timeouts, and concise artifacts; verify superseded runs cancel and failure evidence remains available.

## 3. Rollout

- [ ] 3.1 Review workflow permissions and action pins using a static checker/manual checklist; verify no job receives broader tokens or secrets than required.
- [ ] 3.2 Compare local and CI results on the same commit and resolve environment-only differences; verify the documented command mapping is accurate.
- [ ] 3.3 Observe green default-branch and representative PR runs before recommending required checks; obtain authorization before changing repository protection settings.
