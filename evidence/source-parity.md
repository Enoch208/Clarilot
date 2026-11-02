# Source parity

Each source read through Zetaris compared with a direct read of the same source, then the four-source query, the insert test and the outage test. Full machine output: [verification.json](verification.json), last run on 2026-11-02 at 01:09 UTC, 10 of 10 checks passed.

## The four sources

| Source                             | Zetaris object                                                | Direct read                                              | Through Zetaris                                                                  | Check |
| ---------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- | ----- |
| Synthetic pharmacy Postgres        | `pharmacy_pg.dispensing`                                      | `SELECT COUNT(*)` in Postgres: 1,453                     | 1,453                                                                            | V-02  |
| openFDA drug enforcement (recalls) | `FDA_RAW.recalls` → view `fda.recalls_by_ndc`                 | openFDA API: total 191, `meta.last_updated` 2026-10-21   | 191 records in the page, total 191, `last_updated` 2026-10-21; view has 624 rows | V-03  |
| openFDA drug shortages             | `FDA_RAW.shortages_p00` … `p16` → view `fda.shortages_by_ndc` | openFDA API: total 1,615, `meta.last_updated` 2026-10-30 | first page 100 of total 1,615; view has 1,615 rows                               | V-04  |
| Receiving ledger CSV               | `LOTS_FILES.receiving_lots`                                   | 39 data lines in `seed/receiving_lots.csv`               | 39                                                                               | V-05  |

The recall table reads one page of up to 1,000 records for `_exists_:openfda.product_ndc AND report_date:[20260701 TO 20261231]`; all 191 matching records fit in it. The shortage tables read the whole feed as it stood on 2026-11-01, in 17 pages of 100. Both FDA tables were cached when they were registered (2026-11-01 23:16–23:18 UTC); the API labels results `CACHED_FDA_UNCACHED_PHARMACY` and never calls the FDA data live.

## FDA records the synthetic data is built on

| Recall      | Product NDCs as published               | Join key after normalisation | Lots in `code_info`                |
| ----------- | --------------------------------------- | ---------------------------- | ---------------------------------- |
| D-0038-2027 | 0093-2203, 0093-2204                    | 00093-2203, 00093-2204       | 8634085, 8635085, 8636085, 8633085 |
| D-0042-2027 | 60687-620, 60687-631                    | 60687-0620, 60687-0631       | 1028135, 1029555                   |
| D-0788-2026 | 76045-004, -005, -006, -007, -008, -238 | 76045-0004 … 76045-0238      | 6402820                            |

Raw NDCs are kept next to the normalised 5-4 product key in every table and in the API response.

## The four-source query

[sql/named/alerts_master.sql](../sql/named/alerts_master.sql), SHA-256 of the trimmed statement `2fb51a5ec6a33f690288af44970bf23d5db8b096a1420fb885f530f4e81d4824`. One statement reads all four sources:

```sql
FROM pharmacy_pg.dispensing d
JOIN pharmacy_pg.patients p ...
JOIN fda.recalls_by_ndc r ON r.ndc_product_key = d.product_ndc_key
LEFT JOIN receipt_ranked l ...        -- lots_files.receiving_lots
LEFT JOIN shortage_ranked sh ...      -- fda.shortages_by_ndc
```

It returned 15 rows and 15 unique `recall_number:dispense_id` keys (V-06). The same SQL run separately over JDBC returned the identical 15 keys (V-07, [jdbc-case-ids.json](jdbc-case-ids.json)). The read-only principal the API uses runs it too.

