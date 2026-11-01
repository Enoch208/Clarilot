import { ledgerEntrySchema, type LedgerEntry } from "@clarilot/core";
import type { DraftStore } from "./drafts";
import type { LedgerStore } from "./ledger";
import type { PharmacyStore } from "./pharmacy";

export const noDatabaseReason = "no pharmacy database is configured on this deployment";

function refuse(): Promise<never> {
  return Promise.reject(new Error(noDatabaseReason));
}

export function unconfiguredPharmacy(): PharmacyStore {
  return {
    countDispensing: refuse,
    validationRows: refuse,
    presentDispenseIds: refuse,
    insertDemoDispense: refuse,
    removeDispenses: refuse,
  };
}

export function unconfiguredDrafts(): DraftStore {
  return {
    get: refuse,
    findActive: refuse,
    listForDispense: refuse,
    insert: refuse,
    invalidate: refuse,
    applyDecision: refuse,
  };
}

export function memoryLedger(limit: number, now: () => Date): LedgerStore {
  const entries = new Map<string, LedgerEntry>();
  return {
    record(entry) {
      entries.set(
        entry.queryId,
        ledgerEntrySchema.parse({ ...entry, createdAt: now().toISOString() }),
      );
      for (const key of entries.keys()) {
        if (entries.size <= limit) break;
        entries.delete(key);
      }
      return Promise.resolve();
    },
    get(queryId) {
      return Promise.resolve(entries.get(queryId) ?? null);
    },
  };
}
