# External Credential Rotation Checklist

This checklist tracks the revocation and rotation of credentials that were previously committed or exposed in repository history.

> **Security Notice**: Never paste, commit, or log secret values into this document, repository files, or issue trackers. Only metadata (provider, credential class, status, verifier, timestamp) should be recorded.

---

## Provider Rotation Status

### 1. Google AI Studio / Gemini API Key

- **Provider**: Google AI Studio (console.cloud.google.com / aistudio.google.com)
- **Credential Class**: `Google Gemini API Key` (`AIza...`)
- **Impacted Systems**: Trading Consultant chat endpoint (`server.py`), test script (`test_gemini.py`)
- **Status**: [ ] Pending User / Operator Authorization & Revocation
- **Action Steps**:
  1. Log into Google AI Studio / Google Cloud Console.
  2. Locate the exposed API key in the credentials list.
  3. Delete / revoke the exposed key.
  4. Generate a new API key if live mode testing is desired.
  5. Save the new key locally in a gitignored `.env` file (`GEMINI_API_KEY=...`).
  6. Verify the old key returns `400/403 Invalid API key` or fails to authenticate.
- **Verification Evidence**:
  - Verification Timestamp: _Pending_
  - Verified By: _Pending_
  - Revocation Status: _Pending confirmation_

---

### 2. OpenRouter API Key

- **Provider**: OpenRouter (openrouter.ai/keys)
- **Credential Class**: `OpenRouter API Key` (`sk-or-v1-...`)
- **Impacted Systems**: LLM Trading Agents (`agents.py`), Custom Trading Agent (`custom_agent.py`), chat fallback
- **Status**: [ ] Pending User / Operator Authorization & Revocation
- **Action Steps**:
  1. Log into OpenRouter Dashboard -> Keys.
  2. Identify the active key ending in `...4e8` / `...478`.
  3. Click Revoke / Delete.
  4. Generate a replacement key if live agent calls are desired.
  5. Save the replacement key locally in `.env` (`OPENROUTER_API_KEY=...`).
  6. Verify old key requests return `401 Unauthorized`.
  7. Check credit balance / activity log for any anomalous usage during the exposure window.
- **Verification Evidence**:
  - Verification Timestamp: _Pending_
  - Verified By: _Pending_
  - Revocation Status: _Pending confirmation_
