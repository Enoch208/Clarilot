import {
  normalizeProductNdc,
  parseLotTokens,
  recallNdcCoverage,
  type EnforcementRecord,
  type ShortageRecord,
} from "@clarilot/core";

export type Candidate = {
  record: EnforcementRecord;
  productKeys: { raw: string; productKey: string }[];
  tokens: string[];
};

export type ShortageListing = { productKey: string; record: ShortageRecord };

export const constraints = [
  "status is Ongoing and recall_number is present",
  "openfda.product_ndc is present and every value parses as a hyphenated 4-4, 5-3 or 5-4 product NDC",
  "code_info names lots in an anchored Lot/Batch context and parses without unreadable text",
  "ordered by report_date descending, then recall_number ascending",
  "rule recent_oral_multi_lot: route ORAL with at least two listed lots",
  "rule oral_other_ndc_shape: route ORAL, a different NDC segment shape and no shared product key",
  "rule class_i_with_shortage_listing: Class I with a product key listed Current in the FDA shortage feed via package_ndc",
];

export function rejectionReason(record: EnforcementRecord): string | null {
  if (record.recall_number.trim() === "") {
    return "no_recall_number";
  }
  if (record.status !== "Ongoing") {
    return "not_ongoing";
  }
  const coverage = recallNdcCoverage(record.openfda?.product_ndc);
  if (coverage.productKeys.length === 0) {
    return "no_product_ndc";
  }
  if (coverage.coverageGap) {
    return "product_ndc_parse_gap";
  }
  const codeInfo = (record.code_info ?? "").trim();
  if (codeInfo === "") {
    return "no_code_info";
  }
  const parsed = parseLotTokens(codeInfo);
  if (!parsed.anchored || parsed.tokens.length === 0) {
    return "no_anchored_lot";
  }
  return parsed.complex ? "lot_text_too_complex" : null;
}

export function toCandidate(record: EnforcementRecord): Candidate {
  return {
    record,
    productKeys: recallNdcCoverage(record.openfda?.product_ndc).productKeys,
    tokens: parseLotTokens(record.code_info ?? "").tokens,
  };
}

export function shortageListings(records: readonly ShortageRecord[]): ShortageListing[] {
  return records.flatMap((record) => {
    const parsed = normalizeProductNdc(record.package_ndc ?? "");
    return parsed.ok ? [{ productKey: parsed.productKey, record }] : [];
  });
}

const shape = (raw: string) =>
  raw
    .split("-")
    .map((segment) => segment.length)
    .join("-");

const isOral = (candidate: Candidate) => candidate.record.openfda?.route?.includes("ORAL") === true;

const byRecency = (a: Candidate, b: Candidate) =>
  b.record.report_date.localeCompare(a.record.report_date) ||
  a.record.recall_number.localeCompare(b.record.recall_number);

export type Selection = { rule: string; candidate: Candidate };

export function selectRecalls(
  candidates: readonly Candidate[],
  listings: readonly ShortageListing[],
): Selection[] {
  const ordered = [...candidates].sort(byRecency);
  const selections: Selection[] = [];
  const first = ordered.find((c) => isOral(c) && c.tokens.length >= 2);
  if (first !== undefined) {
    selections.push({ rule: "recent_oral_multi_lot", candidate: first });
    const firstKeys = new Set(first.productKeys.map((k) => k.productKey));
    const firstShape = shape(first.productKeys[0]?.raw ?? "");
    const second = ordered.find(
      (c) =>
        c !== first &&
        isOral(c) &&
        shape(c.productKeys[0]?.raw ?? "") !== firstShape &&
        c.productKeys.every((k) => !firstKeys.has(k.productKey)),
    );
    if (second !== undefined) {
      selections.push({ rule: "oral_other_ndc_shape", candidate: second });
    }
  }
  const current = new Set(
    listings.filter((l) => l.record.status === "Current").map((l) => l.productKey),
  );
  const third = ordered.find(
    (c) =>
      c.record.classification === "Class I" &&
      !selections.some((s) => s.candidate === c) &&
      c.productKeys.some((k) => current.has(k.productKey)),
  );
  if (third !== undefined) {
    selections.push({ rule: "class_i_with_shortage_listing", candidate: third });
  }
  return selections;
}
