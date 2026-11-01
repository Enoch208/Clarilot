import { describe, expect, it } from "vitest";
import { parseFdaCompactDate, parseShortageDate, shortageEvidenceFor } from "../src";

describe("U-08 FDA date formats", () => {
  it("parses enforcement yyyyMMdd and shortage MM/DD/YYYY to the same ISO day", () => {
    expect(parseFdaCompactDate("20261021")).toEqual({ raw: "20261021", iso: "2026-10-21" });
    expect(parseShortageDate("10/21/2026")).toEqual({ raw: "10/21/2026", iso: "2026-10-21" });
  });

  it("keeps the raw value and marks an invalid date instead of guessing", () => {
    expect(parseFdaCompactDate("20261341")).toEqual({ raw: "20261341", iso: null });
    expect(parseFdaCompactDate("10/21/2026")).toEqual({ raw: "10/21/2026", iso: null });
    expect(parseShortageDate("2026-10-21")).toEqual({ raw: "2026-10-21", iso: null });
    expect(parseShortageDate("02/30/2026")).toEqual({ raw: "02/30/2026", iso: null });
  });

  it("returns null when the source has no date at all", () => {
    expect(parseFdaCompactDate(undefined)).toBeNull();
    expect(parseShortageDate(null)).toBeNull();
  });
});

describe("U-12 shortage evidence", () => {
  it("never reads absence from a bounded subset as available", () => {
    expect(shortageEvidenceFor(null)).toBe("NOT_VERIFIED_IN_SUBSET");
    expect(shortageEvidenceFor(undefined)).toBe("NOT_VERIFIED_IN_SUBSET");
    expect(shortageEvidenceFor("")).toBe("NOT_VERIFIED_IN_SUBSET");
  });

  it("keeps the FDA status vocabulary instead of recoding it", () => {
    expect(shortageEvidenceFor("Current")).toBe("LISTED_CURRENT");
    expect(shortageEvidenceFor("Resolved")).toBe("LISTED_OTHER_STATUS");
    expect(shortageEvidenceFor("To Be Discontinued")).toBe("LISTED_OTHER_STATUS");
  });
});
