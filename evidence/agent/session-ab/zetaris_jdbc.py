import json
import sys
from pathlib import Path

import jaydebeapi

ENV_PATH = Path("/Users/enoch/zetaris/zetaris-platform/.env")
JAR = "/Users/enoch/zetaris/zetaris-platform/jdbc/ndp-jdbc-driver-2.4.3.1-7eff043-driver.jar"
URL = "jdbc:zetaris:lightning@localhost:10000"
DRIVER = "com.zetaris.lightning.jdbc.LightningDriver"


def load_admin():
    values = {}
    for raw in ENV_PATH.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    user = values["ZETARIS_ADMIN_EMAIL"]
    password = values["ZETARIS_ADMIN_PASSWORD"]
    if not user or not password:
        raise SystemExit("admin credentials missing")
    return user, password


def summarize(value, depth=0):
    if value is None:
        return None
    if isinstance(value, (bytes, bytearray)):
        return {"type": "bytes", "len": len(value)}
    if isinstance(value, str):
        return value
    if isinstance(value, (int, float, bool)):
        return value
    if isinstance(value, (list, tuple)):
        head = [summarize(item, depth + 1) for item in list(value)[:2]]
        return {"type": "list", "len": len(value), "head": head}
    if isinstance(value, dict):
        return {str(key): summarize(item, depth + 1) for key, item in value.items()}
    java_name = type(value).__name__
    return {"java": java_name, "text": str(value)}


def run(sql):
    user, password = load_admin()
    conn = jaydebeapi.connect(DRIVER, URL, [user, password], JAR)
    try:
        cur = conn.cursor()
        cur.execute(sql)
        description = cur.description
        columns = []
        if description:
            for col in description:
                columns.append(
                    {
                        "name": col[0],
                        "type_code": col[1],
                        "display_size": col[2],
                        "internal_size": col[3],
                        "precision": col[4],
                        "scale": col[5],
                    }
                )
        rows = []
        if description:
            fetched = cur.fetchmany(5)
            for row in fetched:
                rows.append([summarize(cell) for cell in row])
        print(
            json.dumps(
                {"sql": sql, "columns": columns, "row_count_fetched": len(rows), "rows": rows},
                indent=2,
                default=str,
            )
        )
    finally:
        conn.close()


def run_many(statements):
    user, password = load_admin()
    conn = jaydebeapi.connect(DRIVER, URL, [user, password], JAR)
    try:
        for sql in statements:
            if sql.endswith(";"):
                raise SystemExit("trailing semicolon refused")
            cur = conn.cursor()
            try:
                cur.execute(sql)
            except Exception as exc:
                message = str(exc)
                print(json.dumps({"sql": sql, "error": message[:4000]}, indent=2))
                continue
            description = cur.description
            columns = []
            rows = []
            if description:
                for col in description:
                    columns.append(col[0])
                for row in cur.fetchmany(25):
                    rows.append([summarize(cell) for cell in row])
            print(json.dumps({"sql": sql, "columns": columns, "rows": rows}, indent=2, default=str))
    finally:
        conn.close()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        run(sys.argv[1])
    else:
        statements = [line.strip() for line in sys.stdin if line.strip()]
        run_many(statements)
