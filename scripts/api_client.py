import os
import requests
from dotenv import load_dotenv

load_dotenv()

BASE = os.getenv("APISPORTS_BASE", "https://v3.football.api-sports.io").rstrip("/")
KEY = os.getenv("APISPORTS_KEY")

def get_fixture_by_id(fixture_id: int) -> dict:
    if not KEY:
        raise RuntimeError("APISPORTS_KEY is missing. Put it in your .env file.")

    url = f"{BASE}/fixtures"
    headers = {"x-apisports-key": KEY}
    params = {"id": fixture_id}

    r = requests.get(url, headers=headers, params=params, timeout=20)
    r.raise_for_status()
    return r.json()