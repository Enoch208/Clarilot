import {
  alertsResponseSchema,
  demoCasesResponseSchema,
  healthResponseSchema,
  quarantineResponseSchema,
} from "@clarilot/core";
import { describe, expect, it } from "vitest";
import { loadApiEnv } from "../src/env";
import {
  memoryLedger,
  noDatabaseReason,
  unconfiguredDrafts,
  unconfiguredPharmacy,
} from "../src/stores/unconfigured";
import { call, fixedNow, testDeps } from "./support/fakes";

const queryWrite = {
  queryName: "select_one",
  statementSha256: "b".repeat(64),
  safeSql: "SELECT 1",
  zetarisPrincipal: null,
  sourceNames: [],
  fetchedAt: null,
  cacheMode: null,
  rowCount: null,
  latencyMs: 0,
  executionStatus: "SOURCE_UNAVAILABLE" as const,
  errorCode: "ZETARIS_NOT_CONFIGURED",
  errorSummary: "not configured",
  classifierVersion: null,
};

async function deployedWithoutDatabase() {
  return testDeps({
    ledger: memoryLedger(500, () => fixedNow),
    pharmacy: unconfiguredPharmacy(),
    drafts: unconfiguredDrafts(),
    demo: { enabled: false, token: null },
  });
}

describe("an API deployed without a pharmacy database", () => {
  it("starts when DATABASE_URL is absent", () => {
    expect(loadApiEnv({}).DATABASE_URL).toBeUndefined();
  });

  it("answers alerts with SOURCE_UNAVAILABLE and records the query", async () => {
    const { app, deps } = await deployedWithoutDatabase();
    const reply = await call(app, "GET", "/api/alerts");
    expect(reply.status).toBe(503);
    const body = alertsResponseSchema.parse(reply.body);
    expect(body.status).toBe("SOURCE_UNAVAILABLE");
    expect(await deps.ledger.get(body.queryId)).toMatchObject({
      queryId: body.queryId,
      executionStatus: "SOURCE_UNAVAILABLE",
    });
  });

  it("reports the pharmacy as unavailable with the reason", async () => {
    const { app } = await deployedWithoutDatabase();
    const body = healthResponseSchema.parse((await call(app, "GET", "/api/health")).body);
    expect(body.pharmacy).toMatchObject({ status: "UNAVAILABLE", dispensingRows: null });
    expect(body.pharmacy.detail).toContain(noDatabaseReason);
    expect(body.verificationReady).toBe(false);
  });

  it("shows data quality as unavailable instead of empty", async () => {
    const { app } = await deployedWithoutDatabase();
    const body = quarantineResponseSchema.parse((await call(app, "GET", "/api/quarantine")).body);
    expect(body).toMatchObject({ status: "SOURCE_UNAVAILABLE" });
  });

  it("keeps demo controls off", async () => {
    const { app } = await deployedWithoutDatabase();
    const body = demoCasesResponseSchema.parse((await call(app, "GET", "/api/demo/cases")).body);
    expect(body).toEqual({ demoMode: false, cases: [] });
  });
});

describe("memoryLedger", () => {
  it("keeps only the newest entries up to its limit", async () => {
    const ledger = memoryLedger(2, () => fixedNow);
    const ids = [
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
      "00000000-0000-4000-8000-000000000003",
    ];
    for (const queryId of ids) await ledger.record({ ...queryWrite, queryId });
    expect(await ledger.get(ids[0] ?? "")).toBeNull();
    expect(await ledger.get(ids[2] ?? "")).toMatchObject({ createdAt: fixedNow.toISOString() });
  });
});
