import {
  classifyLotEvidence,
  enforcementPermalink,
  ndcParseStatus,
  normalizeProductNdc,
  parseFdaCompactDate,
  parseShortageDate,
  shortageEvidenceConclusions,
  shortageEvidenceFor,
  type Alert,
  type AlertsQuery,
} from "@clarilot/core";
import { coverage } from "../health/scope";
import { alertRowSchema, toIsoTimestamp, type AlertRow } from "./rows";

export type MappedRows = {
  alerts: Alert[];
  rejectedRows: number;
  recallsLastUpdated: string | null;
  shortagesLastUpdated: string | null;
};

function toAlert(row: AlertRow): Alert | null {
  const dispensedAt = toIsoTimestamp(row.dispensed_at);
  const recallNdc = normalizeProductNdc(row.recall_ndc_raw);
  const dispenseNdc = normalizeProductNdc(row.product_ndc_raw);
  if (dispensedAt === null || !recallNdc.ok) {
    return null;
  }
  const lot = classifyLotEvidence({
    recallNumber: row.recall_number,
    codeInfo: row.code_info,
    recallNdcRaw: row.recall_ndc_raw,
    dispenseNdcRaw: row.product_ndc_raw,
    dispenseLot: row.lot_no,
  });
  const evidence = shortageEvidenceFor(row.shortage_status);
  const reportDate = parseFdaCompactDate(row.report_date) ?? { raw: row.report_date, iso: null };
  return {
    caseKey: `${row.recall_number}:${String(row.dispense_id)}`,
    synthetic: true,
    requiresPharmacistReview: true,
    recall: {
      recallNumber: row.recall_number,
      classification: row.classification,
      recallStatus: row.recall_status,
      reportDate,
      recallInitiationDate: parseFdaCompactDate(row.recall_initiation_date),
      recallingFirm: row.recalling_firm,
      productDescription: row.product_description,
      reasonForRecall: row.reason_for_recall,
      codeInfo: row.code_info ?? "",
      productNdcRaw: row.recall_ndc_raw,
      productNdcKey: recallNdc.productKey,
      permalink: enforcementPermalink(row.recall_number),
    },
    dispense: {
      dispenseId: row.dispense_id,
      rxId: row.rx_id,
      drugLabel: row.drug_label ?? row.product_description,
      qty: row.qty,
      dispensedAt,
      productNdcRaw: row.product_ndc_raw,
      productNdcKey: dispenseNdc.ok ? dispenseNdc.productKey : null,
      ndcParseStatus: ndcParseStatus(dispenseNdc),
      lotNo: row.lot_no,
    },
    patient: { patientId: row.patient_id, displayName: row.patient_name, synthetic: true },
    store: { storeId: row.store_id, name: row.store_name, city: row.store_city },
    lot: { ...lot },
    receiving:
      row.receipt_id === null
        ? {
            status: "NO_MATCHING_RECEIPT",
            receiptId: null,
            supplier: null,
            receivedAt: null,
            lotNo: null,
            note: "No receipt for this store, product and lot in the ledger; this does not prove the dispense is safe",
          }
        : {
            status: "RECEIPT_MATCHED",
            receiptId: row.receipt_id,
            supplier: row.supplier,
            receivedAt: row.received_at,
            lotNo: row.receipt_lot_no,
            note: "The receiving ledger shows this lot arriving at this store; it supports inventory provenance only",
          },
    shortage: {
      evidence,
      sourceStatus: row.shortage_status,
      genericName: row.shortage_generic_name,
      availability: row.shortage_availability,
      updateDate: parseShortageDate(row.shortage_update_date),
      matchedProductNdcKey: row.shortage_status === null ? null : recallNdc.productKey,
      scope: coverage.shortageScope,
      note: `${shortageEvidenceConclusions[evidence]}. Informational context only, not a substitution recommendation; consult the prescriber or pharmacist.`,
    },
  };
}

export function mapAlertRows(rows: readonly unknown[]): MappedRows {
  const byKey = new Map<string, Alert>();
  let rejectedRows = 0;
  let recallsLastUpdated: string | null = null;
  let shortagesLastUpdated: string | null = null;
  for (const raw of rows) {
    const parsed = alertRowSchema.safeParse(raw);
    const alert = parsed.success ? toAlert(parsed.data) : null;
    if (!parsed.success || alert === null) {
      rejectedRows += 1;
      continue;
    }
    recallsLastUpdated ??= parsed.data.recalls_last_updated;
    shortagesLastUpdated ??= parsed.data.shortages_last_updated;
    if (!byKey.has(alert.caseKey)) {
      byKey.set(alert.caseKey, alert);
    }
  }
  return { alerts: [...byKey.values()], rejectedRows, recallsLastUpdated, shortagesLastUpdated };
}

export function filterAlerts(alerts: readonly Alert[], query: AlertsQuery): Alert[] {
  return alerts.filter(
    (a) =>
      (query.storeId === undefined || a.store.storeId === query.storeId) &&
      (query.recallNumber === undefined || a.recall.recallNumber === query.recallNumber) &&
      (query.evidenceLevel === undefined || a.lot.level === query.evidenceLevel),
  );
}
