
import os
from dotenv import load_dotenv

try:
    from google import genai
except ImportError:
    print("google.genai not found")
    exit(1)

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("GEMINI_API_KEY not found")
    exit(1)

client = genai.Client(api_key=api_key)

try:
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents="Hello"
    )
    print("Success:", response.text)
except Exception as e:
    print("Error:", e)
