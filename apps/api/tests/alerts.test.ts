import { alertsResponseSchema, isQueryFailure } from "@clarilot/core";
import { describe, expect, it } from "vitest";
import { call, stubZetaris, testDeps } from "./support/fakes";
import { alertRow } from "./support/rows";

describe("GET /api/alerts", () => {
  it("answers SOURCE_UNAVAILABLE with no alert rows when Zetaris is not configured, and ledgers it", async () => {
    const { app, ledger } = await testDeps();
    const reply = await call(app, "GET", "/api/alerts");
    expect(reply.status).toBe(503);
    const body = alertsResponseSchema.parse(reply.body);
    expect(isQueryFailure(body)).toBe(true);
    expect(body).toMatchObject({ status: "SOURCE_UNAVAILABLE", failedSource: "zetaris" });
    expect("alerts" in body).toBe(false);
    expect(ledger.writes).toHaveLength(1);
    expect(ledger.writes[0]).toMatchObject({
      queryId: body.queryId,
      queryName: "alerts_master",
      executionStatus: "SOURCE_UNAVAILABLE",
      errorCode: "ZETARIS_NOT_CONFIGURED",
    });
  });

  it("reports a Zetaris timeout as TIMEOUT, never as an empty result", async () => {
    const zetaris = stubZetaris(() =>
      Promise.resolve({
        ok: false,
        state: "TIMEOUT",
        errorCode: "ZETARIS_TIMEOUT",
        reason: "Zetaris did not answer within 60000 ms",
        latencyMs: 60_000,
      }),
    );
    const { app } = await testDeps({ zetaris });
    const reply = await call(app, "GET", "/api/alerts");
    expect(reply.status).toBe(504);
    expect(alertsResponseSchema.parse(reply.body).status).toBe("TIMEOUT");
  });

  it("maps returned rows to unique recall:dispense cases with classifier evidence", async () => {
    const rows = [
      alertRow(),
      alertRow(),
      alertRow({
        dispense_id: "1379",
        lot_no: "SYN-77104",
        receipt_id: null,
        dispensed_at: "2026-10-20 15:30:00",
      }),
      alertRow({
        dispense_id: "1419",
        lot_no: null,
        receipt_id: null,
        dispensed_at: "2026-10-26 15:30:00",
      }),
      alertRow({
        dispense_id: "1338",
        recall_number: "D-0788-2026",
        classification: "Class I",
        report_date: "20260826",
        code_info: "Lot #: 6402820, Exp. Date 12/2028",
        recall_ndc_raw: "76045-004",
        product_ndc_raw: "76045-004",
        lot_no: "6402820",
        shortage_status: "Current",
        shortage_availability: "Available",
        shortage_update_date: "10/15/2026",
      }),
    ];
    const zetaris = stubZetaris(() => Promise.resolve({ ok: true, rows, latencyMs: 40 }));
    const { app, ledger } = await testDeps({ zetaris });
    const reply = await call(app, "GET", "/api/alerts");
    expect(reply.status).toBe(200);
    const body = alertsResponseSchema.parse(reply.body);
    if (isQueryFailure(body)) {
      throw new Error("expected results");
    }
    expect(body.totalCases).toBe(4);
    expect(body.alerts.map((a) => [a.caseKey, a.lot.level])).toEqual([
      ["D-0788-2026:1338", "LOT_EXACT"],
      ["D-0038-2027:1419", "PRODUCT_MATCH_LOT_UNKNOWN"],
      ["D-0038-2027:1390", "LOT_EXACT"],
      ["D-0038-2027:1379", "LOT_DIFFERENT_UNVERIFIED"],
    ]);
    const morphine = body.alerts[0];
    expect(morphine?.shortage).toMatchObject({
      evidence: "LISTED_CURRENT",
      sourceStatus: "Current",
    });
    expect(body.alerts[2]?.receiving.status).toBe("RECEIPT_MATCHED");
    expect(body.alerts[2]?.shortage.evidence).toBe("NOT_VERIFIED_IN_SUBSET");
    expect(body.alerts[2]?.dispense.dispensedAt).toBe("2026-10-22T15:30:00.000Z");
    expect(body.warnings.join(" ")).toContain("not yet been verified");
    expect(ledger.writes[0]).toMatchObject({ executionStatus: "RESULTS", rowCount: 5 });
  });

  it("filters by evidence level and store without rerunning anything else", async () => {
    const rows = [alertRow(), alertRow({ dispense_id: "1419", lot_no: null, store_id: "3" })];
    const zetaris = stubZetaris(() => Promise.resolve({ ok: true, rows, latencyMs: 10 }));
    const { app } = await testDeps({ zetaris });
    const reply = await call(
      app,
      "GET",
      "/api/alerts?evidenceLevel=PRODUCT_MATCH_LOT_UNKNOWN&storeId=3",
    );
    const body = alertsResponseSchema.parse(reply.body);
    expect(isQueryFailure(body) ? [] : body.alerts.map((a) => a.caseKey)).toEqual([
      "D-0038-2027:1419",
    ]);
  });
});
