import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { createDb } from "./db";
import { EnvError, loadApiEnv, type ApiEnv } from "./env";
import { fromRepo, loadDemoCases, loadRecallsUsed, receivingStats } from "./files";
import { openFdaProbe } from "./health/openfda";
import { loadRegistry } from "./sql/registry";
import { postgresDrafts } from "./stores/drafts";
import { postgresLedger } from "./stores/ledger";
import { postgresPharmacy } from "./stores/pharmacy";
import { zetarisFromEnv } from "./zetaris/from-env";

function environment(): ApiEnv {
  try {
    return loadApiEnv(process.env);
  } catch (error) {
    if (error instanceof EnvError) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}

const env = environment();
const db = createDb(env.DATABASE_URL);
const now = () => new Date();

const app = createApp({
  zetaris: zetarisFromEnv(env),
  registry: await loadRegistry(fromRepo(env.SQL_NAMED_DIR)),
  ledger: postgresLedger(db),
  pharmacy: postgresPharmacy(db),
  drafts: postgresDrafts(db),
  feeds: openFdaProbe({
    baseUrl: env.OPENFDA_BASE_URL,
    userAgent: env.OPENFDA_USER_AGENT,
    apiKey: env.OPENFDA_API_KEY,
    fetch,
    now,
    cacheMs: 10 * 60_000,
  }),
  receiving: () => receivingStats(env.RECEIVING_CSV_PATH),
  recallsUsed: await loadRecallsUsed(env.RECALLS_USED_PATH),
  demoCases: await loadDemoCases(),
  demo: { enabled: env.DEMO_MODE, token: env.DEMO_TOKEN ?? null },
  now,
});

const server = serve({ fetch: app.fetch, port: env.API_PORT, hostname: "127.0.0.1" }, (info) => {
  process.stdout.write(`Clarilot API listening on http://127.0.0.1:${String(info.port)}\n`);
});

function shutDown(signal: string) {
  process.stdout.write(`Clarilot API stopping on ${signal}\n`);
  server.close();
  void db.end({ timeout: 5 }).then(() => process.exit(0));
}

process.once("SIGINT", shutDown);
process.once("SIGTERM", shutDown);
