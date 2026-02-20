import json
from pathlib import Path
from typing import Any

def read_json(path: str) -> Any:
    p = Path(path)
    if not p.exists():
        return []
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)

def write_json(path: str, data: Any) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)

    tmp = p.with_suffix(p.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp.replace(p)