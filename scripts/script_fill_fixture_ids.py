import os, json
from datetime import datetime
import requests
from dotenv import load_dotenv

load_dotenv()

BASE = os.getenv("APISPORTS_BASE", "https://v3.football.api-sports.io").rstrip("/")
KEY = os.getenv("APISPORTS_KEY")

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # project root folder
FIXTURES_PATH = str(ROOT / "Luton_chat_engine" / "chatbot" / "chatbot" / "data" / "fixtures.json")

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def api_get(path, params=None):
    if not KEY:
        raise RuntimeError("Missing APISPORTS_KEY in .env")
    url = f"{BASE}{path}"
    headers = {"x-apisports-key": KEY}
    r = requests.get(url, headers=headers, params=params, timeout=25)
    r.raise_for_status()
    return r.json()

def normalize(name: str) -> str:
    return (name or "").lower().replace("fc", "").replace(".", "").replace("-", " ").strip()

def same_team(a: str, b: str) -> bool:
    a, b = normalize(a), normalize(b)
    return a == b or a in b or b in a  # simple fuzzy match

def fixture_key(fx):
    # fx date/time -> "YYYY-MM-DD HH:MM"
    return f"{fx['date']} {fx['time']}"

def main():
    fixtures = load_json(FIXTURES_PATH)

    # We’ll search fixtures by date range using your own list
    dates = sorted(set([fx["date"] for fx in fixtures]))
    start, end = dates[0], dates[-1]

    # ---- STEP A: Find Luton team id (search by name) ----
    team_search = api_get("/teams", {"search": "Luton"})
    teams = team_search.get("response", [])
    if not teams:
        raise RuntimeError("Could not find 'Luton' team in API. Check your API key or API status.")

    # pick the best match containing "Luton"
    luton = None
    for t in teams:
        nm = (t.get("team") or {}).get("name", "")
        if "luton" in nm.lower():
            luton = t
            break
    if not luton:
        luton = teams[0]

    luton_id = (luton.get("team") or {}).get("id")
    luton_name = (luton.get("team") or {}).get("name")
    print(f"✅ Using team: {luton_name} (id={luton_id})")

    # ---- STEP B: Fetch fixtures for Luton in the date range ----
    # API-Football lets you filter by team + from/to dates
    api_fx = api_get("/fixtures", {"team": luton_id, "from": start, "to": end})
    api_list = api_fx.get("response", [])
    print(f"✅ API returned {len(api_list)} fixtures between {start} and {end}")

    # Build lookup from API fixtures
    api_lookup = []
    for item in api_list:
        fixture = item.get("fixture", {})
        teams = item.get("teams", {})
        home = (teams.get("home") or {}).get("name")
        away = (teams.get("away") or {}).get("name")
        fixture_id = fixture.get("id")
        dt = fixture.get("date")  # ISO string
        # take date+time (local match time from API is usually UTC ISO); we match by date+time only loosely
        api_lookup.append({
            "id": fixture_id,
            "date_iso": dt,
            "home": home,
            "away": away
        })

    # ---- STEP C: Match your fixtures -> API fixtures ----
    filled = 0
    for fx in fixtures:
        if fx.get("fixtureId"):
            continue

        # Match by teams and date (time match is hard due to timezone; we match date first + teams)
        target_date = fx["date"]
        target_home = fx["homeTeam"]
        target_away = fx["awayTeam"]

        candidates = []
        for a in api_lookup:
            if not a["date_iso"]:
                continue
            api_date = a["date_iso"][:10]  # YYYY-MM-DD
            if api_date != target_date:
                continue
            if same_team(a["home"], target_home) and same_team(a["away"], target_away):
                candidates.append(a)

        if len(candidates) == 1:
            fx["fixtureId"] = candidates[0]["id"]
            filled += 1
            print(f"✅ Filled: {fx['date']} {target_home} vs {target_away} -> {fx['fixtureId']}")
        elif len(candidates) > 1:
            print(f"⚠️ Multiple matches found for {fx['date']} {target_home} vs {target_away} (not filling)")
        else:
            print(f"❌ No API match found for {fx['date']} {target_home} vs {target_away}")

    save_json(FIXTURES_PATH, fixtures)
    print(f"\nDONE ✅ Filled fixtureId for {filled} fixture(s).")

if __name__ == "__main__":
    main()