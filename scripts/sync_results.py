from scripts.api_client import get_fixture_by_id
from scripts.storage import read_json, write_json

FIXTURES_PATH = "Luton_chat_engine/chatbot/chatbot/data/fixtures.json"
RESULTS_PATH = "Luton_chat_engine/chatbot/chatbot/data/results.json"

FINISHED = {"FT"}  # full time

def sync_once():
    fixtures = read_json(FIXTURES_PATH) or []
    results = read_json(RESULTS_PATH) or []

    results_by_id = {r.get("fixtureId"): r for r in results if r.get("fixtureId") is not None}

    updated = 0

    for fx in fixtures:
        fixture_id = fx.get("fixtureId")
        if not fixture_id:
            continue

        # if already stored as FT result, skip
        if fixture_id in results_by_id and results_by_id[fixture_id].get("status") in FINISHED:
            continue

        payload = get_fixture_by_id(int(fixture_id))
        resp = payload.get("response") or []
        if not resp:
            continue

        item = resp[0]
        fixture = item.get("fixture", {})
        teams = item.get("teams", {})
        goals = item.get("goals", {})

        status = (fixture.get("status") or {}).get("short")  # NS / 1H / HT / 2H / FT etc

        # always update local fixture status
        if status:
            fx["status"] = status

        # if match finished -> write to results
        if status in FINISHED:
            result_row = {
                "fixtureId": fixture.get("id"),
                "date": fixture.get("date"),
                "homeTeam": (teams.get("home") or {}).get("name"),
                "awayTeam": (teams.get("away") or {}).get("name"),
                "homeScore": goals.get("home"),
                "awayScore": goals.get("away"),
                "status": status
            }
            results_by_id[fixture_id] = result_row
            updated += 1

    # save
    write_json(RESULTS_PATH, list(results_by_id.values()))
    write_json(FIXTURES_PATH, fixtures)
    print(f"✅ sync_once ran: updated={updated}, fixtures_checked={len(fixtures)}")
    
    return {"updated": updated, "fixtures_checked": len(fixtures)}