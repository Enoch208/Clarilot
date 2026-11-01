# Clarilot

Clarilot checks a pharmacy's dispensing records against published FDA drug recalls and shows a pharmacist which records need review, with the evidence for each flag. One Zetaris SQL query reads four sources together: the pharmacy's Postgres database, the openFDA recall feed, the openFDA shortage feed and a receiving-ledger CSV.

**Boundaries.** Every pharmacy, patient and dispensing record here is synthetic. FDA recall and shortage records are real public data from openFDA and may be delayed or incomplete. Clarilot is not a validated clinical or notification system. A flag is an investigation candidate, not a finding that a patient received a recalled lot. Clarilot never sends anything; it drafts, and a pharmacist decides.

Live site: https://clarilot.vercel.app (landing page and console, no database and no Zetaris attached; see [Deployed site](#deployed-site)).

## Status

| Part                                                               | State                                               |
| ------------------------------------------------------------------ | --------------------------------------------------- |
| Real FDA recalls selected and archived with fetch times            | Done                                                |
| Synthetic pharmacy Postgres, seeded from those recalls             | Done, runs locally                                  |
| NDC normaliser, lot-evidence classifier, data-quality rules        | Done, unit tested                                   |
| API with named, read-only queries and a query ledger               | Done, tested against a fake Zetaris transport       |
| Console: queue, case, evidence drawer, review drafts, data quality | Done                                                |
| Zetaris source registration and the four-source query              | **Written, not yet run against a Zetaris instance** |
| Postgres insert test (new row appears in the same query)           | **Not yet run**                                     |

Until a Zetaris instance is connected, `/api/alerts` answers `SOURCE_UNAVAILABLE` and the console says so. It never shows an empty list as a clean result.

## How it works

1. **Four sources, one query.** [sql/named/alerts_master.sql](sql/named/alerts_master.sql) joins `pharmacy_pg.dispensing` (Postgres), `fda.recalls_by_ndc` (openFDA enforcement REST), `fda.shortages_by_ndc` (openFDA shortages REST) and `lots_files.receiving_lots` (CSV). The API runs that statement through Zetaris and does not merge sources in application code.
2. **NDCs are normalised, never guessed.** 4-4, 5-3 and 5-4 product NDCs map to one 5-4 key and the raw value is kept. Undelimited or malformed values go to the data-quality queue instead of being dropped.
3. **Lot evidence is conservative.** The classifier compares the dispensed lot with the lot tokens in the recall's `code_info`:

   | Level                       | Meaning                                                            |
   | --------------------------- | ------------------------------------------------------------------ |
   | `LOT_EXACT`                 | Lot identifier matches the recall notice                           |
   | `ALL_LOTS_EXPLICIT`         | Broad lot scope, only after a reviewed rule for that recall        |
   | `PRODUCT_MATCH_LOT_UNKNOWN` | Product matches, lot missing or unreadable; not a negative finding |
   | `LOT_DIFFERENT_UNVERIFIED`  | Product matches, lot differs; pharmacist checks the notice         |
   | `IDENTIFIER_UNVERIFIED`     | Identifier needs correction; still counted                         |
   | `SOURCE_UNAVAILABLE`        | A source failed; verification cannot complete                      |

   Missing `code_info` or a missing lot is never treated as "all lots".

4. **Every result carries its proof.** The evidence drawer shows the executed SQL, query ID, source list, fetch timestamps, latency and row count. Each run is written to the query ledger.
5. **Drafts stay drafts.** The draft text comes from a fixed template, is checked against the case facts (no invented lot, date, recall number, dosage advice or safety claim) and can only be approved or rejected as an internal state.

## FDA records used

Selected on 2026-11-01 from `https://api.fda.gov/drug/enforcement.json` with `_exists_:openfda.product_ndc AND report_date:[20260701 TO 20261101]` (191 matching records, `meta.last_updated` 2026-10-21). The full records, selection rules and hashes are in [seed/recalls_used.json](seed/recalls_used.json).

