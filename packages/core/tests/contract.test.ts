import { describe, expect, it } from "vitest";
import {
  alertsResponseSchema,
  draftSchema,
  isQueryFailure,
  lotEvidenceConclusions,
  lotEvidenceLevels,
  shortageEvidenceConclusions,
  shortageEvidences,
} from "../src";

describe("wire contract", () => {
  it("gives every lot evidence level and shortage evidence a stated conclusion", () => {
    expect(Object.keys(lotEvidenceConclusions).sort()).toEqual([...lotEvidenceLevels].sort());
    expect(Object.keys(shortageEvidenceConclusions).sort()).toEqual([...shortageEvidences].sort());
  });

  it("carries a source failure without any alert rows", () => {
    const failure = {
      status: "SOURCE_UNAVAILABLE",
      queryId: "3f1b6c2e-8a4d-4c1e-9b7a-2d5e6f708192",
      queryName: "alerts_master",
      checkedAt: "2026-11-01T03:00:00.000Z",
      failedSource: "zetaris",
      reason: "Zetaris is not configured",
    };
    const parsed = alertsResponseSchema.parse(failure);
    expect(parsed.status).toBe("SOURCE_UNAVAILABLE");
    expect("alerts" in parsed).toBe(false);
  });

  it("refuses a results payload whose alert claims it was not synthetic", () => {
    const parsed = alertsResponseSchema.safeParse({
      status: "RESULTS",
      queryId: "3f1b6c2e-8a4d-4c1e-9b7a-2d5e6f708192",
      queryName: "alerts_master",
      fetchedAt: "2026-11-01T03:00:00.000Z",
      latencyMs: 10,
      coverage: {
        recallSubset: "bounded",
        recallScope: "selected recalls",
        shortageSubset: "bounded",
        shortageScope: "first 100",
        publicationLagKnown: true,
      },
      cacheMode: "UNCACHED",
      snapshotTakenAt: null,
      sources: [],
      classifierVersion: "lot-v1",
      warnings: [],
      page: 1,
      pageSize: 50,
      totalCases: 1,
      alerts: [{ caseKey: "X:1", synthetic: false }],
    });
    expect(parsed.success).toBe(false);
  });

  it("never lets a draft claim it was sent", () => {
    const shape = draftSchema.shape.sent;
    expect(shape.safeParse(true).success).toBe(false);
    expect(shape.safeParse(false).success).toBe(true);
  });
});

describe("isQueryFailure", () => {
  it("narrows an alerts response to its failure variant only for failure states", () => {
    const failure = alertsResponseSchema.parse({
      status: "TIMEOUT",
      queryId: "3f1b6c2e-8a4d-4c1e-9b7a-2d5e6f708192",
      queryName: "alerts_master",
      checkedAt: "2026-11-01T03:00:00.000Z",
      failedSource: null,
      reason: "Zetaris did not answer within 60000 ms",
    });
    expect(isQueryFailure(failure)).toBe(true);
    expect(isQueryFailure({ status: "EMPTY_VERIFIED" as const })).toBe(false);
    expect(isQueryFailure({ status: "DEGRADED_CACHED" as const })).toBe(false);
  });
});
