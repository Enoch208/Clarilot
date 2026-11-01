import type { SelectedRecall } from "@clarilot/core";

export type Scenario = {
  id: string;
  recallNumber: string;
  productNdcRaw: string;
  lotNo: string | null;
  storeId: number;
  dispensedAt: string;
  receipt: boolean;
  expectation: string;
};

export type DemoCase = {
  demoCaseId: string;
  label: string;
  dispenseId: number;
  recallNumber: string;
  productNdcRaw: string;
  lotNo: string;
  storeId: number;
  qty: number;
  scenarioRxOf: string;
};

const at = (day: string) => `${day}T15:30:00Z`;

function lots(recall: SelectedRecall): [string, string, string, string] {
  const tokens = recall.parsedLotTokens;
  const first = tokens[0];
  if (first === undefined) {
    throw new Error(`${recall.recallNumber} has no parsed lot token; it cannot seed lot cases`);
  }
  return [first, tokens[1] ?? first, tokens[2] ?? first, tokens[3] ?? tokens[1] ?? first];
}

function ndc(recall: SelectedRecall, index: number): string {
  return recall.productNdc[index] ?? recall.productNdc[0] ?? "";
}

function primary(recall: SelectedRecall): Scenario[] {
  const [l0, l1, l2] = lots(recall);
  const n = recall.recallNumber;
  const p = ndc(recall, 0);
  const row = (id: string, rest: Omit<Scenario, "id" | "recallNumber">): Scenario => ({
    id: `${n}:${id}`,
    recallNumber: n,
    ...rest,
  });
  return [
    row("exact-store-1", {
      productNdcRaw: p,
      lotNo: l0,
      storeId: 1,
      dispensedAt: at("2026-10-22"),
      receipt: true,
      expectation: "LOT_EXACT with receipt",
    }),
    row("exact-store-2", {
      productNdcRaw: p,
      lotNo: l1,
      storeId: 2,
      dispensedAt: at("2026-10-23"),
      receipt: true,
      expectation: "LOT_EXACT with receipt",
    }),
    row("exact-no-receipt", {
      productNdcRaw: p,
      lotNo: l0,
      storeId: 3,
      dispensedAt: at("2026-10-24"),
      receipt: false,
      expectation: "LOT_EXACT, no matching receipt",
    }),
    row("package-ndc", {
      productNdcRaw: `${p}-01`,
      lotNo: l2,
      storeId: 1,
      dispensedAt: at("2026-10-25"),
      receipt: true,
      expectation: "LOT_EXACT via package NDC projection",
    }),
    row("different-lot", {
      productNdcRaw: p,
      lotNo: "SYN-77104",
      storeId: 2,
      dispensedAt: at("2026-10-20"),
      receipt: true,
      expectation: "LOT_DIFFERENT_UNVERIFIED",
    }),
    row("missing-lot", {
      productNdcRaw: ndc(recall, 1),
      lotNo: null,
      storeId: 3,
      dispensedAt: at("2026-10-26"),
      receipt: false,
      expectation: "PRODUCT_MATCH_LOT_UNKNOWN (no lot)",
    }),
    row("ambiguous-lot-text", {
      productNdcRaw: p,
      lotNo: `${l0}/${l1}`,
      storeId: 1,
      dispensedAt: at("2026-10-27"),
      receipt: false,
      expectation: "PRODUCT_MATCH_LOT_UNKNOWN (lot text not clean)",
    }),
    row("malformed-ndc", {
      productNdcRaw: p.replace("-", " "),
      lotNo: l0,
      storeId: 2,
      dispensedAt: at("2026-10-28"),
      receipt: false,
      expectation: "quarantine ndc_parseable",
    }),
    row("future-date", {
      productNdcRaw: p,
      lotNo: l1,
      storeId: 3,
      dispensedAt: at("2026-12-15"),
      receipt: false,
      expectation: "quarantine dispensed_at_plausible",
    }),
  ];
}

function secondary(recall: SelectedRecall, store: number): Scenario[] {
  const [l0, l1] = lots(recall);
  const n = recall.recallNumber;
  const p = ndc(recall, 0);
  const q = ndc(recall, Math.min(2, recall.productNdc.length - 1));
  const row = (id: string, rest: Omit<Scenario, "id" | "recallNumber">): Scenario => ({
    id: `${n}:${id}`,
    recallNumber: n,
    ...rest,
  });
  const undelimited = `${p.replace("-", "").padStart(9, "0")}01`;
  return [
    row("exact-a", {
      productNdcRaw: p,
      lotNo: l0,
      storeId: store,
      dispensedAt: at("2026-10-15"),
      receipt: true,
      expectation: "LOT_EXACT with receipt",
    }),
    row("exact-b", {
      productNdcRaw: q,
      lotNo: l1,
      storeId: (store % 3) + 1,
      dispensedAt: at("2026-10-16"),
      receipt: true,
      expectation: "LOT_EXACT with receipt",
    }),
    row("different-lot", {
      productNdcRaw: p,
      lotNo: "SYN-55120",
      storeId: ((store + 1) % 3) + 1,
      dispensedAt: at("2026-10-17"),
      receipt: false,
      expectation: "LOT_DIFFERENT_UNVERIFIED",
    }),
    row("missing-lot", {
      productNdcRaw: ndc(recall, 1),
      lotNo: null,
      storeId: store,
      dispensedAt: at("2026-10-18"),
      receipt: false,
      expectation: "PRODUCT_MATCH_LOT_UNKNOWN (no lot)",
    }),
    row("undelimited-ndc", {
      productNdcRaw: undelimited,
      lotNo: l0,
      storeId: (store % 3) + 1,
      dispensedAt: at("2026-10-19"),
      receipt: false,
      expectation: "quarantine ndc_parseable (AMBIGUOUS)",
    }),
  ];
}

export function buildScenarios(recalls: readonly SelectedRecall[]): Scenario[] {
  return recalls.flatMap((recall, index) =>
    index === 0 ? primary(recall) : secondary(recall, index === 1 ? 1 : 2),
  );
}

export function buildDemoCase(recalls: readonly SelectedRecall[]): DemoCase {
  const recall = recalls[0];
  if (recall === undefined) {
    throw new Error("No selected recall to build the insert-demo case from");
  }
  const [, , , l3] = lots(recall);
  return {
    demoCaseId: "insert-exact-lot",
    label: `New ${recall.recallNumber} dispense, lot ${l3}, store 2`,
    dispenseId: 900_001,
    recallNumber: recall.recallNumber,
    productNdcRaw: ndc(recall, 1),
    lotNo: l3,
    storeId: 2,
    qty: 30,
    scenarioRxOf: `${recall.recallNumber}:missing-lot`,
  };
}
