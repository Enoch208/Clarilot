import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  enforcementPermalink,
  enforcementRecordSchema,
  enforcementResponseSchema,
  recallsUsedSchema,
  shortageResponseSchema,
  type RecallsUsed,
  type SelectedRecall,
} from "@clarilot/core";
import { z } from "zod";
import { compactDate, fetchOpenFda, openFdaBase, paginate, repoRoot, sha256 } from "./lib/openfda";
import {
  constraints,
  rejectionReason,
  selectRecalls,
  shortageListings,
  toCandidate,
  type Selection,
} from "./lib/selection";

const enforcementEndpoint = `${openFdaBase}/drug/enforcement.json`;
const shortageEndpoint = `${openFdaBase}/drug/shortages.json`;
const enforcementPage = 1000;
const shortagePage = 100;
const windowStart = "20260701";

async function enforcementSubset() {
  const search = `_exists_:openfda.product_ndc AND report_date:[${windowStart} TO ${compactDate(new Date())}]`;
  const sort = "report_date:desc";
  const query = `search=${encodeURIComponent(search)}&sort=${encodeURIComponent(sort)}`;
  const result = await paginate(
    (skip) =>
      `${enforcementEndpoint}?${query}&limit=${String(enforcementPage)}&skip=${String(skip)}`,
    enforcementPage,
    (page) => `enforcement_p${String(page)}.json`,
    (body) => enforcementResponseSchema.parse(body),
  );
  return { search, sort, ...result };
}

async function shortageFeed() {
  return paginate(
    (skip) => `${shortageEndpoint}?limit=${String(shortagePage)}&skip=${String(skip)}`,
    shortagePage,
    (page) => `shortages_p${String(page).padStart(2, "0")}.json`,
    (body) => shortageResponseSchema.parse(body),
  );
}

const lookupSchema = z.object({
  meta: z.object({ last_updated: z.string(), results: z.object({ total: z.number() }) }),
  results: z.array(z.unknown()).length(1),
});

async function crossCheck(selection: Selection): Promise<SelectedRecall> {
  const listed = selection.candidate.record;
  const permalink = enforcementPermalink(listed.recall_number);
  const lookup = await fetchOpenFda(permalink, `recall_${listed.recall_number}.json`);
  const parsed = lookupSchema.parse(lookup.body);
  const raw = parsed.results[0];
  const direct = enforcementRecordSchema.parse(raw);
  const same =
    parsed.meta.results.total === 1 &&
    direct.recall_number === listed.recall_number &&
    direct.code_info === listed.code_info &&
    direct.report_date === listed.report_date &&
    JSON.stringify(direct.openfda?.product_ndc) === JSON.stringify(listed.openfda?.product_ndc);
  if (!same) {
    throw new Error(`Direct lookup of ${listed.recall_number} disagrees with the search result`);
  }
  return {
    selectionRule: selection.rule,
    recallNumber: direct.recall_number,
    permalink,
    lastUpdated: parsed.meta.last_updated,
    fetchedAt: lookup.fetchedAt,
    classification: direct.classification,
    status: direct.status,
    reportDate: direct.report_date,
    recallInitiationDate: direct.recall_initiation_date ?? null,
    recallingFirm: direct.recalling_firm,
    productDescription: direct.product_description,
    reasonForRecall: direct.reason_for_recall,
    codeInfo: direct.code_info ?? "",
    productNdc: direct.openfda?.product_ndc ?? [],
    productKeys: selection.candidate.productKeys,
    parsedLotTokens: selection.candidate.tokens,
    genericName: direct.openfda?.generic_name ?? [],
    route: direct.openfda?.route ?? [],
    sha256: sha256(JSON.stringify(raw)),
  };
}

async function main() {
  const enforcement = await enforcementSubset();
  const shortages = await shortageFeed();
  const rejections: Record<string, number> = {};
  const accepted = enforcement.records.filter((record) => {
    const reason = rejectionReason(record);
    if (reason !== null) {
      rejections[reason] = (rejections[reason] ?? 0) + 1;
    }
    return reason === null;
  });
  const listings = shortageListings(shortages.records);
  const selections = selectRecalls(accepted.map(toCandidate), listings);
  if (selections.length === 0) {
    throw new Error("No real enforcement record met the constraints; refusing to invent one");
  }
  const recalls: SelectedRecall[] = [];
  for (const selection of selections) {
    recalls.push(await crossCheck(selection));
  }
  const overlap = recalls.flatMap((recall) =>
    recall.productKeys.flatMap((key) =>
      listings
        .filter((listing) => listing.productKey === key.productKey)
        .map(({ record }) => ({
          recallNumber: recall.recallNumber,
          productKey: key.productKey,
          packageNdc: record.package_ndc ?? "",
          status: record.status,
          availability: record.availability ?? null,
          updateDate: record.update_date ?? null,
          genericName: record.generic_name ?? null,
        })),
    ),
  );
  const output: RecallsUsed = recallsUsedSchema.parse({
    selectedAt: new Date().toISOString(),
    enforcement: {
      endpoint: enforcementEndpoint,
      search: enforcement.search,
      sort: enforcement.sort,
      pageSize: enforcementPage,
      metaLastUpdated: enforcement.lastUpdated,
      totalMatching: enforcement.total,
      fetched: enforcement.records.length,
      pages: enforcement.pages,
      fetchedAt: enforcement.fetchedAt,
    },
    constraints,
    rejections,
    recalls,
    shortages: {
      endpoint: shortageEndpoint,
      metaLastUpdated: shortages.lastUpdated,
      totalRecords: shortages.total,
      fetched: shortages.records.length,
      pageSize: shortagePage,
      pages: shortages.pages,
      fetchedAt: shortages.fetchedAt,
      matchedVia: "package_ndc projected to its product key",
      overlapFound: overlap.length > 0,
      overlap,
      notes: [
        "The full shortage feed was paginated at the documented 100 records per call.",
        "A product absent from the overlap list is not proven to be free of shortage.",
      ],
    },
  });
  await writeFile(
    path.join(repoRoot, "seed", "recalls_used.json"),
    `${JSON.stringify(output, null, 2)}\n`,
  );
  const summary = recalls.map((r) => `${r.recallNumber} (${r.selectionRule})`).join(", ");
  process.stdout.write(
    `Selected ${String(recalls.length)} of ${String(accepted.length)} eligible records: ${summary}\n` +
      `Shortage overlap rows: ${String(overlap.length)}\n`,
  );
}

await main();
