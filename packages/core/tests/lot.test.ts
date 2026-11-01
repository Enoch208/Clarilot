import { describe, expect, it } from "vitest";
import { classifyLotEvidence, type LotClassifierInput } from "../src";

const base: LotClassifierInput = {
  recallNumber: "D-0000-2026",
  codeInfo: null,
  recallNdcRaw: "12345-6789",
  dispenseNdcRaw: "12345-6789",
  dispenseLot: null,
};

const classify = (overrides: Partial<LotClassifierInput>) =>
  classifyLotEvidence({ ...base, ...overrides });

describe("classifyLotEvidence fixtures", () => {
  it("LOT ABC123 with dispensed ABC123 is an exact lot match", () => {
    const result = classify({ codeInfo: "LOT ABC123", dispenseLot: "ABC123" });
    expect(result.level).toBe("LOT_EXACT");
    expect(result.matchedToken).toBe("ABC123");
  });

  it("U-04 LOT ABC1234 with dispensed ABC123 is never an exact match on a substring", () => {
    const result = classify({ codeInfo: "LOT ABC1234", dispenseLot: "ABC123" });
    expect(result.level).not.toBe("LOT_EXACT");
    expect(result.level).toBe("LOT_DIFFERENT_UNVERIFIED");
    expect(result.parsedLotTokens).toEqual(["ABC1234"]);
  });

  it("U-04 a dispensed lot longer than the listed lot is not exact either", () => {
    expect(classify({ codeInfo: "Lot ABC123", dispenseLot: "ABC1234" }).level).not.toBe(
      "LOT_EXACT",
    );
  });

  it.each(["ABC123", "def456"])("lots ABC123, DEF456 matches either listed lot (%s)", (lot) => {
    const result = classify({ codeInfo: "lots ABC123, DEF456", dispenseLot: lot });
    expect(result.level).toBe("LOT_EXACT");
    expect(result.parsedLotTokens).toEqual(["ABC123", "DEF456"]);
  });

  it("Lot 23-01, expiry 12/2027 does not read the expiration as a lot", () => {
    const codeInfo = "Lot 23-01, expiry 12/2027";
    expect(classify({ codeInfo, dispenseLot: "12/2027" }).level).toBe("PRODUCT_MATCH_LOT_UNKNOWN");
    expect(classify({ codeInfo, dispenseLot: "2027" }).level).toBe("LOT_DIFFERENT_UNVERIFIED");
    expect(classify({ codeInfo, dispenseLot: "23-01" }).level).toBe("LOT_EXACT");
    expect(classify({ codeInfo, dispenseLot: "23-01" }).parsedLotTokens).toEqual(["23-01"]);
  });

  it("U-05 empty code_info is unknown, never all lots", () => {
    for (const codeInfo of [null, "", "   "]) {
      expect(classify({ codeInfo, dispenseLot: "ABC123" }).level).toBe("PRODUCT_MATCH_LOT_UNKNOWN");
    }
  });

  it("U-05 a dispensing row with no lot is unknown, never all lots", () => {
    for (const dispenseLot of [null, "", "  "]) {
      expect(classify({ codeInfo: "Lot ABC123", dispenseLot }).level).toBe(
        "PRODUCT_MATCH_LOT_UNKNOWN",
      );
    }
  });

  it("U-06 all lots within expiration without a reviewed rule is not an explicit scope", () => {
    const result = classify({ codeInfo: "all lots within expiration", dispenseLot: "XYZ999" });
    expect(result.level).toBe("PRODUCT_MATCH_LOT_UNKNOWN");
  });

  it("U-06 an all-lots phrase in unrelated text does not trigger a rule for another recall", () => {
    const result = classify({
      codeInfo: "Not all lots were distributed; Lot ABC123",
      dispenseLot: "XYZ999",
      allLotsRules: [{ recallNumber: "D-9999-2026", phrase: "all lots", reviewedBy: "reviewer" }],
    });
    expect(result.level).not.toBe("ALL_LOTS_EXPLICIT");
  });

  it("all lots within expiration is explicit only after a reviewed rule for this recall", () => {
    const result = classify({
      codeInfo: "All lots within expiration",
      dispenseLot: null,
      allLotsRules: [
        { recallNumber: "D-0000-2026", phrase: "all lots within expiration", reviewedBy: "QA" },
      ],
    });
    expect(result.level).toBe("ALL_LOTS_EXPLICIT");
  });

  it("missing dispensing NDC is an identifier exception", () => {
    expect(
      classify({ dispenseNdcRaw: "", codeInfo: "Lot ABC123", dispenseLot: "ABC123" }),
    ).toMatchObject({
      level: "IDENTIFIER_UNVERIFIED",
    });
  });

  it("an undelimited or malformed NDC is an identifier exception, not a safe row", () => {
    expect(classify({ dispenseNdcRaw: "1234567890", dispenseLot: "ABC123" }).level).toBe(
      "IDENTIFIER_UNVERIFIED",
    );
    expect(classify({ recallNdcRaw: "12-345", dispenseLot: "ABC123" }).level).toBe(
      "IDENTIFIER_UNVERIFIED",
    );
  });

  it("a package NDC is projected to its product before comparison", () => {
    const result = classify({
      dispenseNdcRaw: "12345-6789-01",
      codeInfo: "Lot ABC123",
      dispenseLot: "abc123",
    });
    expect(result.level).toBe("LOT_EXACT");
  });

  it("a dirty dispensing lot is not compared and stays review-needed", () => {
    expect(classify({ codeInfo: "Lot ABC123", dispenseLot: "ABC 123?" }).level).toBe(
      "PRODUCT_MATCH_LOT_UNKNOWN",
    );
  });

  it("stamps every result with the classifier version and a stated conclusion", () => {
    const result = classify({ codeInfo: "Lot ABC123", dispenseLot: "ABC123" });
    expect(result.classifierVersion).toBe("lot-classifier-v1");
    expect(result.conclusion).toContain("lot identifier matches recall notice");
  });
});
