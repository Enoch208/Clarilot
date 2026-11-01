import type { Alert, DraftContent } from "@clarilot/core";

export const lotLabelFor = (alert: Alert) =>
  `${alert.lot.level}: ${alert.dispense.lotNo ?? "no lot recorded"}`;

export const sourceIdsFor = (alert: Alert, queryId: string) => [
  alert.recall.recallNumber,
  `dispense:${String(alert.dispense.dispenseId)}`,
  `query:${queryId}`,
];

export function templateDraft(alert: Alert, queryId: string): DraftContent {
  const recall = alert.recall;
  return {
    recallNumber: recall.recallNumber,
    drugLabel: alert.dispense.drugLabel,
    lotLabel: lotLabelFor(alert),
    draftText: [
      "Hello, this is a message from your pharmacy regarding a published recall notice related to a product in our records",
      `(${alert.dispense.drugLabel}).`,
      "Our team is reviewing the information. Please contact your pharmacist or prescriber for guidance.",
      "Do not make medication changes based on this automated draft.",
      `Reference: ${recall.recallNumber}.`,
    ].join(" "),
    pharmacistNote: [
      `Synthetic case ${alert.caseKey}.`,
      `FDA recall ${recall.recallNumber} (${recall.classification}, report date ${recall.reportDate.raw}).`,
      `Lot evidence ${alert.lot.level}: ${alert.lot.reason}.`,
      `Receiving ledger: ${alert.receiving.status}. Shortage context: ${alert.shortage.evidence}.`,
      "Verify against the FDA notice before any outreach. Template draft; no message is sent.",
    ].join(" "),
    sourceIds: sourceIdsFor(alert, queryId),
  };
}
