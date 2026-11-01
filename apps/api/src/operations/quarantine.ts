import { randomUUID } from "node:crypto";
import {
  isCleanLot,
  normalizeProductNdc,
  quarantineRules,
  type QuarantineResponse,
  type QuarantineRow,
  type QuarantineRule,
} from "@clarilot/core";
import { z } from "zod";
import { toIsoTimestamp } from "../alerts/rows";
import type { AppDeps } from "../deps";
import { sanitize } from "../http/errors";
import { recordOutcome } from "../ledger";
import type { ValidationRow } from "../stores/pharmacy";

const ruleInfo: Record<QuarantineRule, { description: string; action: string }> = {
  ndc_parseable: {
    description: "product_ndc_raw is a hyphenated 4-4, 5-3 or 5-4 product or package NDC",
    action: "Exception queue and manual review; never treated as safe",
  },
  dispensed_at_plausible: {
    description: "dispensed_at is present and not later than now (UTC)",
    action: "Exception queue; excluded from time-based alerts until corrected",
  },
  lot_present: {
    description: "lot_no is recorded on the dispensing row",
    action: "Stays an alert candidate as PRODUCT_MATCH_LOT_UNKNOWN; never removed",
  },
  lot_clean: {
    description: "lot_no is one clean lot identifier",
    action: "Manual evidence review; the raw lot text is preserved",
  },
};

export function violations(row: ValidationRow, now: Date): QuarantineRow[] {
  const found: [QuarantineRule, string][] = [];
  const ndc = normalizeProductNdc(row.productNdcRaw);
  if (!ndc.ok || ndc.productKey !== row.productNdcKey) {
    found.push([
      "ndc_parseable",
      ndc.ok
        ? `Stored key ${row.productNdcKey ?? "null"} disagrees with ${ndc.productKey}`
        : `NDC "${row.productNdcRaw}" is ${ndc.reason}`,
    ]);
  }
  if (new Date(row.dispensedAt).getTime() > now.getTime()) {
    found.push([
      "dispensed_at_plausible",
      `Dispensed at ${row.dispensedAt}, which is in the future`,
    ]);
  }
  const lot = row.lotNo?.trim() ?? "";
  if (lot === "") {
    found.push(["lot_present", "No lot recorded; any recall match stays review-needed"]);
  } else if (!isCleanLot(lot)) {
    found.push(["lot_clean", `Lot text "${row.lotNo ?? ""}" is not one clean lot identifier`]);
  }
  return found.map(([rule, reason]) => ({
    rule,
    dispenseId: row.dispenseId,
    productNdcRaw: row.productNdcRaw,
    lotNo: row.lotNo,
    dispensedAt: row.dispensedAt,
    reason,
    synthetic: true,
  }));
}

const zetarisRowSchema = z.object({
  dispense_id: z.coerce.number().int().positive(),
  product_ndc_raw: z.union([z.string(), z.number()]).transform(String),
  product_ndc_key: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  lot_no: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  dispensed_at: z.string(),
});

async function throughZetaris(deps: AppDeps): Promise<ValidationRow[] | string> {
  const query = deps.registry.get("validation");
  const queryId = randomUUID();
  const outcome = await deps.zetaris.run(query, queryId);
  await recordOutcome(deps, query, queryId, outcome, null);
  if (!outcome.ok) {
    return outcome.reason;
  }
  const rows = z.array(zetarisRowSchema).safeParse(outcome.rows);
  if (!rows.success) {
    return "Zetaris returned validation rows in an unexpected shape";
  }
  return rows.data.map((r) => ({
    dispenseId: r.dispense_id,
    productNdcRaw: r.product_ndc_raw,
    productNdcKey: r.product_ndc_key,
    lotNo: r.lot_no,
    dispensedAt: toIsoTimestamp(r.dispensed_at) ?? r.dispensed_at,
  }));
}

export async function quarantine(
  deps: AppDeps,
  rule: QuarantineRule | undefined,
): Promise<QuarantineResponse> {
  const now = deps.now();
  const checkedAt = now.toISOString();
  const engine = deps.zetaris.configured ? "ZETARIS" : "APP_DIRECT_POSTGRES";
  let rows: ValidationRow[] | string;
  try {
    rows = engine === "ZETARIS" ? await throughZetaris(deps) : await deps.pharmacy.validationRows();
  } catch (error) {
    rows = `Pharmacy Postgres did not answer: ${sanitize(error instanceof Error ? error.message : "unknown error")}`;
  }
  if (typeof rows === "string") {
    return { status: "SOURCE_UNAVAILABLE", checkedAt, reason: rows };
  }
  const all = rows.flatMap((row) => violations(row, now));
  const shown = rule === undefined ? all : all.filter((r) => r.rule === rule);
  return {
    status: shown.length > 0 ? "RESULTS" : "EMPTY_VERIFIED",
    checkedAt,
    engine,
    engineNote:
      engine === "ZETARIS"
        ? "Validation query executed through Zetaris on pharmacy_pg.dispensing; rule reasons computed by the API"
        : "Rules evaluated by the API over a direct read of the synthetic pharmacy Postgres; this is not Zetaris data quality",
    rules: quarantineRules.map((r) => ({
      rule: r,
      ...ruleInfo[r],
      failing: all.filter((x) => x.rule === r).length,
    })),
    rows: shown,
  };
}
