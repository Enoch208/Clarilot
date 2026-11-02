import type { FeedHealth, LedgerEntry, RecallsUsed } from "@clarilot/core";
import { createApp } from "../../src/app";
import type { AppDeps } from "../../src/deps";
import { fromRepo, loadRecallsUsed, type DemoCaseFile } from "../../src/files";
import type { Feed, FeedProbe } from "../../src/health/openfda";
import { createRegistry, loadRegistry, type SqlRegistry } from "../../src/sql/registry";
import type { DraftRecord, DraftStore } from "../../src/stores/drafts";
import type { LedgerStore, LedgerWrite } from "../../src/stores/ledger";
import type { PharmacyStore } from "../../src/stores/pharmacy";
import { unconfiguredZetaris, type ZetarisClient } from "../../src/zetaris/client";

export const fixedNow = new Date("2026-11-01T03:00:00.000Z");

export function memoryLedger(): LedgerStore & { writes: LedgerWrite[] } {
  const writes: LedgerWrite[] = [];
  return {
    writes,
    record: (entry) => {
      writes.push(entry);
      return Promise.resolve();
    },
    get: (queryId) => {
      const e = writes.find((w) => w.queryId === queryId);
      const entry: LedgerEntry | null =
        e === undefined ? null : { ...e, createdAt: fixedNow.toISOString() };
      return Promise.resolve(entry);
    },
  };
}

export function memoryDrafts(): DraftStore & { rows: DraftRecord[] } {
  const rows: DraftRecord[] = [];
  return {
    rows,
    get: (id) => Promise.resolve(rows.find((r) => r.draftId === id) ?? null),
    findActive: (dispenseId, recallNumber) =>
      Promise.resolve(
        rows.find(
          (r) =>
            r.dispenseId === dispenseId &&
            r.recallNumber === recallNumber &&
            r.state !== "INVALIDATED_DRAFT",
        ) ?? null,
      ),
    listForDispense: (dispenseId) =>
      Promise.resolve(rows.filter((r) => r.dispenseId === dispenseId)),
    insert: (draft) => {
      const record: DraftRecord = { ...draft, decision: null, idempotencyKey: null };
      rows.push(record);
      return Promise.resolve(record);
    },
    invalidate: (id) => {
      const row = rows.find((r) => r.draftId === id);
      if (row !== undefined) {
        row.state = "INVALIDATED_DRAFT";
      }
      return Promise.resolve();
    },
    applyDecision: (id, write) => {
      const row = rows.find((r) => r.draftId === id && r.state === "DRAFT_PENDING_REVIEW");
      if (row === undefined) {
        return Promise.resolve(null);
      }
      Object.assign(row, {
        state: write.state,
        decision: write.decision,
        reviewerLabel: write.reviewerLabel,
        idempotencyKey: write.idempotencyKey,
        decidedAt: fixedNow.toISOString(),
      });
      return Promise.resolve(row);
    },
  };
}

export function memoryPharmacy(overrides: Partial<PharmacyStore> = {}): PharmacyStore {
  const present = new Set<number>();
  return {
    countDispensing: () => Promise.resolve(1453),
    validationRows: () => Promise.resolve([]),
    presentDispenseIds: (ids) => Promise.resolve(ids.filter((id) => present.has(id))),
    insertDemoDispense: (demo) => {
      const inserted = !present.has(demo.dispenseId);
      present.add(demo.dispenseId);
      return Promise.resolve({ inserted, insertedAt: inserted ? fixedNow.toISOString() : null });
    },
    removeDispenses: (ids) => {
      const removed = ids.filter((id) => present.delete(id));
      return Promise.resolve({ removedDispenseIds: removed, removedDrafts: 0 });
    },
    ...overrides,
  };
}

export function feedProbe(status: "OK" | "UNAVAILABLE" = "OK"): FeedProbe {
  return {
    probe: (feed: Feed): Promise<FeedHealth> =>
      Promise.resolve({
        status,
        checkedAt: fixedNow.toISOString(),
        latencyMs: 5,
        detail: `test probe for ${feed}`,
        endpoint: `https://api.fda.gov/drug/${feed === "recalls" ? "enforcement" : "shortages"}.json`,
        sourcePublishedAt: status === "OK" ? "2026-10-21" : null,
        fetchedAt: status === "OK" ? fixedNow.toISOString() : null,
        totalRecords: status === "OK" ? 191 : null,
      }),
  };
}

export const demoCase: DemoCaseFile = {
  demoCaseId: "insert-exact-lot",
  label: "test demo case",
  dispenseId: 900_001,
  recallNumber: "D-0038-2027",
  productNdcRaw: "0093-2204",
  lotNo: "8633085",
  storeId: 2,
  qty: 30,
  rxId: 487,
  patientId: 91,
};

let shared: { registry: SqlRegistry; recallsUsed: RecallsUsed } | null = null;

async function loadShared() {
  shared ??= {
    registry: await loadRegistry(fromRepo("sql/named")),
    recallsUsed: await loadRecallsUsed("seed/recalls_used.json"),
  };
  return shared;
}

export async function registryMarked(verified: boolean): Promise<SqlRegistry> {
  const { registry } = await loadShared();
  return createRegistry(
    verified,
    registry.names().map((name) => registry.get(name)),
  );
}

export async function testDeps(overrides: Partial<AppDeps> = {}) {
  const loaded = await loadShared();
  const unverified = await registryMarked(false);
  const ledger = memoryLedger();
  const drafts = memoryDrafts();
  const deps: AppDeps = {
    zetaris: unconfiguredZetaris(),
    registry: unverified,
    ledger,
    pharmacy: memoryPharmacy(),
    drafts,
    feeds: feedProbe(),
    receiving: () =>
      Promise.resolve({
        rowCount: 39,
        sha256: "a".repeat(64),
        fileModifiedAt: fixedNow.toISOString(),
      }),
    recallsUsed: loaded.recallsUsed,
    demoCases: [demoCase],
    demo: { enabled: true, token: "test-demo-token-0123456789" },
    now: () => fixedNow,
    ...overrides,
  };
  return { deps, ledger, drafts, app: createApp(deps) };
}

export function stubZetaris(run: ZetarisClient["run"]): ZetarisClient {
  return { configured: true, transport: "UI_PROXY", principal: "test-reader", run };
}

export async function call(
  app: ReturnType<typeof createApp>,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const response = await app.request(path, {
    method,
    headers: { "content-type": "application/json", ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}
