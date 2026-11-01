import type { IncomingMessage, ServerResponse } from "node:http";
import { getRequestListener } from "@hono/node-server";
import { buildApi } from "./build";
import { loadApiEnv } from "./env";

const listener = buildApi(loadApiEnv(process.env), import.meta.dirname).then(({ app }) =>
  getRequestListener(app.fetch),
);

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const listen = await listener;
  await listen(request, response);
}
