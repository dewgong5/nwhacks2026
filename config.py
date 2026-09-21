"""
Centralized, validated runtime configuration for MarketMind.

Loads sensitive values from the runtime environment or approved secret mount.
Fails closed when required credentials for live provider mode are absent,
while allowing deterministic demo mode to run without credentials.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Optional, List
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Operational mode: 'deterministic' (demo mode, no paid external APIs) or 'live'
    AI_MODE: str = Field(
        default="deterministic",
        description="Mode of operation: 'deterministic' or 'live'.",
    )

    # Provider credentials (masked in representations)
    GEMINI_API_KEY: Optional[SecretStr] = Field(
        default=None,
        description="Google Gemini API key for trading consultant chat.",
    )
    OPENROUTER_API_KEY: Optional[SecretStr] = Field(
        default=None,
        description="OpenRouter API key for LLM trading agents.",
    )
    SESSION_SECRET: Optional[SecretStr] = Field(
        default=None,
        description="Secret key for signing sessions and WebSocket auth tokens.",
    )

    WS_TICKET_TTL_SECONDS: int = Field(default=60, ge=5, le=300)
    WS_MAX_MESSAGE_BYTES: int = Field(default=8192, ge=256, le=65536)
    WS_MAX_MESSAGES_PER_SECOND: int = Field(default=10, ge=1, le=100)

    # Server configuration
    HOST: str = Field(default="0.0.0.0", description="Server host binding.")
    PORT: int = Field(default=8000, description="Server port binding.")
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        description="Permitted CORS origins.",
    )

    @property
    def is_live_mode(self) -> bool:
        """Return True if live AI mode is explicitly enabled."""
        return self.AI_MODE.strip().lower() == "live"

    @property
    def is_deterministic_mode(self) -> bool:
        """Return True if deterministic demo mode is active."""
        return not self.is_live_mode

    @property
    def gemini_api_key_value(self) -> Optional[str]:
        """Return the unmasked Gemini API key string, or None if not configured."""
        return self.GEMINI_API_KEY.get_secret_value() if self.GEMINI_API_KEY else None

    @property
    def openrouter_api_key_value(self) -> Optional[str]:
        """Return the unmasked OpenRouter API key string, or None if not configured."""
        return self.OPENROUTER_API_KEY.get_secret_value() if self.OPENROUTER_API_KEY else None

    def require_gemini_key(self) -> str:
        """Return the Gemini API key or raise a sanitized ValueError."""
        key = self.gemini_api_key_value
        if not key:
            raise ValueError("Required provider credential missing: GEMINI_API_KEY")
        return key

    def require_openrouter_key(self) -> str:
        """Return the OpenRouter API key or raise a sanitized ValueError."""
        key = self.openrouter_api_key_value
        if not key:
            raise ValueError("Required provider credential missing: OPENROUTER_API_KEY")
        return key

    @property
    def session_secret_value(self) -> Optional[str]:
        """Return the unmasked session secret, or None when not configured."""
        return self.SESSION_SECRET.get_secret_value() if self.SESSION_SECRET else None

    def validate_mode(self) -> None:
        """
        Validate credentials against operational mode.
        Fails closed if live mode is requested without any provider credentials.
        """
        if self.is_live_mode:
            missing = []
            if not self.gemini_api_key_value and not self.openrouter_api_key_value:
                raise ValueError(
                    "Live AI mode enabled (AI_MODE=live) but required provider credentials "
                    "(GEMINI_API_KEY, OPENROUTER_API_KEY) are absent. Refusing to start in live mode."
                )


@lru_cache()
def get_settings() -> Settings:
    """Return the cached global Settings instance."""
    return Settings()
