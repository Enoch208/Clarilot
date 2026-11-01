import { z } from "zod";

const text = z.union([z.string(), z.number(), z.boolean()]).transform(String);

const optionalText = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) =>
    value === null || value === undefined || value === "" ? null : String(value),
  );

const integer = z.coerce.number().int();

export const alertRowSchema = z.object({
  dispense_id: integer.positive(),
  rx_id: integer.positive(),
  patient_id: integer.positive(),
  patient_name: text,
  store_id: integer.positive(),
  store_name: text,
  store_city: text,
  product_ndc_raw: text,
  product_ndc_key: optionalText,
  lot_no: optionalText,
  qty: integer.positive(),
  dispensed_at: text,
  drug_label: optionalText,
  recall_number: text,
  classification: text,
  recall_status: text,
  report_date: text,
  recall_initiation_date: optionalText,
  recalling_firm: text,
  product_description: text,
  reason_for_recall: text,
  code_info: optionalText,
  recall_ndc_raw: text,
  recalls_last_updated: optionalText,
  receipt_id: optionalText,
  receipt_lot_no: optionalText,
  supplier: optionalText,
  received_at: optionalText,
  shortage_status: optionalText,
  shortage_availability: optionalText,
  shortage_update_date: optionalText,
  shortage_generic_name: optionalText,
  shortages_last_updated: optionalText,
});
export type AlertRow = z.infer<typeof alertRowSchema>;

export function toIsoTimestamp(value: string): string | null {
  const zoned = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
  const normalized = value.trim().replace(" ", "T");
  const date = new Date(zoned ? normalized : `${normalized}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
