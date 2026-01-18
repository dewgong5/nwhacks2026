"""
Simple test to verify Gemini API key works.
"""

from google import genai

client = genai.Client(api_key="AIzaSyDKFwcogxxhLuqOo7syAYSSqVqnGDi2A6A")

# Try gemini-1.5-flash (different quota than 2.0-flash)
response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents="Say hello in one word",
)

print(response.text)
