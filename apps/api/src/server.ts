import { serve } from "@hono/node-server";
import { buildApi } from "./build";
import { EnvError, loadApiEnv, type ApiEnv } from "./env";

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
const { app, close } = await buildApi(env);

const server = serve({ fetch: app.fetch, port: env.API_PORT, hostname: "127.0.0.1" }, (info) => {
  process.stdout.write(`Clarilot API listening on http://127.0.0.1:${String(info.port)}\n`);
});

function shutDown(signal: string) {
  process.stdout.write(`Clarilot API stopping on ${signal}\n`);
  server.close();
  void close().then(() => process.exit(0));
}

process.once("SIGINT", shutDown);
process.once("SIGTERM", shutDown);
