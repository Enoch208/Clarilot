import type { RecallsUsed } from "@clarilot/core";
import type { DemoCaseFile, ReceivingStats } from "./files";
import type { FeedProbe } from "./health/openfda";
import type { SqlRegistry } from "./sql/registry";
import type { DraftStore } from "./stores/drafts";
import type { LedgerStore } from "./stores/ledger";
import type { PharmacyStore } from "./stores/pharmacy";
import type { ZetarisClient } from "./zetaris/client";

export type DemoSettings = {
  enabled: boolean;
  token: string | null;
};

export type AppDeps = {
  zetaris: ZetarisClient;
  registry: SqlRegistry;
  ledger: LedgerStore;
  pharmacy: PharmacyStore;
  drafts: DraftStore;
  feeds: FeedProbe;
  receiving: () => Promise<ReceivingStats>;
  recallsUsed: RecallsUsed;
  demoCases: DemoCaseFile[];
  demo: DemoSettings;
  now: () => Date;
};
