import json
import sys
from pathlib import Path

import jaydebeapi

sys.path.insert(0, "/tmp")
from zetaris_jdbc import DRIVER, JAR, URL, load_admin

SQL_PATH = Path("/Users/enoch/Developer/personal/Clarilot/sql/named/alerts_master.sql")


def statement():
    sql = SQL_PATH.read_text().strip()
    if sql.endswith(";"):
        sql = sql[:-1].rstrip()
    return sql


def main():
    sql = statement()
    user, password = load_admin()
    conn = jaydebeapi.connect(DRIVER, URL, [user, password], JAR)
    try:
        cur = conn.cursor()
        try:
            cur.execute(sql)
        except Exception as exc:
            print("ERROR")
            print(str(exc))
            return 1
        columns = [col[0] for col in (cur.description or [])]
        rows = cur.fetchall()
        records = []
        for row in rows:
            record = {}
            for index, name in enumerate(columns):
                value = row[index]
                if isinstance(value, str) and len(value) > 180:
                    value = value[:180] + "..."
                record[name] = value
            records.append(record)
        Path("/tmp/alerts_rows.json").write_text(json.dumps(records, indent=2, default=str))
        keys = sorted({f"{record.get('recall_number')}:{record.get('dispense_id')}" for record in records})
        print(json.dumps({"row_count": len(records), "unique_key_count": len(keys), "keys": keys}, indent=2))
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
