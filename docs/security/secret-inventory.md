# Secret Inventory

This inventory documents all detected credential locations in tracked files and reachable Git history. In accordance with security policy, no secret values or sensitive fragments are recorded in this document.

## Credential Classes Identified

1. **OpenRouter API Key (`sk-or-v1-...`)**
   - **Provider**: OpenRouter
   - **Purpose**: AI Trading Agent decision generation and chat fallback
2. **Google Gemini API Key (`AIza...`)**
   - **Provider**: Google AI Studio / Gemini API
   - **Purpose**: Trading Consultant chat endpoint and test scripts

---

## Current Tracked Tree Locations

| File Path | Credential Class | Location | Remediation Plan |
| :--- | :--- | :--- | :--- |
| `agents.py` | OpenRouter API Key | Line 14 (`API_KEY = "..."`) | Move to environment-backed settings object |
| `server.py` | Google Gemini API Key | Line 719 (`GEMINI_API_KEY = "..."`) | Move to environment-backed settings object |
| `test_gemini.py` | Google Gemini API Key | Line 7 (`genai.Client(api_key="...")`) | Read from environment (`GEMINI_API_KEY`) |
| `backend/.env` | OpenRouter API Key | Line 1 (`OPENROUTER_API_KEY=...`) | Untrack file, add to `.gitignore`, provide redacted `.env.example` |
| `__pycache__/*.pyc` | OpenRouter API Key | Compiled bytecode | Untrack bytecode files, add `__pycache__/` and `*.pyc` to `.gitignore` |
| `backend/__pycache__/*.pyc`| Compiled bytecode | Compiled bytecode | Untrack bytecode files, add to `.gitignore` |

---

## Reachable Git History Inventory

The following commits across Git refs contain sensitive credential material in their commit snapshots or diffs:

| File Path in History | Credential Class | Commits | Reachable Refs |
| :--- | :--- | :--- | :--- |
| `agents.py` | OpenRouter API Key | `2e297b82`, `37bd9ce2`, `3fb0256e`, `93f6dcad`, `d0f85b33`, `e918814a` | `a`, `main`, `sp500`, `origin/a`, `origin/main`, `origin/afterhack`, `origin/allen`, `origin/chatbot_frontend`, `origin/sp500`, `origin/tim` |
| `backend/.env` | OpenRouter API Key | `267a4607`, `37bd9ce2`, `609626b9`, `69df3f9a` | `a`, `main`, `sp500`, `origin/a`, `origin/main`, `origin/afterhack`, `origin/allen`, `origin/sp500`, `origin/tim` |
| `server.py` | Google Gemini API Key | `42ee8e10`, `4c5e3ad5`, `7639475c`, `78727aee`, `93f6dcad`, `c3782847`, `e918814a` | `a`, `main`, `sp500`, `origin/a`, `origin/main`, `origin/afterhack`, `origin/sp500` |
| `test_gemini.py` | Google Gemini API Key | `78727aee` | `a`, `main`, `sp500`, `origin/a`, `origin/main`, `origin/afterhack`, `origin/sp500` |
| `__pycache__/agents.cpython-313.pyc` | OpenRouter API Key | `2e297b82`, `d0f85b33` | `a`, `main`, `sp500`, `origin/a`, `origin/main`, `origin/afterhack`, `origin/allen`, `origin/sp500` |
| `__pycache__/agents.cpython-314.pyc` | OpenRouter API Key | `93f6dcad`, `e918814a` | `a`, `origin/a` |

---

## Verification Summary

- Total secret occurrences mapped: 22 across current tree and history.
- Inventory covers all 12 local and remote refs and environment files.
- Zero secret values printed in this record.
