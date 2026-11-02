import { randomUUID } from "node:crypto";
import type {
  HealthResponse,
  PharmacyHealth,
  ReceivingHealth,
  ZetarisHealth,
} from "@clarilot/core";
import type { AppDeps } from "../deps";
import { sanitize } from "../http/errors";
import { recordOutcome, withLedgerNote } from "../ledger";
import { coverage } from "./scope";

const message = (error: unknown) =>
  sanitize(error instanceof Error ? error.message : "unknown error");

async function zetarisHealth(deps: AppDeps, checkedAt: string): Promise<ZetarisHealth> {
  const base = { checkedAt, transport: deps.zetaris.transport, version: null };
  if (!deps.zetaris.configured) {
    return {
      ...base,
      status: "NOT_CONFIGURED",
      latencyMs: null,
      detail: "Zetaris connection settings are not present on this API; no federated query can run",
    };
  }
  const query = deps.registry.get("select_one");
  const queryId = randomUUID();
  const outcome = await deps.zetaris.run(query, queryId);
  const note = await recordOutcome(deps, query, queryId, outcome, null);
  if (!outcome.ok) {
    return {
      ...base,
      status: "UNAVAILABLE",
      latencyMs: outcome.latencyMs,
      detail: withLedgerNote(outcome.reason, note),
    };
  }
  const verified = deps.registry.verifiedInZetaris ? "" : "; named queries are not yet verified";
  return {
    ...base,
    status: "OK",
    latencyMs: outcome.latencyMs,
    detail: withLedgerNote(
      `SELECT 1 answered through ${deps.zetaris.transport ?? "Zetaris"}${verified}`,
      note,
    ),
  };
}

async function pharmacyHealth(deps: AppDeps, checkedAt: string): Promise<PharmacyHealth> {
  const started = Date.now();
  try {
    const rows = await deps.pharmacy.countDispensing();
    return {
      status: "OK",
      checkedAt,
      latencyMs: Date.now() - started,
      detail: "Direct Postgres ping from the API (not through Zetaris)",
      dispensingRows: rows,
    };
  } catch (error) {
    return {
      status: "UNAVAILABLE",
      checkedAt,
      latencyMs: Date.now() - started,
      detail: `Pharmacy Postgres did not answer: ${message(error)}`,
      dispensingRows: null,
    };
  }
}

async function receivingHealth(deps: AppDeps, checkedAt: string): Promise<ReceivingHealth> {
  const started = Date.now();
  try {
    const stats = await deps.receiving();
    return {
      status: "OK",
      checkedAt,
      latencyMs: Date.now() - started,
      detail: "Receiving CSV read from the repository file; Zetaris registration not verified",
      ...stats,
    };
  } catch (error) {
    return {
      status: "UNAVAILABLE",
      checkedAt,
      latencyMs: Date.now() - started,
      detail: `Receiving CSV could not be read: ${message(error)}`,
      rowCount: null,
      sha256: null,
      fileModifiedAt: null,
    };
  }
}

export async function checkHealth(deps: AppDeps): Promise<HealthResponse> {
  const checkedAt = deps.now().toISOString();
  const [zetaris, pharmacy, recalls, shortages, receiving] = await Promise.all([
    zetarisHealth(deps, checkedAt),
    pharmacyHealth(deps, checkedAt),
    deps.feeds.probe("recalls"),
    deps.feeds.probe("shortages"),
    receivingHealth(deps, checkedAt),
  ]);
  const verificationReady =
    deps.registry.verifiedInZetaris &&
    [zetaris, pharmacy, recalls, shortages, receiving].every((c) => c.status === "OK");
  return {
    zetaris,
    pharmacy,
    recalls,
    shortages,
    receiving,
    checkedAt,
    coverage: {
      ...coverage,
      publicationLagKnown: recalls.status === "OK" && shortages.status === "OK",
    },
    verificationReady,
  };
}
