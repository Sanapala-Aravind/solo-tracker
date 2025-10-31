import os
from typing import List, Dict
from openai import OpenAI

SYSTEM_PROMPT = (
    "You are a focused productivity coach.\n"
    "Given activity logs, return 3–6 clear, actionable suggestions to improve the user's day.\n"
    "Keep it specific, prioritised, and concise. Use bullets, not paragraphs.\n"
    "If data is sparse, say so and suggest helpful next steps."
)

def _client():
    base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")
    api_key = os.environ.get("OLLAMA_API_KEY", "ollama")
    return OpenAI(base_url=base_url, api_key=api_key)

def build_user_prompt(date_str: str, rows: List[Dict]) -> str:
    header = f"Date: {date_str}\nTotal rows: {len(rows)}"
    lines = ["title | category | start | end | mins | completed"]
    for r in rows[:200]:
        start = r.get("start_time") or ""
        end = r.get("end_time") or ""
        mins = r.get("duration_minutes") or ""
        comp = "yes" if r.get("completed") else "no"
        lines.append(f"{r.get('title','')} | {r.get('category_name','')} | {start} | {end} | {mins} | {comp}")
    table = "\n".join(lines)
    return f"""{header}

Here are the activities from the SQL database (latest first):

{table}

Return:
- A short title for the day (<=60 chars)
- 3–6 bullet suggestions (each <=180 chars)
- An optional mini plan for tomorrow (<=3 bullets)
"""

def get_suggestions(date_str: str, rows: List[Dict]) -> str:
    client = _client()
    model = os.environ.get("OLLAMA_MODEL", "llama3:8b")
    prompt = build_user_prompt(date_str, rows)
    resp = client.chat.completions.create(
        model=model,
        temperature=0.4,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )
    return resp.choices[0].message.content.strip()
