import { lotEvidenceConclusions, type LotEvidenceLevel } from "./contract/states";
import { isCleanLot, normalizeLotToken, parseLotTokens } from "./lot-tokens";
import { normalizeProductNdc } from "./ndc";

export const lotClassifierVersion = "lot-classifier-v1";

export type AllLotsRule = {
  recallNumber: string;
  phrase: string;
  reviewedBy: string;
};

export type LotClassifierInput = {
  recallNumber: string;
  codeInfo: string | null;
  recallNdcRaw: string;
  dispenseNdcRaw: string;
  dispenseLot: string | null;
  allLotsRules?: readonly AllLotsRule[];
};

export type LotClassification = {
  level: LotEvidenceLevel;
  reason: string;
  conclusion: string;
  matchedToken: string | null;
  parsedLotTokens: string[];
  classifierVersion: string;
};

function result(
  level: LotEvidenceLevel,
  reason: string,
  parsedLotTokens: string[] = [],
  matchedToken: string | null = null,
): LotClassification {
  return {
    level,
    reason,
    conclusion: lotEvidenceConclusions[level],
    matchedToken,
    parsedLotTokens,
    classifierVersion: lotClassifierVersion,
  };
}

function verifiedAllLots(input: LotClassifierInput, codeInfo: string): AllLotsRule | undefined {
  const text = codeInfo.toLowerCase();
  return (input.allLotsRules ?? []).find(
    (rule) =>
      rule.recallNumber === input.recallNumber &&
      rule.phrase.trim() !== "" &&
      text.includes(rule.phrase.trim().toLowerCase()),
  );
}

export function classifyLotEvidence(input: LotClassifierInput): LotClassification {
  const dispenseNdc = normalizeProductNdc(input.dispenseNdcRaw);
  if (!dispenseNdc.ok) {
    return result(
      "IDENTIFIER_UNVERIFIED",
      `Dispensing NDC "${input.dispenseNdcRaw}" is ${dispenseNdc.reason}; it needs correction before any match is asserted`,
    );
  }
  const recallNdc = normalizeProductNdc(input.recallNdcRaw);
  if (!recallNdc.ok) {
    return result(
      "IDENTIFIER_UNVERIFIED",
      `Recall NDC "${input.recallNdcRaw}" is ${recallNdc.reason}; the product match cannot be verified`,
    );
  }
  if (recallNdc.productKey !== dispenseNdc.productKey) {
    return result(
      "IDENTIFIER_UNVERIFIED",
      `Product keys differ (${recallNdc.productKey} vs ${dispenseNdc.productKey}); the row is not a product match`,
    );
  }
  const codeInfo = (input.codeInfo ?? "").trim();
  const parsed = codeInfo === "" ? null : parseLotTokens(codeInfo);
  const tokens = parsed?.tokens ?? [];
  const lot = input.dispenseLot === null ? "" : normalizeLotToken(input.dispenseLot);

  if (lot !== "" && isCleanLot(lot) && tokens.includes(lot)) {
    return result(
      "LOT_EXACT",
      `Lot ${lot} appears as a whole lot token in the recall's code_info`,
      tokens,
      lot,
    );
  }
  const allLots = codeInfo === "" ? undefined : verifiedAllLots(input, codeInfo);
  if (allLots !== undefined) {
    return result(
      "ALL_LOTS_EXPLICIT",
      `code_info states "${allLots.phrase}", reviewed by ${allLots.reviewedBy} as an explicit all-lots scope`,
      tokens,
    );
  }
  if (lot === "") {
    return result(
      "PRODUCT_MATCH_LOT_UNKNOWN",
      "Product matched; no lot is recorded on the dispensing row",
      tokens,
    );
  }
  if (codeInfo === "") {
    return result(
      "PRODUCT_MATCH_LOT_UNKNOWN",
      "Product matched; the recall notice has no code_info to compare lots against",
    );
  }
  if (!isCleanLot(lot)) {
    return result(
      "PRODUCT_MATCH_LOT_UNKNOWN",
      `Product matched; dispensing lot "${input.dispenseLot ?? ""}" is not a clean lot identifier`,
      tokens,
    );
  }
  if (parsed === null || tokens.length === 0 || parsed.complex) {
    return result(
      "PRODUCT_MATCH_LOT_UNKNOWN",
      "Product matched; the lot text in code_info could not be parsed decisively",
      tokens,
    );
  }
  return result(
    "LOT_DIFFERENT_UNVERIFIED",
    `Product matched; lot ${lot} is not among the parsed lot tokens (${tokens.join(", ")}); this does not prove the recall is inapplicable`,
    tokens,
  );
}
