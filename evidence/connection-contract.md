# Connection contract

How Clarilot reaches Zetaris, as observed on 2026-11-01 and 2026-11-02 (UTC). Everything below was run against a live instance; nothing is inferred from documentation alone.

## Environment

| Item            | Value                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Machine         | macOS 27.2, Apple Silicon (arm64), 24 GB RAM                                                                                                  |
| Docker          | Docker Desktop, engine 29.3.0, 10 GB memory and 10 CPUs given to Docker, Rosetta on for amd64 images                                          |
| Zetaris         | Platform bundle 2.4.3.1, build `cb88df0b` (`SHOW SERVER VERSION`), run locally with Docker Compose; web interface and API on `localhost:3000` |
| Pharmacy source | Postgres 16 (`postgres:16-alpine`) on `127.0.0.1:54360`, synthetic data only                                                                  |

The Zetaris engine container reaches the pharmacy Postgres at `host.docker.internal:54360` (Docker Desktop's host alias); a TCP probe from the driver container connected before the datasource was registered.

## Query transport used by the API

```
POST http://localhost:3000/api/proxy/sql-editor/sqls/run-query
Authorization: Bearer <API key>
X-Org-ID: 1
X-Request-ID: <uuid v4>
Content-Type: application/json

{"sql": "SELECT 1 AS one", "limit": 5}
```

Response, verbatim:

```json
{ "headers": ["one"], "data": [["1"]], "total": 1, "timeUsed": 130 }
```

- One statement per request, no trailing semicolon. DDL and metadata statements (`CREATE`, `REGISTER`, `SHOW`, `CACHE TABLE`) go through the same route.
- Values come back as strings (`"1"`, `"1453"`); the API parses every row with zod before use.
- Errors come back as HTTP 400 with a JSON message, for example `{"msg":"[TABLE_OR_VIEW_NOT_FOUND] The table or view `fda`.`recalls_by_ndc` cannot be found. ..."}` before the views existed. The API maps HTTP 401/403 to `ACCESS_DENIED` and other failures to `SOURCE_UNAVAILABLE`.
- `POST /api/proxy/query/sql/start` (body `{"select": ..., "pageLimit": n}`) also answers queries but rejects anything that is not a SELECT (`Bad Select SQL`), so it is not used.
- Sign-in for setup: `POST /api/auth/login` with `{"username", "password"}` returns `{idToken, refreshToken, orgId}`; the `idToken` works as the bearer token. API keys are created per user and expire (30 days here).

## JDBC

`jdbc:zetaris:lightning@localhost:10000`, driver class `com.zetaris.lightning.jdbc.LightningDriver`, jar `ndp-jdbc-driver-2.4.3.1-7eff043-driver.jar` from the platform bundle, Java 17. A separate JDBC session ran `DESCRIBE` on the REST tables, created the views and ran the four-source query; its case keys are in [jdbc-case-ids.json](jdbc-case-ids.json) and match the API's REST run (check V-07 in [verification.json](verification.json)).

## Principals

| Principal                        | Type                                 | Used for                                     |
| -------------------------------- | ------------------------------------ | -------------------------------------------- |
| Platform administrator           | Administrator                        | Registering sources and creating views, once |
| `clarilot-reader@clarilot.local` | General user, role `clarilot_reader` | Every query the Clarilot API runs            |

The reader role was set up with:

```sql
CREATE ROLE 'clarilot_reader' DESCRIBE BY 'Clarilot app read-only, four sources'
ASSIGN USER 'clarilot-reader@clarilot.local' TO ROLE 'clarilot_reader'
ASSIGN DATASOURCE pharmacy_pg TO ROLE 'clarilot_reader'
ASSIGN LIGHTNING DATABASE FDA_RAW, LOTS_FILES TO ROLE 'clarilot_reader'
GRANT SELECT ON ALL TO ROLE 'clarilot_reader'
```

`SHOW GRANT ROLE 'clarilot_reader' ON ALL` returns one grant: `SELECT` on `*`, no grant option. With its own API key the reader counted all four sources and ran the four-source query (15 rows). Its `CREATE LIGHTNING DATABASE` was refused with `{"msg":"User is not permitted to run this command"}` (check V-09). A first attempt at `CREATE ROLE` with a description containing a colon was rejected: role descriptions accept only letters, digits, `_`, `.`, `-` and `,`.

## Source registration

Run once as administrator through the transport above, in this order. All statements returned HTTP 200.

| Step              | Statements                                                                                                                                                                         | Observed                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Pharmacy Postgres | [01_pharmacy_datasource.sql](../sql/setup/01_pharmacy_datasource.sql): `CREATE DATASOURCE pharmacy_pg` (password supplied at run time, never stored), `REGISTER DATASOURCE TABLES` | 5 tables registered; `SELECT COUNT(*) FROM pharmacy_pg.dispensing` = 1453       |
| openFDA recalls   | [02_fda_recalls.sql](../sql/setup/02_fda_recalls.sql): `CREATE LIGHTNING DATABASE FDA_RAW`, `CREATE LIGHTNING REST TABLE recalls`, `CACHE TABLE`                                   | Table creation 9.6 s, cache 6.3 s                                               |
| openFDA shortages | [03_fda_shortages.sql](../sql/setup/03_fda_shortages.sql): 17 REST tables of 100 records, each cached                                                                              | 34 statements, 63 s in total                                                    |
| Receiving CSV     | Upload to the Zetaris file store, then [04_receiving_csv.sql](../sql/setup/04_receiving_csv.sql)                                                                                   | `COUNT(*)` = 39, header row read as column names                                |
| Views             | [05_views.sql](../sql/setup/05_views.sql), run over JDBC                                                                                                                           | `fda.recalls_by_ndc` (624 rows) and `fda.shortages_by_ndc` (1,615 rows) created |

The CSV was uploaded with the endpoint the Zetaris web interface uses:

```
POST /api/proxy/ndp-files/save   (multipart: path=/file-store, files=@seed/receiving_lots.csv)
→ {"results":[{"SaveSuccess":{"fileName":"receiving_lots.csv"}}]}
```

The file store then listed `receiving_lots.csv` at 2,914 bytes, the same size as the repository file (SHA-256 `e96589b6e348…`). Registering it with `path "dffs://receiving_lots.csv"` and `FORMAT CSV` worked; the platform's own guide shows `dffs://` only for PDF and Parquet files.

The REST tables were cached when they were created, 2026-11-01 between 23:16 and 23:18 UTC. Queries read that cached copy of the FDA data; the pharmacy Postgres is read live on every query, which is why the insert test works without reloading anything.
