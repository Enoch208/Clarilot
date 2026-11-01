import type { Alert, LotEvidenceLevel } from "@clarilot/core";
import { classRank, lotSeverity } from "@/lib/evidence";

export type QueueFilters = {
  recallNumber: string;
  storeId: string;
  level: LotEvidenceLevel | "";
};

export const emptyFilters: QueueFilters = { recallNumber: "", storeId: "", level: "" };

export function applyFilters(alerts: readonly Alert[], filters: QueueFilters): Alert[] {
  return alerts
    .filter(
      (alert) => filters.recallNumber === "" || alert.recall.recallNumber === filters.recallNumber,
    )
    .filter((alert) => filters.storeId === "" || String(alert.store.storeId) === filters.storeId)
    .filter((alert) => filters.level === "" || alert.lot.level === filters.level)
    .sort(
      (a, b) =>
        classRank(a.recall.classification) - classRank(b.recall.classification) ||
        lotSeverity[a.lot.level] - lotSeverity[b.lot.level] ||
        (b.recall.reportDate.iso ?? "").localeCompare(a.recall.reportDate.iso ?? "") ||
        b.dispense.dispensedAt.localeCompare(a.dispense.dispensedAt),
    );
}

export function distinct<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
