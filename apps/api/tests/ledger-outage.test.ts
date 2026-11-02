import {
  alertsResponseSchema,
  healthResponseSchema,
  isQueryFailure,
  quarantineResponseSchema,
} from "@clarilot/core";
import { describe, expect, it } from "vitest";
import type { LedgerStore } from "../src/stores/ledger";
import { call, stubZetaris, testDeps } from "./support/fakes";

const refusingLedger: LedgerStore = {
  record: () => Promise.reject(new Error("connect ECONNREFUSED 127.0.0.1:54360")),
  get: () => Promise.resolve(null),
};

const pharmacyDown = stubZetaris(() =>
  Promise.resolve({
    ok: false,
    state: "SOURCE_UNAVAILABLE",
    errorCode: "ZETARIS_HTTP_400",
    reason: "Zetaris returned HTTP 400: Connection to host.docker.internal:54360 refused",
    latencyMs: 40,
  }),
);

describe("a pharmacy outage that also takes the query ledger down", () => {
  it("still answers alerts with the source failure and says the run was not recorded", async () => {
    const { app } = await testDeps({ zetaris: pharmacyDown, ledger: refusingLedger });
    const reply = await call(app, "GET", "/api/alerts");
    expect(reply.status).toBe(503);
    const body = alertsResponseSchema.parse(reply.body);
    expect(isQueryFailure(body)).toBe(true);
    expect(body).toMatchObject({ status: "SOURCE_UNAVAILABLE" });
    expect(isQueryFailure(body) ? body.reason : "").toContain("not recorded in the query ledger");
  });

  it("keeps health answering and reports Zetaris as unavailable", async () => {
    const { app } = await testDeps({ zetaris: pharmacyDown, ledger: refusingLedger });
    const reply = await call(app, "GET", "/api/health");
    expect(reply.status).toBe(200);
    const body = healthResponseSchema.parse(reply.body);
    expect(body.zetaris.status).toBe("UNAVAILABLE");
    expect(body.zetaris.detail).toContain("not recorded in the query ledger");
  });

  it("keeps data quality answering as unavailable instead of failing", async () => {
    const { app } = await testDeps({ zetaris: pharmacyDown, ledger: refusingLedger });
    const body = quarantineResponseSchema.parse((await call(app, "GET", "/api/quarantine")).body);
    expect(body.status).toBe("SOURCE_UNAVAILABLE");
    expect(body.status === "SOURCE_UNAVAILABLE" ? body.reason : "").toContain(
      "Connection to host.docker.internal:54360 refused",
    );
  });
});
