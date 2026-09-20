# Git History Rewrite Plan

> **Caution**: Rewriting Git history alters commit hashes across all rewritten branches. This requires separate explicit approval before execution. No force push or destructive history alteration may occur without explicit user confirmation.

---

## 1. Targeted Artifacts for History Purge

The following files contain sensitive tokens in reachable Git commits and must be scrubbed:
1. `backend/.env` (deleted entirely from historical commits)
2. `__pycache__/*.pyc` and `backend/__pycache__/*.pyc` (deleted entirely from historical commits)
3. Hardcoded string occurrences in historical versions of:
   - `agents.py`
   - `server.py`
   - `test_gemini.py`

---

## 2. Affected Git Refs

All branches and tags reaching the affected commits:
- Local branches: `a`, `main`, `sp500`
- Remote tracking refs (subject to coordinated force push if approved):
  - `origin/a`
  - `origin/main`
  - `origin/sp500`
  - `origin/afterhack`
  - `origin/allen`
  - `origin/chatbot_frontend`
  - `origin/master`
  - `origin/tim`

---

## 3. Recovery Reference & Backup Safety

Before running any rewrite:
1. Create a local immutable backup bundle or backup ref namespace:
   ```bash
   git tag backup/pre-rewrite-$(date +%Y%m%d%H%M%S) HEAD
   git bundle create ../marketmind-pre-rewrite-backup.bundle --all
   ```
2. Verify the bundle integrity so any historical commit can be retrieved if needed.

---

## 4. Execution Tool & Commands (Upon Approval)

We recommend using `git-filter-repo` (installed at `/Users/timothylauw/miniforge3/bin/git-filter-repo`):

```bash
# Step 1: Create backup
git tag backup/pre-rewrite-recovery HEAD

# Step 2: Remove backend/.env and bytecode across all commits
git filter-repo --invert-paths \
  --path backend/.env \
  --path-glob '__pycache__/*' \
  --path-glob '*/__pycache__/*'

# Step 3: Replace string patterns across remaining historical source files
# (using replace-text expression file)
git filter-repo --replace-text expressions.txt

# Step 4: Verify with secret scanner
python3 scripts/scan_secrets.py --history
```

---

## 5. Collaborator Impact & Recovery Instructions

Once rewritten refs are pushed:
1. Anyone who has cloned the repository cannot simply run `git pull` (doing so would re-merge the old history and resurrect exposed secrets).
2. Existing collaborators must run:
   ```bash
   # Option A: Fresh clone (recommended)
   git clone <repo-url> fresh-marketmind
   
   # Option B: Reset existing clone
   git fetch origin
   git checkout main
   git reset --hard origin/main
   ```
3. Any open feature branches must be rebased onto the rewritten base commits using `git rebase --onto`.
