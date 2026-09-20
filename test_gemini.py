"""
Simple test to verify Gemini API key works.
"""

import sys
from config import get_settings

try:
    from google import genai
except ImportError:
    print("google-genai is not installed.")
    sys.exit(1)

settings = get_settings()
api_key = settings.gemini_api_key_value

if not api_key:
    print("GEMINI_API_KEY is not configured in environment or .env.")
    sys.exit(1)

client = genai.Client(api_key=api_key)

# Try gemini-1.5-flash (different quota than 2.0-flash)
response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents="Say hello in one word",
)

print(response.text)
