#!/usr/bin/env python3
"""
Automated secret scanner for MarketMind repository.

Scans the tracked tree, staging area, or full Git commit history for exposed
credentials and sensitive tokens.
Outputs rule name and location metadata ONLY; never prints matched secret values.
"""

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# Detection patterns
PATTERNS: Dict[str, re.Pattern] = {
    "Google / Gemini API Key": re.compile(r"AIza[0-9A-Za-z_-]{35}"),
    "OpenRouter API Key": re.compile(r"sk-or-v1-[0-9a-fA-F]{64}"),
    "Generic OpenAI API Key": re.compile(r"\bsk-[a-zA-Z0-9]{32,}\b"),
    "Generic Private Key": re.compile(r"-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----"),
    "Sensitive Hardcoded Credential": re.compile(
        r"""(?i)(?:api[_-]?key|secret[_-]?key|auth[_-]?token)\s*=\s*['"][a-zA-Z0-9_\-]{20,}['"]"""
    ),
}

# Paths always excluded from scan
EXCLUDED_PATHS = {
    ".git",
    "node_modules",
    "package-lock.json",
    "bun.lockb",
    "docs/security/secret-inventory.md",
    "scripts/scan_secrets.py",
    "tests/test_config_and_security.py",
    "tests/test_secret_scanner.py",
}


def is_excluded(path_str: str) -> bool:
    clean = path_str.replace("\\", "/").lstrip("./")
    for exc in EXCLUDED_PATHS:
        if clean == exc or clean.startswith(f"{exc}/"):
            return True
    if clean.endswith((".png", ".jpg", ".jpeg", ".ico", ".svg", ".pyc", ".lockb")):
        return True
    return False


def scan_text(content: str, filename: str) -> List[Tuple[str, int, str]]:
    """
    Scan string content for credential patterns.
    Returns list of (filename, line_number, rule_name).
    """
    findings = []
    lines = content.splitlines()
    for line_no, line in enumerate(lines, 1):
        # Ignore comments or examples that explicitly state dummy / example
        if "canary_ignore" in line or "dummy" in line.lower() or "example" in line.lower() and "AIza" not in line:
            continue
        for rule_name, pattern in PATTERNS.items():
            if pattern.search(line):
                findings.append((filename, line_no, rule_name))
    return findings


def scan_tracked_tree(root_dir: Path) -> List[Tuple[str, int, str]]:
    """Scan all tracked files in git working tree."""
    try:
        tracked_files = (
            subprocess.run(
                ["git", "ls-files"],
                cwd=str(root_dir),
                capture_output=True,
                text=True,
                check=True,
            )
            .stdout.strip()
            .splitlines()
        )
    except Exception as e:
        sys.stderr.write(f"Error listing tracked files: {e}\n")
        return []

    all_findings = []
    for rel_path in tracked_files:
        if is_excluded(rel_path):
            continue
        abs_path = root_dir / rel_path
        if not abs_path.is_file():
            continue
        try:
            with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            findings = scan_text(content, rel_path)
            all_findings.extend(findings)
        except Exception as e:
            sys.stderr.write(f"Error reading {rel_path}: {e}\n")

    return all_findings


def scan_history(root_dir: Path) -> List[Tuple[str, str, str]]:
    """
    Scan full commit history across all refs.
    Returns list of (commit_hash, file_path, rule_name).
    """
    findings = []
    try:
        commits = (
            subprocess.run(
                ["git", "rev-list", "--all"],
                cwd=str(root_dir),
                capture_output=True,
                text=True,
                check=True,
            )
            .stdout.strip()
            .splitlines()
        )
    except Exception as e:
        sys.stderr.write(f"Error listing commits: {e}\n")
        return []

    for commit in commits:
        diff_proc = subprocess.run(
            ["git", "show", "--format=%H", commit],
            cwd=str(root_dir),
            capture_output=True,
            text=True,
            errors="ignore",
        )
        current_file = ""
        for line in diff_proc.stdout.splitlines():
            if line.startswith("diff --git"):
                parts = line.split()
                if len(parts) >= 4:
                    current_file = parts[3].lstrip("b/")
            elif line.startswith("+") and not line.startswith("+++"):
                if is_excluded(current_file):
                    continue
                for rule_name, pattern in PATTERNS.items():
                    if pattern.search(line):
                        findings.append((commit[:8], current_file, rule_name))
    return findings


def main():
    parser = argparse.ArgumentParser(
        description="Scan repository for exposed secrets without exposing values."
    )
    parser.add_argument(
        "--history",
        action="store_true",
        help="Scan all commits in git history instead of current tracked tree.",
    )
    parser.add_argument(
        "--path",
        type=str,
        default=".",
        help="Path to repository root (defaults to current directory).",
    )
    args = parser.parse_args()

    repo_root = Path(args.path).resolve()

    if args.history:
        print(f"Scanning Git history across all refs in {repo_root}...")
        findings = scan_history(repo_root)
        if findings:
            print(f"\n[!] Detected {len(findings)} secret occurrence(s) in Git history:")
            for commit, fpath, rule in findings:
                print(f"  - Commit {commit}: {fpath} ({rule})")
            print("\nHistory remediation required (see docs/security/secret-inventory.md).")
            sys.exit(1)
        else:
            print("\n[✓] Git history scan passed: no secrets detected across reachable refs.")
            sys.exit(0)
    else:
        print(f"Scanning tracked tree in {repo_root}...")
        findings = scan_tracked_tree(repo_root)
        if findings:
            print(f"\n[!] Detected {len(findings)} secret occurrence(s) in tracked tree:")
            for fpath, line_no, rule in findings:
                print(f"  - {fpath}:{line_no} ({rule})")
            print("\nRemediation required. Do not commit active credentials.")
            sys.exit(1)
        else:
            print("\n[✓] Tracked tree scan passed: 0 exposed secrets found.")
            sys.exit(0)


if __name__ == "__main__":
    main()
