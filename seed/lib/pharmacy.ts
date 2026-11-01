import {
  ndcParseStatus,
  normalizeProductNdc,
  type RecallsUsed,
  type SelectedRecall,
} from "@clarilot/core";
import type { Rng } from "./rng";
import type { Scenario } from "./scenarios";
import type { SqlValue } from "./sql";

export type Product = { raw: string; key: string; label: string };
export type FormularyProduct = {
  productNdc: string;
  genericName: string;
  strength: string;
  dosageForm: string;
};
export type Dispense = {
  dispenseId: number;
  rxId: number;
  patientId: number;
  storeId: number;
  raw: string;
  lot: string | null;
  qty: number;
  at: string;
  scenario: Scenario | null;
};

export const patientCount = 200;
const prescriptionTarget = 500;
const cities = ["Synthetic City North", "Synthetic City Central", "Synthetic City South"];

const title = (text: string) => text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
export const pad = (n: number, width = 4) => String(n).padStart(width, "0");

export function keyOf(raw: string): string {
  const parsed = normalizeProductNdc(raw);
  if (!parsed.ok) {
    throw new Error(`NDC ${raw} does not parse`);
  }
  return parsed.productKey;
}

function recallProducts(recall: SelectedRecall): Product[] {
  const generic = title(recall.genericName[0] ?? recall.productDescription.split(",")[0] ?? "");
  return recall.productKeys.map((k) => ({
    raw: k.raw,
    key: k.productKey,
    label: `${generic} (${recall.recallingFirm})`,
  }));
}

export function backgroundProducts(products: readonly FormularyProduct[]): Product[] {
  return products.map((p) => ({
    raw: p.productNdc,
    key: keyOf(p.productNdc),
    label: `${title(p.genericName)} ${p.strength.replace("/1", "")} ${p.dosageForm.toLowerCase()}`,
  }));
}

export function backgroundAt(rng: Rng): string {
  const day = new Date(Date.UTC(2026, 3, 1) + rng.int(0, 213) * 86_400_000);
  return `${day.toISOString().slice(0, 10)}T${pad(rng.int(9, 18), 2)}:${pad(rng.int(0, 59), 2)}:00Z`;
}

export function buildPharmacy(
  used: RecallsUsed,
  background: readonly Product[],
  scenarios: readonly Scenario[],
  rng: Rng,
) {
  const recalled = used.recalls.flatMap(recallProducts);
  const stores: SqlValue[][] = cities.map((city, i) => [
    i + 1,
    `Demo Pharmacy ${String(i + 1)} (synthetic)`,
    city,
  ]);
  const patients: SqlValue[][] = Array.from({ length: patientCount }, (_, i) => [
    i + 1,
    `Patient ${pad(i + 1)}`,
    "review_in_pharmacy",
    true,
  ]);
  const formulary: SqlValue[][] = [
    ...new Map([...background, ...recalled].map((p) => [p.key, p])).values(),
  ].map((p) => [p.key, p.label, null, null]);

  const prescriptions: SqlValue[][] = [];
  const pending: Omit<Dispense, "dispenseId">[] = [];
  const backgroundRx = prescriptionTarget - scenarios.length;
  for (let rxId = 1; rxId <= backgroundRx; rxId += 1) {
    const patientId = rng.int(1, patientCount);
    const product = rng.pick(background);
    prescriptions.push([rxId, patientId, product.raw, product.label]);
    const home = (patientId % 3) + 1;
    for (let fill = rng.int(2, 4); fill > 0; fill -= 1) {
      pending.push({
        rxId,
        patientId,
        storeId: rng.next() < 0.85 ? home : rng.int(1, 3),
        raw: product.raw,
        lot: `SYN${String(rng.int(10_000, 99_999))}${rng.pick(["A", "B", "C"])}`,
        qty: rng.pick([30, 60, 90]),
        at: backgroundAt(rng),
        scenario: null,
      });
    }
  }
  scenarios.forEach((scenario, index) => {
    const rxId = backgroundRx + index + 1;
    const patientId = rng.int(1, patientCount);
    const parsed = normalizeProductNdc(scenario.productNdcRaw);
    const primary = used.recalls.find((r) => r.recallNumber === scenario.recallNumber);
    const product =
      recalled.find((p) => parsed.ok && p.key === parsed.productKey) ??
      recalled.find((p) => p.raw === primary?.productNdc[0]);
    if (product === undefined) {
      throw new Error(`Scenario ${scenario.id} has no recalled product to prescribe`);
    }
    prescriptions.push([rxId, patientId, product.raw, product.label]);
    pending.push({
      rxId,
      patientId,
      storeId: scenario.storeId,
      raw: scenario.productNdcRaw,
      lot: scenario.lotNo,
      qty: 30,
      at: scenario.dispensedAt,
      scenario,
    });
  });
  const dispenses: Dispense[] = pending
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((d, i) => ({ ...d, dispenseId: i + 1 }));
  return { stores, patients, formulary, prescriptions, dispenses };
}

export function dispensingRow(d: Dispense): SqlValue[] {
  const parsed = normalizeProductNdc(d.raw);
  return [
    d.dispenseId,
    d.rxId,
    d.patientId,
    d.storeId,
    d.raw,
    parsed.ok ? parsed.productKey : null,
    ndcParseStatus(parsed),
    d.lot,
    d.qty,
    d.at,
    true,
  ];
}
