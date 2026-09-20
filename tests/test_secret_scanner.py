"""
Unit tests verifying secret scanner functionality and synthetic canary detection.
"""

import unittest
from pathlib import Path

from scripts.scan_secrets import scan_text, scan_tracked_tree


class TestSecretScanner(unittest.TestCase):
    def test_synthetic_gemini_canary_is_detected(self):
        """Verify that a synthetic Google/Gemini canary token triggers detection."""
        canary = "AIza" + "0" * 35
        sample = f'# Sample configuration\nTEST_KEY = "{canary}"\n'
        findings = scan_text(sample, "test_file.py")
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0][0], "test_file.py")
        self.assertEqual(findings[0][1], 2)
        self.assertEqual(findings[0][2], "Google / Gemini API Key")

    def test_synthetic_openrouter_canary_is_detected(self):
        """Verify that a synthetic OpenRouter canary token triggers detection."""
        canary = "sk-or-v1-" + "a" * 64
        sample = f'export OPENROUTER_API_KEY="{canary}"\n'
        findings = scan_text(sample, "sample.env")
        rules = [f[2] for f in findings]
        self.assertIn("OpenRouter API Key", rules)

    def test_clean_content_passes(self):
        """Verify safe content without keys generates no findings."""
        sample = (
            '# Safe code\n'
            'import os\n'
            'key = os.getenv("API_KEY")\n'
            'if not key:\n'
            '    raise ValueError("Missing key")\n'
        )
        findings = scan_text(sample, "safe_module.py")
        self.assertEqual(len(findings), 0)

    def test_remediated_tracked_tree_passes_scan(self):
        """Verify that the current tracked tree passes without secret detections."""
        repo_root = Path(__file__).resolve().parent.parent
        findings = scan_tracked_tree(repo_root)
        self.assertEqual(
            findings,
            [],
            f"Expected 0 findings in remediated tracked tree, but found: {findings}",
        )


if __name__ == "__main__":
    unittest.main()
