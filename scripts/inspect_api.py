
import importlib
import inspect
import pkgutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import stagesense


def peek(p):
    p = Path(p)
    print(
        f"\n### {p} "
        f"({p.stat().st_size if p.exists() else 'MISSING'} bytes)"
    )
    if not p.exists():
        return

    if p.suffix in (".csv", ".parquet"):
        import pandas as pd
        df = pd.read_csv(p) if p.suffix == ".csv" else pd.read_parquet(p)
        print("shape:", df.shape)
        print("columns:", list(df.columns))
        print(df.head(2).T.to_string())
    else:
        print(p.read_text(encoding="utf-8-sig", errors="replace")[:800])


def main():
    for m in pkgutil.walk_packages(
        stagesense.__path__, "stagesense."
    ):
        try:
            mod = importlib.import_module(m.name)
        except Exception as e:
            print(
                f"\n## {m.name} "
                f"[IMPORT FAILED: {type(e).__name__}: {e}]"
            )
            continue

        items = [
            (n, o)
            for n, o in inspect.getmembers(mod)
            if (inspect.isfunction(o) or inspect.isclass(o))
            and o.__module__ == m.name
            and not n.startswith("_")
        ]

        print(f"\n## {m.name}")
        for n, o in items:
            sig = (
                str(inspect.signature(o))
                if inspect.isfunction(o)
                else "(class)"
            )
            doc = (inspect.getdoc(o) or "").splitlines()
            print(f"- {n}{sig}" + (f"  # {doc[0]}" if doc else ""))

    for p in sys.argv[1:]:
        peek(p)


if __name__ == "__main__":
    main()
