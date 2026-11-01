import { describe, expect, it } from "vitest";
import { ndcParseStatus, normalizeProductNdc, recallNdcCoverage } from "../src";

describe("normalizeProductNdc", () => {
  it.each([
    ["1234-5678", "01234-5678"],
    ["12345-678", "12345-0678"],
    ["12345-6789", "12345-6789"],
    ["0093-2203", "00093-2203"],
    ["60687-620", "60687-0620"],
  ])("U-01 maps the product NDC %s to %s and keeps the raw value", (raw, productKey) => {
    expect(normalizeProductNdc(raw)).toEqual({ ok: true, raw, kind: "product", productKey });
  });

  it("U-01 keeps surrounding whitespace in raw while normalizing the key", () => {
    const parsed = normalizeProductNdc(" 12345-678 ");
    expect(parsed).toMatchObject({ ok: true, raw: " 12345-678 ", productKey: "12345-0678" });
  });

  it.each([
    ["12345-6789-01", "12345-6789"],
    ["1234-5678-90", "01234-5678"],
    ["12345-678-9", "12345-0678"],
  ])("U-02 projects the package NDC %s to product %s and preserves the package", (raw, key) => {
    expect(normalizeProductNdc(raw)).toEqual({
      ok: true,
      raw,
      kind: "package",
      productKey: key,
      packageRaw: raw,
    });
  });

  it.each([
    ["", "BLANK"],
    ["   ", "BLANK"],
    ["1234567890", "AMBIGUOUS"],
    ["12345678901", "AMBIGUOUS"],
    ["123-4567", "AMBIGUOUS"],
    ["123456-78", "AMBIGUOUS"],
    ["12345-6789-012", "AMBIGUOUS"],
    ["1234-567", "AMBIGUOUS"],
    ["ABCDE-1234", "BAD_SHAPE"],
    ["12345 6789", "BAD_SHAPE"],
    ["12345--6789", "BAD_SHAPE"],
    ["12345-", "BAD_SHAPE"],
    ["1-2-3-4", "BAD_SHAPE"],
    ["12345678", "BAD_SHAPE"],
  ])("U-03 rejects %j with reason %s", (raw, reason) => {
    expect(normalizeProductNdc(raw)).toEqual({ ok: false, raw, reason });
  });

  it("reports a parse status the wire contract understands", () => {
    expect(ndcParseStatus(normalizeProductNdc("12345-678"))).toBe("OK_PRODUCT");
    expect(ndcParseStatus(normalizeProductNdc("12345-678-01"))).toBe("OK_PACKAGE");
    expect(ndcParseStatus(normalizeProductNdc("1234567890"))).toBe("AMBIGUOUS");
  });
});

describe("recallNdcCoverage", () => {
  it("U-07 records a coverage gap when the FDA record has no product NDC", () => {
    expect(recallNdcCoverage(undefined)).toEqual({
      productKeys: [],
      rejected: [],
      coverageGap: true,
    });
    expect(recallNdcCoverage([]).coverageGap).toBe(true);
  });

  it("U-07 keeps the valid keys and records corrupt NDCs as a gap rather than dropping them", () => {
    const coverage = recallNdcCoverage(["0093-2203", "93-2204", ""]);
    expect(coverage.productKeys).toEqual([{ raw: "0093-2203", productKey: "00093-2203" }]);
    expect(coverage.rejected).toEqual([
      { raw: "93-2204", reason: "AMBIGUOUS" },
      { raw: "", reason: "BLANK" },
    ]);
    expect(coverage.coverageGap).toBe(true);
  });

  it("has no gap when every NDC parses", () => {
    expect(recallNdcCoverage(["60687-620", "60687-631"]).coverageGap).toBe(false);
  });
});
