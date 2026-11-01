import type { NdcParseStatus } from "./contract/states";

export type NdcParse =
  | { ok: true; raw: string; kind: "product" | "package"; productKey: string; packageRaw?: string }
  | { ok: false; raw: string; reason: "BLANK" | "AMBIGUOUS" | "BAD_SHAPE" };

const digits = /^\d+$/;

function segmentsAllowed(labeler: string, product: string): boolean {
  return (
    (labeler.length === 4 && product.length === 4) ||
    (labeler.length === 5 && (product.length === 3 || product.length === 4))
  );
}

export function normalizeProductNdc(raw: string): NdcParse {
  const value = raw.trim();
  if (value === "") {
    return { ok: false, raw, reason: "BLANK" };
  }
  if (/^\d{10,11}$/.test(value)) {
    return { ok: false, raw, reason: "AMBIGUOUS" };
  }
  const segments = value.split("-");
  if ((segments.length !== 2 && segments.length !== 3) || !segments.every((s) => digits.test(s))) {
    return { ok: false, raw, reason: "BAD_SHAPE" };
  }
  const [labeler = "", product = "", packageCode] = segments;
  if (!segmentsAllowed(labeler, product)) {
    return { ok: false, raw, reason: "AMBIGUOUS" };
  }
  if (packageCode !== undefined && !/^\d{1,2}$/.test(packageCode)) {
    return { ok: false, raw, reason: "AMBIGUOUS" };
  }
  const productKey = `${labeler.padStart(5, "0")}-${product.padStart(4, "0")}`;
  if (packageCode === undefined) {
    return { ok: true, raw, kind: "product", productKey };
  }
  return { ok: true, raw, kind: "package", productKey, packageRaw: value };
}

export function ndcParseStatus(parse: NdcParse): NdcParseStatus {
  if (parse.ok) {
    return parse.kind === "product" ? "OK_PRODUCT" : "OK_PACKAGE";
  }
  return parse.reason;
}

export type RecallNdcCoverage = {
  productKeys: { raw: string; productKey: string }[];
  rejected: { raw: string; reason: "BLANK" | "AMBIGUOUS" | "BAD_SHAPE" }[];
  coverageGap: boolean;
};

export function recallNdcCoverage(productNdcs: readonly string[] | undefined): RecallNdcCoverage {
  const parsed = (productNdcs ?? []).map(normalizeProductNdc);
  const productKeys = parsed.flatMap((p) =>
    p.ok ? [{ raw: p.raw, productKey: p.productKey }] : [],
  );
  const rejected = parsed.flatMap((p) => (p.ok ? [] : [{ raw: p.raw, reason: p.reason }]));
  return { productKeys, rejected, coverageGap: productKeys.length === 0 || rejected.length > 0 };
}
