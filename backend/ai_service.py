import os
import json
from groq import Groq
import urllib.request
from dotenv import load_dotenv

load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are a ticket triage AI for an internal helpdesk.
Analyze the ticket and return ONLY a valid JSON object. No explanation, no markdown, no extra text.

Return exactly this schema:
{
  "category": "Billing | Bug | Access | HR | Server | DB | Feature | Other",
  "severity": "Critical | High | Medium | Low",
  "sentiment": "Frustrated | Neutral | Polite",
  "summary": "2-3 sentence summary of the issue",
  "resolution_path": "auto_resolve | assign",
  "department": "Engineering | Finance | HR | IT | Product | Marketing | Legal | DevOps",
  "confidence": 0.92,
  "estimated_hours": 4,
  "auto_response": "full response text if auto_resolve, else null"
}

Routing rules:
- DB / data corruption → category=DB, severity=Critical, department=Engineering
- Server down / performance → category=Server, severity=Critical, department=DevOps
- Access / account locked → category=Access, severity=High, department=IT
- Payroll / salary → category=Billing, department=Finance
- Leave / HR policy → category=HR, department=HR
- Product bugs → category=Bug, department=Engineering
- Feature requests → category=Feature, department=Product
- Legal / compliance → department=Legal

Auto-resolve ONLY for:
- Password reset instructions
- Leave application process or HR policy questions
- General FAQs about tools or processes
- Simple billing clarifications

Auto-response rules:
- Professional tone, reference the specific issue
- End with: "Was this helpful? Please click Yes or No below."
- If resolution_path is assign, set auto_response to null
"""

def parse_json(raw: str) -> dict:
    """Strip markdown fences and parse JSON."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def try_groq(title: str, description: str) -> dict:
    user_message = f"Ticket Title: {title}\n\nDescription:\n{description}"
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ],
        temperature=0.1
    )
    return parse_json(response.choices[0].message.content)


def try_ollama(title: str, description: str) -> dict:
    """Call local Ollama API directly — no extra library needed."""
    user_message = f"Ticket Title: {title}\n\nDescription:\n{description}"
    payload = json.dumps({
        "model": "llama3.2",       # change to any model you have pulled
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ],
        "stream": False
    }).encode("utf-8")

    req = urllib.request.Request(
        "http://localhost:11434/api/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
    return parse_json(data["message"]["content"])


def fallback_response(title: str) -> dict:
    return {
        "category": "Other",
        "severity": "Medium",
        "sentiment": "Neutral",
        "summary": f"Ticket submitted: {title}. Manual review required.",
        "resolution_path": "assign",
        "department": "IT",
        "confidence": 0.5,
        "estimated_hours": 4,
        "auto_response": None
    }


def analyze_ticket(title: str, description: str) -> dict:
    # 1. Try Groq first
    try:
        print("[AI] Trying Groq...")
        result = try_groq(title, description)
        print("[AI] Groq succeeded")
        return result
    except Exception as e:
        print(f"[AI] Groq failed: {e}")

    # 2. Fall back to Ollama
    try:
        print("[AI] Falling back to Ollama...")
        result = try_ollama(title, description)
        print("[AI] Ollama succeeded")
        return result
    except Exception as e:
        print(f"[AI] Ollama failed: {e}")

    # 3. Last resort — safe default
    print("[AI] All providers failed. Using fallback.")
    return fallback_response(title)