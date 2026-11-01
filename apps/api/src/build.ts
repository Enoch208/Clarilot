import { createApp } from "./app";
import { createDb } from "./db";
import type { ApiEnv } from "./env";
import { fromRepo, loadDemoCases, loadRecallsUsed, receivingStats, repoRoot } from "./files";
import { openFdaProbe } from "./health/openfda";
import { loadRegistry } from "./sql/registry";
import { postgresDrafts } from "./stores/drafts";
import { postgresLedger } from "./stores/ledger";
import { postgresPharmacy } from "./stores/pharmacy";
import { memoryLedger, unconfiguredDrafts, unconfiguredPharmacy } from "./stores/unconfigured";
import { zetarisFromEnv } from "./zetaris/from-env";

const memoryLedgerLimit = 500;

function stores(env: ApiEnv, now: () => Date) {
  if (env.DATABASE_URL === undefined) {
    return {
      ledger: memoryLedger(memoryLedgerLimit, now),
      pharmacy: unconfiguredPharmacy(),
      drafts: unconfiguredDrafts(),
      close: () => Promise.resolve(),
    };
  }
  const db = createDb(env.DATABASE_URL);
  return {
    ledger: postgresLedger(db),
    pharmacy: postgresPharmacy(db),
    drafts: postgresDrafts(db),
    close: () => db.end({ timeout: 5 }),
  };
}

export async function buildApi(env: ApiEnv, root = repoRoot) {
  const now = () => new Date();
  const { close, ...data } = stores(env, now);
  const app = createApp({
    zetaris: zetarisFromEnv(env),
    registry: await loadRegistry(fromRepo(env.SQL_NAMED_DIR, root)),
    ...data,
    feeds: openFdaProbe({
      baseUrl: env.OPENFDA_BASE_URL,
      userAgent: env.OPENFDA_USER_AGENT,
      apiKey: env.OPENFDA_API_KEY,
      fetch,
      now,
      cacheMs: 10 * 60_000,
    }),
    receiving: () => receivingStats(env.RECEIVING_CSV_PATH, root),
    recallsUsed: await loadRecallsUsed(env.RECALLS_USED_PATH, root),
    demoCases: await loadDemoCases(root),
    demo: { enabled: env.DEMO_MODE, token: env.DEMO_TOKEN ?? null },
    now,
  });
  return { app, close };
}
