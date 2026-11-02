import json
import sys
from pathlib import Path

sys.path.insert(0, "/tmp")
from zetaris_jdbc import load_admin, DRIVER, URL, JAR
import jaydebeapi

SQL_PATH = Path("/Users/enoch/Developer/personal/Clarilot/sql/setup/05_views.sql")


def statements(text):
    parts = []
    current = []
    for line in text.splitlines():
        current.append(line)
        if line.rstrip().endswith(";"):
            raw = "\n".join(current).strip()
            current = []
            if raw.endswith(";"):
                raw = raw[:-1].rstrip()
            if raw:
                parts.append(raw)
    tail = "\n".join(current).strip()
    if tail:
        parts.append(tail)
    return parts


def main():
    stmts = statements(SQL_PATH.read_text())
    print(json.dumps({"statement_count": len(stmts), "heads": [s.splitlines()[0] for s in stmts]}))
    user, password = load_admin()
    conn = jaydebeapi.connect(DRIVER, URL, [user, password], JAR)
    try:
        for index, sql in enumerate(stmts, start=1):
            cur = conn.cursor()
            try:
                cur.execute(sql)
            except Exception as exc:
                print(json.dumps({"index": index, "ok": False, "error": str(exc)[:5000]}))
                return
            print(json.dumps({"index": index, "ok": True, "head": sql.splitlines()[0]}))
    finally:
        conn.close()


if __name__ == "__main__":
    main()