| Case             | Dispensed NDC          | Dispensed lot   | Lot evidence                | Receiving ledger    | Shortage feed   |
| ---------------- | ---------------------- | --------------- | --------------------------- | ------------------- | --------------- |
| D-0038-2027:1390 | 0093-2203              | 8634085         | `LOT_EXACT`                 | receipt matched     | not listed      |
| D-0038-2027:1397 | 0093-2203              | 8635085         | `LOT_EXACT`                 | receipt matched     | not listed      |
| D-0038-2027:1406 | 0093-2203              | 8634085         | `LOT_EXACT`                 | no matching receipt | not listed      |
| D-0038-2027:1414 | 0093-2203-01 (package) | 8636085         | `LOT_EXACT`                 | receipt matched     | not listed      |
| D-0038-2027:1379 | 0093-2203              | SYN-77104       | `LOT_DIFFERENT_UNVERIFIED`  | receipt matched     | not listed      |
| D-0038-2027:1419 | 0093-2204              | none            | `PRODUCT_MATCH_LOT_UNKNOWN` | no matching receipt | not listed      |
| D-0038-2027:1429 | 0093-2203              | 8634085/8635085 | `PRODUCT_MATCH_LOT_UNKNOWN` | no matching receipt | not listed      |
| D-0042-2027:1337 | 60687-620              | 1028135         | `LOT_EXACT`                 | receipt matched     | not listed      |
| D-0042-2027:1342 | 60687-631              | 1029555         | `LOT_EXACT`                 | receipt matched     | not listed      |
| D-0042-2027:1355 | 60687-620              | SYN-55120       | `LOT_DIFFERENT_UNVERIFIED`  | no matching receipt | not listed      |
| D-0042-2027:1363 | 60687-631              | none            | `PRODUCT_MATCH_LOT_UNKNOWN` | no matching receipt | not listed      |
| D-0788-2026:1338 | 76045-004              | 6402820         | `LOT_EXACT`                 | receipt matched     | listed, Current |
| D-0788-2026:1343 | 76045-005              | 6402820         | `LOT_EXACT`                 | receipt matched     | listed, Current |
| D-0788-2026:1356 | 76045-004              | SYN-55120       | `LOT_DIFFERENT_UNVERIFIED`  | no matching receipt | listed, Current |
| D-0788-2026:1364 | 76045-238              | none            | `PRODUCT_MATCH_LOT_UNKNOWN` | no matching receipt | not listed      |

"Not listed" is reported as `NOT_VERIFIED_IN_SUBSET`, never as "available". All patients and stores are synthetic; lots starting `SYN-` are synthetic lots chosen not to match the notice.

Every one of the 19 planted scenarios in [seed/fixtures.json](../seed/fixtures.json) came out as specified: the 15 above with the expected evidence level, and 4 absent from the alert list because their data fails a quality rule (two undelimited NDCs, one malformed NDC, one dispense dated in the future). Those four (dispenses 1370, 1371, 1437 and 1453) appear in the data-quality view, whose validation query also runs through Zetaris, instead of being dropped silently.

## Insert test

V-08 deleted any earlier copy of synthetic dispense 900001, ran the query, committed one row to `pharmacy_pg.dispensing` in Postgres (recall D-0038-2027's product 0093-2204, lot 8633085), and ran the unchanged query again with no restart, reload or sync:

|                   | Rows | Unique cases              |
| ----------------- | ---- | ------------------------- |
| Before the insert | 15   | 15                        |
| After the insert  | 16   | 16                        |
| New case          |      | `D-0038-2027:900001` only |

The row was removed afterwards. Query ID of the second run: `34f2cc01-899d-40fd-ab9a-fcbf9613050a`.

## Outage test

V-10 stopped the pharmacy Postgres container, called `/api/alerts`, and started the container again. The API answered `SOURCE_UNAVAILABLE` with no alert rows, not an empty result. The first run of this check exposed a real defect: the query ledger lives in the same database, and the failed ledger write turned the response into a generic HTTP 500. That was fixed in commit `f1aa4e0`; the response now carries the source failure and states that the run was not recorded in the ledger.

## Timing

Measured on the machine above, from the API's query ledger ([query-ledger.json](query-ledger.json)), four-source query with results: 4 runs, 5,995 ms to 8,391 ms, median 7,596 ms. The target was 5 seconds for a warm refresh; it was not met on this laptop, where the amd64 Zetaris images run under emulation. The verification harness does not time its own runs; the gaps between its V-05, V-06 and V-07 timestamps were 5.0 s and 4.9 s.
