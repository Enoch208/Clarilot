import { healthResponseSchema, sourcesResponseSchema } from "@clarilot/core";
import { describe, expect, it } from "vitest";
import {
  call,
  feedProbe,
  memoryPharmacy,
  stubZetaris,
  testDeps,
  registryMarked,
} from "./support/fakes";

describe("GET /api/health", () => {
  it("reports Zetaris as not configured and never claims verification readiness", async () => {
    const { app } = await testDeps();
    const reply = await call(app, "GET", "/api/health");
    expect(reply.status).toBe(200);
    const body = healthResponseSchema.parse(reply.body);
    expect(body.zetaris.status).toBe("NOT_CONFIGURED");
    expect(body.pharmacy).toMatchObject({ status: "OK", dispensingRows: 1453 });
    expect(body.recalls).toMatchObject({ status: "OK", sourcePublishedAt: "2026-10-21" });
    expect(body.verificationReady).toBe(false);
  });

  it("shows a failing source as UNAVAILABLE instead of healthy", async () => {
    const pharmacy = memoryPharmacy({
      countDispensing: () => Promise.reject(new Error("connect ECONNREFUSED 127.0.0.1:54360")),
    });
    const { app } = await testDeps({ pharmacy, feeds: feedProbe("UNAVAILABLE") });
    const body = healthResponseSchema.parse((await call(app, "GET", "/api/health")).body);
    expect(body.pharmacy).toMatchObject({ status: "UNAVAILABLE", dispensingRows: null });
    expect(body.pharmacy.detail).toContain("ECONNREFUSED");
    expect(body.recalls).toMatchObject({ status: "UNAVAILABLE", sourcePublishedAt: null });
    expect(body.coverage.publicationLagKnown).toBe(false);
    expect(body.verificationReady).toBe(false);
  });

  it("stays not ready while the named SQL is unverified, even when every probe answers", async () => {
    const zetaris = stubZetaris(() =>
      Promise.resolve({ ok: true, rows: [{ one: "1" }], latencyMs: 3 }),
    );
    const { app, ledger } = await testDeps({ zetaris });
    const body = healthResponseSchema.parse((await call(app, "GET", "/api/health")).body);
    expect(body.zetaris.status).toBe("OK");
    expect(body.zetaris.detail).toContain("not yet verified");
    expect(body.verificationReady).toBe(false);
    expect(ledger.writes.map((w) => w.queryName)).toEqual(["select_one"]);
  });

  it("describes all four sources with their registration status", async () => {
    const { app } = await testDeps();
    const body = sourcesResponseSchema.parse((await call(app, "GET", "/api/sources")).body);
    expect(body.sources.map((s) => [s.id, s.registration])).toEqual([
      ["pharmacy_pg", "UNVERIFIED"],
      ["fda_recalls", "UNVERIFIED"],
      ["fda_shortages", "UNVERIFIED"],
      ["receiving_csv", "UNVERIFIED"],
    ]);
  });

  it("marks every source verified once the named SQL is verified in Zetaris", async () => {
    const { app } = await testDeps({ registry: await registryMarked(true) });
    const body = sourcesResponseSchema.parse((await call(app, "GET", "/api/sources")).body);
    expect(body.sources.every((s) => s.registration === "VERIFIED")).toBe(true);
  });
});