| Recall                                                                                            | Class | Report date | Firm                      | Product NDCs                            | Listed lots                        |
| ------------------------------------------------------------------------------------------------- | ----- | ----------- | ------------------------- | --------------------------------------- | ---------------------------------- |
| [D-0038-2027](https://api.fda.gov/drug/enforcement.json?search=recall_number%3A%22D-0038-2027%22) | II    | 2026-10-21  | Teva Pharmaceuticals USA  | 0093-2203, 0093-2204                    | 8634085, 8635085, 8636085, 8633085 |
| [D-0042-2027](https://api.fda.gov/drug/enforcement.json?search=recall_number%3A%22D-0042-2027%22) | II    | 2026-10-21  | American Health Packaging | 60687-620, 60687-631                    | 1028135, 1029555                   |
| [D-0788-2026](https://api.fda.gov/drug/enforcement.json?search=recall_number%3A%22D-0788-2026%22) | I     | 2026-08-26  | Fresenius Kabi USA        | 76045-004, -005, -006, -007, -008, -238 | 6402820                            |

Shortage context comes from all 1,615 records of `https://api.fda.gov/drug/shortages.json`, read in 17 pages of 100 (`meta.last_updated` 2026-10-30). A product absent from the pages read is `NOT_VERIFIED_IN_SUBSET`, never "available".

## Synthetic pharmacy data

Generated from a fixed seed by [seed/generate.ts](seed/generate.ts): 3 stores, 200 patients, 100 formulary products, 500 prescriptions, 1,453 dispensing rows and 39 receiving-ledger rows ([seed/receiving_lots.csv](seed/receiving_lots.csv)). Nineteen planted scenarios cover exact lots, different lots, missing lots, package NDCs, undelimited and malformed NDCs, ambiguous lot text and a future date. The expected outcome of each is in [seed/fixtures.json](seed/fixtures.json).

## Requirements

- Node 24 and pnpm 10.33
- Docker (for Postgres and Zetaris)
- A Zetaris platform bundle and registry access. It is not redistributable; download it from Zetaris Cloud after signing in.

## Setup

```sh
pnpm install --frozen-lockfile
cp .env.example .env
```

In `.env`, set `PG_PASSWORD`, put the same value into `DATABASE_URL`, and set `DEMO_TOKEN` to a random string of at least 16 characters.

```sh
docker compose up -d
```

Postgres starts on `127.0.0.1:54360` and loads the schema and seed from [seed/init](seed/init).

### Register the sources in Zetaris

Run these in the Zetaris SQL Editor as an admin, one statement at a time, in order:

1. [sql/setup/01_pharmacy_datasource.sql](sql/setup/01_pharmacy_datasource.sql): the Postgres datasource. Replace `${PG_PASSWORD}` with your value in the editor only.
2. [sql/setup/02_fda_recalls.sql](sql/setup/02_fda_recalls.sql): the openFDA enforcement REST table.
3. [sql/setup/03_fda_shortages.sql](sql/setup/03_fda_shortages.sql): the openFDA shortage REST tables, 17 pages of 100.
4. Upload `seed/receiving_lots.csv` to the Zetaris file store, then run [sql/setup/04_receiving_csv.sql](sql/setup/04_receiving_csv.sql).
5. [sql/setup/05_views.sql](sql/setup/05_views.sql): the normalised views the query reads.

Then create an API key for a read-only user and add `ZETARIS_BASE_URL`, `ZETARIS_API_KEY`, `ZETARIS_ORG_ID` and `ZETARIS_PRINCIPAL` to `.env`.

### Run

```sh
pnpm --filter @clarilot/api dev
pnpm --filter @clarilot/web dev
```

The console is at http://localhost:5200/console and the API at http://localhost:8820/api/health.

### Insert test and reset

With `DEMO_MODE=true`, the console's demo controls (or `POST /api/demo/insert-case` with the `DEMO_TOKEN`) commit one allowlisted synthetic dispense row, `900001` for recall D-0038-2027 lot 8633085, to Postgres. Rerunning the unchanged alerts query should then return one new case. `POST /api/demo/reset` removes it. The API can only insert the allowlisted rows; every query it sends to Zetaris is a named, read-only statement.

## Verification and tests

```sh
pnpm test
pnpm typecheck && pnpm lint && pnpm format:check && pnpm build
pnpm --filter @clarilot/scripts verify
```

`pnpm test` runs 117 unit and API tests. `verify` compares each Zetaris source with a direct read of the same source (Postgres count, openFDA totals and timestamps, CSV line count), runs the four-source query and writes [evidence/verification.json](evidence/verification.json). Without Zetaris it records the direct side and marks every Zetaris check as failed. Results are in [evidence/test-results.md](evidence/test-results.md).

## API

| Route                                    | Purpose                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `GET /api/health`                        | Status of Zetaris, Postgres, both openFDA feeds and the CSV             |
| `GET /api/sources`, `GET /api/freshness` | Source registration and fetch ages                                      |
| `GET /api/alerts`                        | Runs the four-source query; filters by recall, store and evidence level |
| `GET /api/alerts/:dispenseId`            | One case with its evidence                                              |
| `POST /api/alerts/:dispenseId/draft`     | Creates a template draft checked against the case                       |
| `POST /api/drafts/:draftId/decision`     | Approve or reject a draft (internal state only)                         |
| `GET /api/ledger/:queryId`               | One query ledger entry                                                  |
| `GET /api/quarantine`                    | Rows that failed the data-quality rules                                 |
| `GET /api/recalls/featured`              | The archived real recall records                                        |

## Repository

| Path                     | Contents                                                                     |
| ------------------------ | ---------------------------------------------------------------------------- |
| `apps/web`               | Vite + React site: landing page and investigation console                    |
| `apps/api`               | Hono API, Zetaris client, ledger, drafts                                     |
| `packages/core`          | Wire contract, NDC normaliser, lot classifier                                |
| `sql/setup`, `sql/named` | Zetaris registration SQL and the named queries the API may run               |
| `seed`                   | Recall selection, synthetic data generator, Postgres init SQL, receiving CSV |
| `scripts`                | Source parity checks and the Vercel packaging step                           |
| `evidence`               | Verification output and test results                                         |

## Deployed site

https://clarilot.vercel.app runs the same web app and API with no pharmacy database and no Zetaris connection. The landing page and its recall cards (archived openFDA records) work. The console reports Zetaris as not configured and the pharmacy database as unavailable, and shows no cases. A local Zetaris is not reachable from Vercel; the full flow runs locally.

## Troubleshooting

- **`/api/alerts` returns `SOURCE_UNAVAILABLE`.** Zetaris is not configured or not reachable. Check the `ZETARIS_*` values and `GET /api/health`.
- **Zetaris cannot reach Postgres.** The datasource uses `host.docker.internal:54360`. If that does not resolve from the Zetaris driver container, attach the `clarilot-pg` container to the Zetaris Docker network and use its container name.
- **The API refuses to start.** `DEMO_MODE=true` requires a `DEMO_TOKEN` of at least 16 characters.
