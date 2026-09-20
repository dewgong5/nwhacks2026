"""
Tests for centralized settings, credential isolation, and deterministic vs live mode.
"""

import os
import unittest
from unittest.mock import patch, MagicMock

from config import Settings
from agents import TradingAgent


class TestConfigAndSecurity(unittest.TestCase):
    def test_deterministic_startup_without_credentials_succeeds(self):
        """Verify deterministic mode starts cleanly without any API keys."""
        with patch.dict(os.environ, {"AI_MODE": "deterministic"}, clear=True):
            settings = Settings(_env_file=None)
            self.assertTrue(settings.is_deterministic_mode)
            self.assertFalse(settings.is_live_mode)
            try:
                settings.validate_mode()
            except ValueError as e:
                self.fail(f"validate_mode raised unexpectedly: {e}")

    def test_live_mode_without_credentials_fails_closed(self):
        """Verify live mode fails closed with sanitized error when credentials are absent."""
        with patch.dict(os.environ, {"AI_MODE": "live"}, clear=True):
            settings = Settings(_env_file=None)
            self.assertTrue(settings.is_live_mode)
            with self.assertRaises(ValueError) as ctx:
                settings.validate_mode()
            self.assertIn("Refusing to start in live mode", str(ctx.exception))
            self.assertIn("GEMINI_API_KEY, OPENROUTER_API_KEY", str(ctx.exception))

    def test_secret_string_masking_in_repr(self):
        """Verify credentials are never exposed in string representations."""
        raw_key = "AIzaSyDUMMYSECRETKEYFORTESTING12345"
        with patch.dict(os.environ, {"GEMINI_API_KEY": raw_key}, clear=True):
            settings = Settings(_env_file=None)
            rep = repr(settings)
            self.assertNotIn(raw_key, rep)
            self.assertIn("**********", rep)
            self.assertEqual(settings.gemini_api_key_value, raw_key)

    def test_missing_credential_accessors_raise_redacted_errors(self):
        """Verify accessor methods raise sanitized ValueErrors when keys are missing."""
        with patch.dict(os.environ, {}, clear=True):
            settings = Settings(_env_file=None)
            with self.assertRaises(ValueError) as ctx1:
                settings.require_gemini_key()
            self.assertEqual(str(ctx1.exception), "Required provider credential missing: GEMINI_API_KEY")

            with self.assertRaises(ValueError) as ctx2:
                settings.require_openrouter_key()
            self.assertEqual(str(ctx2.exception), "Required provider credential missing: OPENROUTER_API_KEY")

    def test_trading_agent_without_key_refuses_llm_call(self):
        """Verify TradingAgent fails closed when trying to call LLM without api key."""
        mock_orch = MagicMock()
        agent = TradingAgent("test_agent", mock_orch, api_key=None)
        agent.api_key = None
        with self.assertRaises(ValueError) as ctx:
            agent._call_llm([{"role": "user", "content": "hello"}])
        self.assertIn("Required provider credential missing: OPENROUTER_API_KEY", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
