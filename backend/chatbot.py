"""
chatbot.py
-----------
Handles the AI Assistant chatbot's reply logic for SANAD.
Uses the Groq API (fast, generous free tier) so the bot can
answer any question intelligently.

Setup:
    pip install groq python-dotenv
    Add to your .env file (same folder as app.py):
        GROQ_API_KEY=your_key_here
    (Get a free key at https://console.groq.com/keys)
"""

import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is not set. Add it to your .env file."
    )

client = Groq(api_key=GROQ_API_KEY)

# Fast, free-tier-friendly model with a generous daily limit.
MODEL_NAME = "openai/gpt-oss-120b"

# System instructions that give the bot context about SANAD.
# TODO: once the team's official guide/manual document arrives,
# paste its key content here (or load it from a file) so the bot
# answers using real product info instead of general knowledge.
SYSTEM_CONTEXT = """
You are the AI Assistant chatbot inside SANAD (Smart Contract Analyzer),
a web app that lets users upload contracts (PDF) and receive an
AI-generated risk analysis.

Your ONLY job is to help users navigate and use the SANAD website
itself. For example: how to upload a contract, where to view past
contracts, how to read a review report, how to change settings, how
to manage licenses.

You do NOT analyze contracts, calculate risk scores, or explain the
content of any specific contract — that is handled by a different
part of the platform, not by you. If a user asks you to analyze a
contract or explain risk results, politely tell them that's not
something you can do, and point them to the Review Report page
instead.

Site pages the user can be on: Dashboard, My Contracts, Review Report,
Upload Contracts, Settings, Licenses.

RESPONSE STYLE — follow this strictly:
- Keep answers SHORT. 2-4 sentences, or a short numbered list of at
  most 4 steps. Never write long explanations.
- Do NOT use Markdown formatting (no **, no ###, no tables, no
  horizontal rules). The chat display shows plain text only, so
  Markdown symbols would appear as literal characters and look broken.
- If steps are needed, write them as plain numbered lines like:
  1. Do this
  2. Then this
- Skip background explanation, edge cases, and troubleshooting
  sections unless the user specifically asks for more detail.

Answer clearly and concisely. If a question is unrelated to using the
SANAD website, politely redirect the user back to what you can help
with. Respond in the same language the user writes in (Arabic or
English).
"""

# Keep a simple in-memory conversation history per process for now.
# NOTE: this does not persist across server restarts and is not
# per-user — fine for testing, but chat history saving to the DB
# would replace this later if the team decides to add that feature.
_conversation_history = [
    {"role": "system", "content": SYSTEM_CONTEXT},
]


def generate_response(message: str) -> str:
    """
    Takes the user's message and returns the chatbot's reply.
    Called by the POST /chat route in app.py.
    """
    if not message or not message.strip():
        return "Please type a question and I'll be happy to help."

    _conversation_history.append({"role": "user", "content": message})

    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=_conversation_history,
        )
        reply = completion.choices[0].message.content
        _conversation_history.append({"role": "assistant", "content": reply})
        return reply
    except Exception as e:
        # Keep the app from crashing if the API call fails
        # (e.g. network issue, quota limit, invalid key).
        print(f"[chatbot.py] Groq API error: {e}")
        return (
            "Sorry, I'm having trouble reaching the AI service right now. "
            "Please try again in a moment."
        )