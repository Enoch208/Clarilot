import { writeFile } from "node:fs/promises";
import path from "node:path";
import { enforcementResponseSchema, normalizeProductNdc, recallNdcCoverage } from "@clarilot/core";
import { z } from "zod";
import { fetchOpenFda, openFdaBase, paginate, repoRoot } from "./lib/openfda";

const generics = [
  ["atorvastatin", "lisinopril", "metformin", "amlodipine", "levothyroxine"],
  ["omeprazole", "losartan", "simvastatin", "sertraline", "gabapentin"],
  ["hydrochlorothiazide", "metoprolol", "montelukast", "escitalopram", "rosuvastatin"],
  ["pantoprazole", "furosemide", "fluoxetine", "pravastatin", "tamsulosin"],
  ["citalopram", "trazodone", "carvedilol", "meloxicam", "clopidogrel"],
  ["bupropion", "duloxetine", "allopurinol", "warfarin", "spironolactone"],
];
const perGeneric = 3;
const recallWindowStart = "20250101";

const ndcProductSchema = z.object({
  product_ndc: z.string(),
  generic_name: z.string(),
  brand_name: z.string().optional(),
  dosage_form: z.string(),
  labeler_name: z.string(),
  marketing_category: z.string(),
  active_ingredients: z.array(z.object({ name: z.string(), strength: z.string() })).length(1),
});
const ndcResponseSchema = z.object({
  meta: z.object({ last_updated: z.string() }),
  results: z.array(z.unknown()),
});

async function recentRecallKeys() {
  const search = `_exists_:openfda.product_ndc AND report_date:[${recallWindowStart} TO 20991231]`;
  const result = await paginate(
    (skip) =>
      `${openFdaBase}/drug/enforcement.json?search=${encodeURIComponent(search)}&limit=1000&skip=${String(skip)}`,
    1000,
    (page) => `formulary_exclusion_p${String(page)}.json`,
    (body) => enforcementResponseSchema.parse(body),
  );
  const keys = new Set(
    result.records.flatMap((r) =>
      recallNdcCoverage(r.openfda?.product_ndc).productKeys.map((k) => k.productKey),
    ),
  );
  return { keys, search, total: result.total, fetchedAt: result.fetchedAt };
}

async function main() {
  const exclusion = await recentRecallKeys();
  const products: Record<string, string>[] = [];
  let lastUpdated = "";
  let fetchedAt = "";
  for (const [index, group] of generics.entries()) {
    const search = `generic_name:(${group.join(" OR ")}) AND route:"ORAL" AND finished:true AND marketing_category:"ANDA"`;
    const url = `${openFdaBase}/drug/ndc.json?search=${encodeURIComponent(search)}&limit=1000`;
    const page = await fetchOpenFda(url, `ndc_group_${String(index)}.json`);
    const parsed = ndcResponseSchema.parse(page.body);
    lastUpdated = parsed.meta.last_updated;
    fetchedAt ||= page.fetchedAt;
    const eligible = parsed.results
      .flatMap((raw) => {
        const product = ndcProductSchema.safeParse(raw);
        return product.success ? [product.data] : [];
      })
      .filter((p) => {
        const key = normalizeProductNdc(p.product_ndc);
        return key.ok && key.kind === "product" && !exclusion.keys.has(key.productKey);
      })
      .sort((a, b) => a.product_ndc.localeCompare(b.product_ndc));
    for (const name of group) {
      const matches = eligible.filter((p) => p.generic_name.toLowerCase().startsWith(name));
      for (const p of matches.slice(0, perGeneric)) {
        const ingredient = p.active_ingredients[0];
        products.push({
          productNdc: p.product_ndc,
          genericName: p.generic_name,
          strength: ingredient?.strength ?? "",
          dosageForm: p.dosage_form,
          labelerName: p.labeler_name,
        });
      }
    }
  }
  const output = {
    fetchedAt,
    source: `${openFdaBase}/drug/ndc.json`,
    metaLastUpdated: lastUpdated,
    selection: `first ${String(perGeneric)} ANDA oral finished single-ingredient products per generic by product_ndc`,
    excludedRecallKeys: {
      search: exclusion.search,
      enforcementRecords: exclusion.total,
      productKeys: exclusion.keys.size,
      fetchedAt: exclusion.fetchedAt,
    },
    products,
  };
  await writeFile(
    path.join(repoRoot, "seed", "formulary_products.json"),
    `${JSON.stringify(output, null, 2)}\n`,
  );
  process.stdout.write(
    `Formulary: ${String(products.length)} real products, ${String(exclusion.keys.size)} recalled product keys excluded\n`,
  );
}

await main();
