import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { recallsUsedSchema } from "@clarilot/core";
import { z } from "zod";
import { repoRoot } from "./lib/openfda";
import {
  backgroundAt,
  backgroundProducts,
  buildPharmacy,
  dispensingRow,
  keyOf,
  pad,
} from "./lib/pharmacy";
import { createRng } from "./lib/rng";
import { buildDemoCase, buildScenarios } from "./lib/scenarios";
import { csvField, insertStatements } from "./lib/sql";

const seedDir = path.join(repoRoot, "seed");
const seed = 20_261_101;

const formularyFileSchema = z.object({
  products: z.array(
    z.object({
      productNdc: z.string(),
      genericName: z.string(),
      strength: z.string(),
      dosageForm: z.string(),
    }),
  ),
});

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await readFile(path.join(seedDir, file), "utf8")) as unknown;
}

async function main() {
  const rng = createRng(seed);
  const used = recallsUsedSchema.parse(await readJson("recalls_used.json"));
  const background = backgroundProducts(
    formularyFileSchema.parse(await readJson("formulary_products.json")).products,
  );
  const scenarios = buildScenarios(used.recalls);
  const demo = buildDemoCase(used.recalls);
  const pharmacy = buildPharmacy(used, background, scenarios, rng);

  const sql = [
    "BEGIN;",
    ...insertStatements("stores", ["store_id", "name", "city"], pharmacy.stores),
    ...insertStatements(
      "patients",
      ["patient_id", "full_name", "preferred_contact", "synthetic"],
      pharmacy.patients,
    ),
    ...insertStatements(
      "formulary",
      ["product_ndc_key", "drug_label", "substitute_product_ndc_key", "substitute_label"],
      pharmacy.formulary,
    ),
    ...insertStatements(
      "prescriptions",
      ["rx_id", "patient_id", "prescribed_product_ndc_raw", "drug_label"],
      pharmacy.prescriptions,
    ),
    ...insertStatements(
      "dispensing",
      [
        "dispense_id",
        "rx_id",
        "patient_id",
        "store_id",
        "product_ndc_raw",
        "product_ndc_key",
        "ndc_parse_status",
        "lot_no",
        "qty",
        "dispensed_at",
        "synthetic",
      ],
      pharmacy.dispenses.map(dispensingRow),
    ),
    "COMMIT;",
  ].join("\n\n");
  await writeFile(path.join(seedDir, "init", "002_seed.sql"), `${sql}\n`);

  const receipts: (string | number)[][] = [];
  const receipt = (storeId: number, raw: string, lot: string, day: string, supplier: string) =>
    receipts.push([
      `R-${pad(receipts.length + 1, 3)}`,
      storeId,
      raw,
      keyOf(raw),
      lot,
      day,
      supplier,
    ]);
  for (const s of scenarios) {
    if (s.receipt && s.lotNo !== null) {
      receipt(s.storeId, s.productNdcRaw, s.lotNo, "2026-09-28", "Synthetic Wholesaler A");
    }
  }
  receipt(demo.storeId, demo.productNdcRaw, demo.lotNo, "2026-09-30", "Synthetic Wholesaler A");
  for (let i = 0; i < 30; i += 1) {
    const product = rng.pick(background);
    const lot = `SYN${String(rng.int(10_000, 99_999))}A`;
    const supplier = rng.pick(["Synthetic Wholesaler A", "Synthetic Wholesaler B"]);
    receipt(rng.int(1, 3), product.raw, lot, backgroundAt(rng).slice(0, 10), supplier);
  }
  const header = "receipt_id,store_id,product_ndc_raw,product_ndc_key,lot_no,received_at,supplier";
  const lines = receipts.map((r) => r.map(csvField).join(","));
  await writeFile(path.join(seedDir, "receiving_lots.csv"), `${[header, ...lines].join("\n")}\n`);

  const byScenario = new Map(pharmacy.dispenses.map((d) => [d.scenario?.id, d]));
  const demoRx = byScenario.get(demo.scenarioRxOf);
  if (demoRx === undefined) {
    throw new Error(`Demo case refers to unknown scenario ${demo.scenarioRxOf}`);
  }
  const manifest = {
    seed,
    counts: {
      stores: pharmacy.stores.length,
      patients: pharmacy.patients.length,
      formulary: pharmacy.formulary.length,
      prescriptions: pharmacy.prescriptions.length,
      dispensing: pharmacy.dispenses.length,
      receipts: receipts.length,
    },
    scenarios: scenarios.map((s) => {
      const d = byScenario.get(s.id);
      return { ...s, dispenseId: d?.dispenseId, rxId: d?.rxId, patientId: d?.patientId };
    }),
    demoCases: [{ ...demo, rxId: demoRx.rxId, patientId: demoRx.patientId }],
  };
  await writeFile(path.join(seedDir, "fixtures.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(manifest.counts)}\n`);
}

await main();
