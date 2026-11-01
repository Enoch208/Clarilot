import { ndcParseStatus, normalizeProductNdc } from "@clarilot/core";
import type { Db } from "../db";
import type { DemoCaseFile } from "../files";

export type ValidationRow = {
  dispenseId: number;
  productNdcRaw: string;
  productNdcKey: string | null;
  lotNo: string | null;
  dispensedAt: string;
};

export type PharmacyStore = {
  countDispensing(): Promise<number>;
  validationRows(): Promise<ValidationRow[]>;
  presentDispenseIds(ids: readonly number[]): Promise<number[]>;
  insertDemoDispense(demo: DemoCaseFile): Promise<{ inserted: boolean; insertedAt: string | null }>;
  removeDispenses(
    ids: readonly number[],
  ): Promise<{ removedDispenseIds: number[]; removedDrafts: number }>;
};

type ValidationDbRow = {
  dispense_id: number;
  product_ndc_raw: string;
  product_ndc_key: string | null;
  lot_no: string | null;
  dispensed_at: Date;
};

export function postgresPharmacy(db: Db): PharmacyStore {
  return {
    async countDispensing() {
      const rows = await db<{ n: number }[]>`select count(*)::int as n from dispensing`;
      return rows[0]?.n ?? 0;
    },
    async validationRows() {
      const rows = await db<ValidationDbRow[]>`
        select dispense_id, product_ndc_raw, product_ndc_key, lot_no, dispensed_at
        from dispensing
        where synthetic = true
          and (
            product_ndc_key is null
            or ndc_parse_status not in ('OK_PRODUCT', 'OK_PACKAGE')
            or dispensed_at > now()
            or lot_no is null
            or trim(lot_no) = ''
            or upper(lot_no) !~ '^[A-Z0-9][A-Z0-9-]{1,30}[A-Z0-9]$'
          )
        order by dispense_id`;
      return rows.map((row) => ({
        dispenseId: row.dispense_id,
        productNdcRaw: row.product_ndc_raw,
        productNdcKey: row.product_ndc_key,
        lotNo: row.lot_no,
        dispensedAt: row.dispensed_at.toISOString(),
      }));
    },
    async presentDispenseIds(ids) {
      const rows = await db<{ dispense_id: number }[]>`
        select dispense_id from dispensing where dispense_id = any(${[...ids]}::int[])`;
      return rows.map((row) => row.dispense_id);
    },
    async insertDemoDispense(demo) {
      const parsed = normalizeProductNdc(demo.productNdcRaw);
      const rows = await db<{ dispensed_at: Date }[]>`
        insert into dispensing (
          dispense_id, rx_id, patient_id, store_id, product_ndc_raw, product_ndc_key,
          ndc_parse_status, lot_no, qty, dispensed_at, synthetic
        ) values (
          ${demo.dispenseId}, ${demo.rxId}, ${demo.patientId}, ${demo.storeId},
          ${demo.productNdcRaw}, ${parsed.ok ? parsed.productKey : null}, ${ndcParseStatus(parsed)},
          ${demo.lotNo}, ${demo.qty}, now(), true
        )
        on conflict (dispense_id) do nothing
        returning dispensed_at`;
      const row = rows[0];
      return { inserted: row !== undefined, insertedAt: row?.dispensed_at.toISOString() ?? null };
    },
    async removeDispenses(ids) {
      return db.begin(async (tx) => {
        const drafts = await tx`
          delete from app.outreach_actions where dispense_id = any(${[...ids]}::int[])`;
        const removed = await tx<{ dispense_id: number }[]>`
          delete from dispensing where dispense_id = any(${[...ids]}::int[]) returning dispense_id`;
        return {
          removedDispenseIds: removed.map((row) => row.dispense_id).sort((a, b) => a - b),
          removedDrafts: drafts.count,
        };
      });
    },
  };
}
