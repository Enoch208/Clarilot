# Zetaris schema discovery task
_Exported on 02/11/2026 at 7:33:52 GMT+1 from Cursor (3.27.22)_

---

**User**

Read AGENTS.md first and follow it.

Context: Zetaris 2.4.3.1 runs locally in Docker. Four sources are already registered in it: pharmacy_pg (tables dispensing, patients, stores, formulary, prescriptions), FDA_RAW.recalls (openFDA enforcement REST table, cached), FDA_RAW.shortages_p00 to FDA_RAW.shortages_p16 (openFDA shortage REST pages of 100, cached) and LOTS_FILES.receiving_lots (CSV). sql/setup/05_views.sql has NOT been run yet, so sql/named/alerts_master.sql fails with TABLE_OR_VIEW_NOT_FOUND for fda.recalls_by_ndc.

Task (schema discovery):
1. Connect to Zetaris over JDBC. Driver jar: /Users/enoch/zetaris/zetaris-platform/jdbc/ndp-jdbc-driver-2.4.3.1-7eff043-driver.jar. Driver class: com.zetaris.lightning.jdbc.LightningDriver. URL: jdbc:zetaris:lightning@localhost:10000. Read the user and password from /Users/enoch/zetaris/zetaris-platform/.env (keys ZETARIS_ADMIN_EMAIL and ZETARIS_ADMIN_PASSWORD) inside your script; never print them. Use that jar directly (for example JayDeBeApi in a Python venv under /tmp), not a Hive or Spark driver, and do not start Spark. One statement per call, no trailing semicolon. Verify with SELECT 1.
2. DESCRIBE FDA_RAW.recalls and FDA_RAW.shortages_p00 and run a LIMIT 1 probe on each. Compare the real column names, types and nesting (the results array, openfda.product_ndc, package_ndc, status, update_date and so on) with what sql/setup/05_views.sql assumes.
3. Fix sql/setup/05_views.sql to match the real shape. Only use column names you saw in DESCRIBE output. Then run its statements against Zetaris one at a time and report the row count of every view it creates.

Rules: edit only sql/setup/05_views.sql (scratch scripts go under /tmp). Do not read or print the repo's .env. Do not drop or re-register the existing sources. Do not commit or push. Finish with a short VERIFIED / BLOCKED / UNVERIFIED report listing what you changed and why.


---

**Cursor**

I'll start from the agent rules and the view SQL, then connect over JDBC and compare the live Zetaris columns with what `05_views.sql` assumes.

The view SQL explodes `results` and nested `openfda` fields. I'll connect with the Lightning JDBC driver and compare that to the live `DESCRIBE` output before changing anything.

`SELECT 1` returned a row. Next I’ll describe both REST tables and probe one row from each.

`DESCRIBE` shows two columns, `meta` and `results`, and the type strings were cut off. I’ll dump the full struct definitions and a one-row probe next.

The probed columns match the view: `results` is an array of structs, `openfda.product_ndc` is `array<string>`, and shortage `package_ndc` is a top-level string. I’ll check the other shortage pages, then create the views.

The view SQL already matched the live tables, so `sql/setup/05_views.sql` is unchanged. Both views are created and counted.

`SELECT 1` over the Lightning JDBC driver returned `1`. `DESCRIBE` shows each REST table as two columns, `meta` and `results`, not a flat row per record.

`FDA_RAW.recalls` has `meta.last_updated` and `results` as an array of structs. Each element has `recall_number`, `classification`, `status`, `report_date`, `recall_initiation_date`, `recalling_firm`, `product_description`, `reason_for_recall`, `code_info`, and `openfda.product_ndc` as `array<string>`. A one-row probe returned recall `D-0038-2027` with product NDCs `0093-2203` and `0093-2204`. `meta.last_updated` is `2026-10-21`. The table holds 191 records and 624 product NDCs, and every NDC matches the view’s product-NDC pattern.

`FDA_RAW.shortages_p00` has the same `meta` shape. Each `results` element has top-level `status`, `availability`, `update_date`, `generic_name`, and `package_ndc` as `string`. `openfda.package_ndc` and `openfda.product_ndc` are separate arrays. The view uses the top-level `package_ndc` string. A probe of `71357-009-10` produced product key `71357-0009`. `meta.last_updated` is `2026-10-30`. Pages `p00` through `p15` have 100 rows each and `p16` has 15, and every `package_ndc` matches the view’s package pattern.

All three statements in `sql/setup/05_views.sql` ran once each, with the trailing semicolon removed.

| View | Rows |
|---|---|
| `fda.recalls_by_ndc` | 624 |
| `fda.shortages_by_ndc` | 1615 |

**VERIFIED:** JDBC login, both `DESCRIBE` outputs, both `LIMIT 1` probes, container `fda`, both views, and both row counts.

**BLOCKED:** Nothing in this task.

**UNVERIFIED:** `sql/named/alerts_master.sql` was not run. The read-only principal was not checked against these new schema-store views.

---

**User**

Now run sql/named/alerts_master.sql through Zetaris unchanged, over the same JDBC connection, and show me the result or the exact error. Fix only what the error requires and keep all four sources (pharmacy_pg, FDA_RAW recalls, FDA_RAW shortages and LOTS_FILES.receiving_lots) in the one statement. Rerun until it returns rows. Then run the full gate from AGENTS.md. Do not commit or push. Report the unique recall_number:dispense_id keys it returns, and finish with a VERIFIED / BLOCKED / UNVERIFIED report.


---

**Cursor**

I’ll run `alerts_master.sql` unchanged over the same JDBC connection, then fix only what the error shows and rerun until it returns rows.

The statement returned 15 rows with no error, so the SQL stays as it is. I’ll pull the row contents and run the full gate.

`sql/named/alerts_master.sql` ran unchanged and returned **15 rows**. No SQL change was required. The statement still joins `pharmacy_pg`, `fda.recalls_by_ndc` (from `FDA_RAW.recalls`), `fda.shortages_by_ndc` (from `FDA_RAW.shortages_p00`–`p16`), and `lots_files.receiving_lots`.

Unique `recall_number:dispense_id` keys:

- `D-0038-2027:1379`
- `D-0038-2027:1390`
- `D-0038-2027:1397`
- `D-0038-2027:1406`
- `D-0038-2027:1414`
- `D-0038-2027:1419`
- `D-0038-2027:1429`
- `D-0042-2027:1337`
- `D-0042-2027:1342`
- `D-0042-2027:1355`
- `D-0042-2027:1363`
- `D-0788-2026:1338`
- `D-0788-2026:1343`
- `D-0788-2026:1356`
- `D-0788-2026:1364`

`D-0038-2027` and `D-0042-2027` are Class II, report date `20261021`. `D-0788-2026` is Class I, report date `20260826`. Receipts matched on seven of the fifteen dispenses. A current shortage matched the two morphine product keys `76045-0004` and `76045-0005` (`76045-004-11` and `76045-005-11`); `76045-0238` and both metoclopramide recalls had no shortage row.

The gate passed: typecheck, lint, local eslint, format check, 117 tests, and build.

**VERIFIED:** Unchanged `alerts_master.sql` over JDBC, 15 rows, the 15 keys above, and the full gate.

**BLOCKED:** Nothing.

**UNVERIFIED:** The API’s read-only Zetaris principal was not used for this run.

