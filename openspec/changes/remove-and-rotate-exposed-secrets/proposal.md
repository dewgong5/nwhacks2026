# Proposal

## Why

The repository contains tracked environment material and live-looking provider credentials in Python sources and history. Private-demo intent does not neutralize leaked credentials, so credential revocation and a fail-safe configuration boundary must precede further deployment work.

## What Changes

- Inventory every tracked and historical secret location without printing secret values into logs or artifacts.
- Replace embedded Gemini, OpenRouter, and WebSocket credentials with validated environment-backed configuration.
- Stop tracking environment files and generated Python cache artifacts; provide a redacted `.env.example`.
- Revoke and rotate affected provider credentials through their provider consoles, recording verification without storing replacement values.
- Define an explicit, separately authorized history-rewrite procedure and collaborator coordination plan.
- Add automated secret scanning and startup failure behavior for missing production credentials.

### Non-goals

- No branch reconciliation, application redesign, rate limiting, deployment, or provider-account mutation without explicit apply-time authorization.
- No claim that deleting a key from the current tree removes it from Git history.

### Change dependencies

- None. This is the first safety change and blocks any internet-accessible deployment.

## Capabilities

### New Capabilities

- `secure-runtime-configuration`: Secret-free source control, validated runtime configuration, credential-rotation evidence, and safe failure behavior.

### Modified Capabilities

- None.

## Impact

Affected areas include `agents.py`, `server.py`, `test_gemini.py`, `backend/.env`, `backend/chat_api.py`, ignore rules, repository history, provider consoles, and developer setup documentation. History rewriting and credential revocation are destructive/external operations and require explicit confirmation during implementation.
