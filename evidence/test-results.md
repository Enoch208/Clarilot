# Test results

Recorded 2026-11-01 20:05 UTC at commit `0474523` on macOS 27.2 (arm64), Node 24.14.1, pnpm 10.33.0.

## Gate

| Command             | Result                             |
| ------------------- | ---------------------------------- |
| `pnpm typecheck`    | Pass                               |
| `pnpm lint`         | Pass                               |
| `pnpm format:check` | Pass                               |
| `pnpm test`         | Pass: 117 of 117 tests in 13 files |
| `pnpm build`        | Pass                               |

## Unit and API tests

| File                                             | Tests | Covers                                                                                                                                                   |
| ------------------------------------------------ | ----: | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/tests/ndc.test.ts`                |    27 | U-01 4-4, 5-3 and 5-4 product NDCs; U-02 package NDCs; U-03 blank, undelimited and malformed values; U-07 recall NDC coverage gaps                       |
| `packages/core/tests/lot.test.ts`                |    16 | Exact lot match; U-04 substring is never exact; U-05 missing `code_info` or lot is unknown, never all lots; U-06 "all lots" phrases need a reviewed rule |
| `packages/core/tests/lot-real-code-info.test.ts` |    13 | Lot token parsing on 11 real openFDA `code_info` strings fetched 2026-11-01                                                                              |
| `packages/core/tests/dates-shortage.test.ts`     |     5 | U-08 enforcement and shortage date formats; U-12 absence from the shortage pages read is not "available"                                                 |
| `packages/core/tests/contract.test.ts`           |     5 | Wire contract: failures carry no rows, alerts must be synthetic, drafts can never be sent                                                                |
| `apps/api/tests/drafts.test.ts`                  |    11 | U-09 drafts with an invented lot, recall, date, dosage advice or safety claim are rejected; U-10 approvals are idempotent and conflicts refused          |
| `apps/api/tests/registry.test.ts`                |    10 | U-11 only named read-only queries run; INSERT, DELETE, UPDATE, DROP, CREATE and GRANT are refused                                                        |
| `apps/api/tests/no-database.test.ts`             |     6 | With no pharmacy database, alerts and data quality answer `SOURCE_UNAVAILABLE`, never empty                                                              |
| `apps/api/tests/zetaris-demo.test.ts`            |     5 | Demo controls need the token; Zetaris transport maps 401 and unknown shapes to failure states                                                            |
| `apps/api/tests/alerts.test.ts`                  |     4 | Unconfigured Zetaris and timeouts are failures, not empty results; rows map to unique recall:dispense cases                                              |
| `apps/api/tests/health.test.ts`                  |     4 | A failing source shows `UNAVAILABLE`; readiness stays off while the named SQL is unverified                                                              |
| `apps/web/tests/format.test.ts`                  |     5 | openFDA recall links, source dates and ages                                                                                                              |
| `apps/web/tests/particle-field.test.ts`          |     6 | Landing page particle animation                                                                                                                          |

The API tests use a fake Zetaris transport. They prove how the API handles each response, not that Zetaris returns those responses.

## Zetaris checks

`pnpm --filter @clarilot/scripts verify` last ran on 2026-11-01 02:35 UTC with no Zetaris instance configured: 1 check passed and 9 failed. The pass is V-10: with a source down, `/api/alerts` answered `SOURCE_UNAVAILABLE` with no alert rows. The direct side of each check was recorded (Postgres 1,453 dispensing rows; openFDA enforcement total 191, `last_updated` 2026-10-21; shortages total 1,615, `last_updated` 2026-10-30; receiving CSV 39 rows). The Zetaris side of each check was not run. Full output: [verification.json](verification.json).

The integration checks against a live Zetaris instance (source parity, the four-source query in the SQL Editor and the app, the Postgres insert test, the outage and recovery test, and the read-only user test) have not been run yet.
