import os, json
from pathlib import Path
from datetime import datetime
import requests
from dotenv import load_dotenv

load_dotenv()

BASE = os.getenv("APISPORTS_BASE", "https://v3.football.api-sports.io").rstrip("/")
KEY  = os.getenv("APISPORTS_KEY")

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "Luton_chat_engine" / "chatbot" / "chatbot" / "data"
FIXTURES_PATH = DATA_DIR / "fixtures.json"

TEAM_ID = 1359  # your output showed Luton id=1359

def api_get(path, params=None):
    if not KEY:
        raise RuntimeError("Missing APISPORTS_KEY in .env")
    url = f"{BASE}{path}"
    headers = {"x-apisports-key": KEY}
    r = requests.get(url, headers=headers, params=params, timeout=25)
    r.raise_for_status()
    return r.json()

def main():
    # Choose the same range you used
    date_from = "2026-02-21"
    date_to   = "2026-05-02"

    resp = api_get("/fixtures", {"team": TEAM_ID, "next": 10})
    items = resp.get("response", [])
    print(f"✅ Downloaded {len(items)} fixtures from API")

    fixtures = []
    for it in items:
        fixture = it.get("fixture", {})
        league  = it.get("league", {})
        teams   = it.get("teams", {})

        status_short = (fixture.get("status") or {}).get("short")  # NS, FT etc

        fixtures.append({
            "fixtureId": fixture.get("id"),
            "kickoffUTC": fixture.get("date"),   # ISO UTC from API
            "competition": league.get("name"),
            "season": league.get("season"),
            "homeTeam": (teams.get("home") or {}).get("name"),
            "awayTeam": (teams.get("away") or {}).get("name"),
            "venue": (fixture.get("venue") or {}).get("name"),
            "statusShort": status_short,
            "source": "api-football"
        })

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    FIXTURES_PATH.write_text(json.dumps(fixtures, indent=2), encoding="utf-8")
    print(f"✅ Saved fixtures.json with fixtureId included:\n{FIXTURES_PATH}")

if __name__ == "__main__":
    main()