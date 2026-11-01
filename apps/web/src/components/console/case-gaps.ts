import type { Alert } from "@clarilot/core";

export function caseGaps(alert: Alert): string[] {
  const gaps: string[] = [];
  if (alert.dispense.lotNo === null || alert.dispense.lotNo.trim() === "") {
    gaps.push("The dispensing record has no lot number.");
  }
  if (alert.lot.parsedLotTokens.length === 0) {
    gaps.push("No lot tokens could be read reliably from the recall’s code_info.");
  }
  if (
    alert.dispense.ndcParseStatus !== "OK_PRODUCT" &&
    alert.dispense.ndcParseStatus !== "OK_PACKAGE"
  ) {
    gaps.push(`The dispensed NDC could not be parsed (${alert.dispense.ndcParseStatus}).`);
  }
  if (alert.receiving.status === "NO_MATCHING_RECEIPT") {
    gaps.push("No matching receipt in the receiving ledger. This does not clear the dispense.");
  }
  if (alert.shortage.evidence === "NOT_VERIFIED_IN_SUBSET") {
    gaps.push("Shortage status is not verified in the bounded FDA shortage subset.");
  }
  return gaps;
}
