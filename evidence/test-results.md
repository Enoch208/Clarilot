# Test results

Unit and API tests recorded 2026-11-02 at commit `d159656`; live Zetaris checks recorded 2026-11-02 01:09 UTC. macOS 27.2 (arm64), Node 24.14.1, pnpm 10.33.0, Zetaris 2.4.3.1.

## Gate

| Command             | Result                             |
| ------------------- | ---------------------------------- |
| `pnpm typecheck`    | Pass                               |
| `pnpm lint`         | Pass                               |
| `pnpm format:check` | Pass                               |
| `pnpm test`         | Pass: 121 of 121 tests in 14 files |
| `pnpm build`        | Pass                               |

## Unit and API tests

| File                                             | Tests | Covers                                                                                                                                                    |
| ------------------------------------------------ | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/tests/ndc.test.ts`                |    27 | U-01 4-4, 5-3 and 5-4 product NDCs; U-02 package NDCs; U-03 blank, undelimited and malformed values; U-07 recall NDC coverage gaps                        |
| `packages/core/tests/lot.test.ts`                |    16 | Exact lot match; U-04 substring is never exact; U-05 missing `code_info` or lot is unknown, never all lots; U-06 "all lots" phrases need a reviewed rule  |
| `packages/core/tests/lot-real-code-info.test.ts` |    13 | Lot token parsing on 11 real openFDA `code_info` strings fetched 2026-11-01                                                                               |
| `packages/core/tests/dates-shortage.test.ts`     |     5 | U-08 enforcement and shortage date formats; U-12 absence from the shortage pages read is not "available"                                                  |
| `packages/core/tests/contract.test.ts`           |     5 | Wire contract: failures carry no rows, alerts must be synthetic, drafts can never be sent                                                                 |
| `apps/api/tests/drafts.test.ts`                  |    11 | U-09 drafts with an invented lot, recall, date, dosage advice or safety claim are rejected; U-10 approvals are idempotent and conflicts refused           |
| `apps/api/tests/registry.test.ts`                |    10 | U-11 only named read-only queries run; INSERT, DELETE, UPDATE, DROP, CREATE and GRANT are refused; the verified flag is set only when V-06 to V-08 passed |
| `apps/api/tests/no-database.test.ts`             |     6 | With no pharmacy database, alerts and data quality answer `SOURCE_UNAVAILABLE`, never empty                                                               |
| `apps/api/tests/ledger-outage.test.ts`           |     3 | When a pharmacy outage also takes down the query ledger, alerts, health and data quality still report the source failure and say the run was not recorded |
| `apps/api/tests/zetaris-demo.test.ts`            |     5 | Demo controls need the token; Zetaris transport maps 401 and unknown shapes to failure states                                                             |
| `apps/api/tests/alerts.test.ts`                  |     4 | Unconfigured Zetaris and timeouts are failures, not empty results; rows map to unique recall:dispense cases                                               |
| `apps/api/tests/health.test.ts`                  |     5 | A failing source shows `UNAVAILABLE`; readiness stays off while the named SQL is unverified; sources show verified once it is                             |
| `apps/web/tests/format.test.ts`                  |     5 | openFDA recall links, source dates and ages                                                                                                               |
| `apps/web/tests/particle-field.test.ts`          |     6 | Landing page particle animation                                                                                                                           |

The API tests use a fake Zetaris transport. They prove how the API handles each response, not that Zetaris returns those responses.

## Zetaris checks

`pnpm --filter @clarilot/scripts verify --outage` against Zetaris 2.4.3.1 on 2026-11-02 01:09 UTC: **10 of 10 passed**. Full output in [verification.json](verification.json); what each check compared is in [source-parity.md](source-parity.md).

| Check                                        | Result                                            |
| -------------------------------------------- | ------------------------------------------------- |
| V-01 Zetaris version and `SELECT 1`          | Pass: 2.4.3.1, build `cb88df0b`                   |
| V-02 Postgres count through Zetaris = direct | Pass: 1,453 = 1,453                               |
| V-03 FDA recall table                        | Pass: 191 of 191, `last_updated` 2026-10-21       |
| V-04 FDA shortage table                      | Pass: page of 100, total 1,615                    |
| V-05 Receiving CSV count = file              | Pass: 39 = 39                                     |
| V-06 Four-source query returns rows          | Pass: 15 rows, 15 unique cases                    |
| V-07 JDBC client and backend same cases      | Pass: 15 = 15, identical                          |
| V-08 One Postgres insert adds one case       | Pass: 15 → 16, new key `D-0038-2027:900001`       |
| V-09 Runtime principal cannot write          | Pass: `User is not permitted to run this command` |
| V-10 Outage is not shown as zero cases       | Pass: `SOURCE_UNAVAILABLE`, no alert rows         |

V-10 failed on its first live run: the API answered HTTP 500 because the query ledger shares the stopped database. The fix and its test are in commit `f1aa4e0`.

Earlier, with no Zetaris configured (2026-11-01 02:35 UTC), the same harness recorded 1 pass and 9 failures, the Zetaris side of each check not having run.
