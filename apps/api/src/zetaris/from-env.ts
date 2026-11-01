import type { ApiEnv } from "../env";
import { httpZetaris, unconfiguredZetaris, type ZetarisClient } from "./client";

export function zetarisFromEnv(env: ApiEnv): ZetarisClient {
  if (
    env.ZETARIS_BASE_URL === undefined ||
    env.ZETARIS_API_KEY === undefined ||
    env.ZETARIS_ORG_ID === undefined
  ) {
    return unconfiguredZetaris();
  }
  return httpZetaris({
    baseUrl: env.ZETARIS_BASE_URL,
    apiKey: env.ZETARIS_API_KEY,
    orgId: env.ZETARIS_ORG_ID,
    transport: env.ZETARIS_TRANSPORT,
    principal: env.ZETARIS_PRINCIPAL ?? null,
    timeoutMs: env.ZETARIS_QUERY_TIMEOUT_MS,
    rowLimit: 5_000,
    fetch,
  });
}
