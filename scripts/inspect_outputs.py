
import ast
import json
import inspect
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JOB = ROOT / "storage" / "jobs" / "wikimania-test"

JSON_FILES = [
    "words.json",
    "acoustic_features.json",
    "visual_features.json",
    "combined_features.json",
    "window_scores.json",
    "pause_annotations.json",
]

SOURCE_FILES = [
    "stagesense/pipeline.py",
    "stagesense/align/combine_features.py",
    "stagesense/scoring/score_windows.py",
    "stagesense/audio/fluency.py",
]


def show_structure(value, indent=0, max_items=8):
    prefix = " " * indent

    if isinstance(value, dict):
        for key, item in list(value.items())[:max_items]:
            print(f"{prefix}{key}: ", end="")
            if isinstance(item, (dict, list)):
                print(f"{type(item).__name__}")
                show_structure(item, indent + 2, max_items)
            else:
                print(repr(item)[:120])

        if len(value) > max_items:
            print(f"{prefix}... ({len(value)} keys total)")

    elif isinstance(value, list):
        print(f"{prefix}list length={len(value)}")
        if value:
            show_structure(value[0], indent + 2, max_items)


def main():
    for name in JSON_FILES:
        path = JOB / name
        print(f"\n### JSON: {path}")
        if not path.is_file():
            print("MISSING")
            continue

        try:
            data = json.loads(path.read_text(encoding="utf-8-sig"))
            show_structure(data)
        except Exception as exc:
            print(f"READ FAILED: {type(exc).__name__}: {exc}")

    for relative in SOURCE_FILES:
        path = ROOT / relative
        print(f"\n### SOURCE: {relative}")
        if not path.is_file():
            print("MISSING")
            continue

        source = path.read_text(encoding="utf-8-sig")
        try:
            tree = ast.parse(source)
            for node in tree.body:
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    print(f"\n--- {node.name} (lines {node.lineno}-{node.end_lineno}) ---")
                    print("\n".join(source.splitlines()[node.lineno - 1:node.end_lineno]))
        except SyntaxError as exc:
            print(f"SOURCE PARSE FAILED: {exc}")


if __name__ == "__main__":
    main()
