import os, json, requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE = os.getenv("TSDB_BASE", "https://www.thesportsdb.com/api/v1/json").rstrip("/")
KEY  = os.getenv("TSDB_KEY", "3")
TEAM = os.getenv("TSDB_TEAM_ID", "133888")

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "Luton_chat_engine" / "chatbot" / "chatbot" / "data"
FIXTURES_PATH = DATA_DIR / "fixtures.json"
RESULTS_PATH  = DATA_DIR / "results.json"

def get_json(url: str) -> dict:
    r = requests.get(url, timeout=25)
    r.raise_for_status()
    return r.json()

def iso_kickoff(date_event: str, time_event: str | None) -> str:
    if not date_event:
        return ""
    t = (time_event or "00:00:00").strip()
    if len(t) == 5:
        t += ":00"
    return f"{date_event}T{t}Z"

def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # ---- NEXT FIXTURES ----
    next_url = f"{BASE}/{KEY}/eventsnext.php?id={TEAM}"
    next_data = get_json(next_url)
    next_events = next_data.get("events") or []

    fixtures = []
    for e in next_events:
        fixtures.append({
            "fixtureId": e.get("idEvent"),
            "kickoffUTC": iso_kickoff(e.get("dateEvent"), e.get("strTime")),
            "competition": e.get("strLeague") or e.get("strEvent"),
            "season": e.get("strSeason"),
            "homeTeam": e.get("strHomeTeam"),
            "awayTeam": e.get("strAwayTeam"),
            "venue": e.get("strVenue"),
            "statusShort": "NS",
            "source": "thesportsdb"
        })

    FIXTURES_PATH.write_text(json.dumps(fixtures, indent=2), encoding="utf-8")
    print(f"✅ fixtures.json saved: {len(fixtures)} items -> {FIXTURES_PATH}")

    # ---- LAST RESULTS ----
    last_url = f"{BASE}/{KEY}/eventslast.php?id={TEAM}"
    last_data = get_json(last_url)
    last_events = last_data.get("results") or last_data.get("events") or []

    results = []
    for e in last_events:
        hs = e.get("intHomeScore")
        aw = e.get("intAwayScore")
        score = f"{hs}-{aw}" if (hs is not None and aw is not None) else ""

        results.append({
            "fixtureId": e.get("idEvent"),
            "date": e.get("dateEvent"),
            "competition": e.get("strLeague") or e.get("strEvent"),
            "homeTeam": e.get("strHomeTeam"),
            "awayTeam": e.get("strAwayTeam"),
            "score": score,
            "status": "completed",
            "source": "thesportsdb"
        })

    RESULTS_PATH.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"✅ results.json saved: {len(results)} items -> {RESULTS_PATH}")

if __name__ == "__main__":
    main()