import {
  parseFdaCompactDate,
  type FeaturedRecallsResponse,
  type FreshnessResponse,
  type SourcesResponse,
} from "@clarilot/core";
import type { AppDeps } from "../deps";
import { coverage, recallSearch, shortageFilter } from "../health/scope";
import { checkHealth } from "../health/service";

export async function describeSources(deps: AppDeps): Promise<SourcesResponse> {
  const health = await checkHealth(deps);
  const registration = deps.registry.verifiedInZetaris ? "VERIFIED" : "UNVERIFIED";
  return {
    checkedAt: health.checkedAt,
    sources: [
      {
        id: "pharmacy_pg",
        kind: "postgres",
        label: "Synthetic pharmacy Postgres",
        zetarisObject: "pharmacy_pg.dispensing",
        registration,
        description: "Stores, synthetic patients, prescriptions, dispensing and formulary",
        rowCount: health.pharmacy.dispensingRows,
        rowCountBasis: "dispensing rows, counted by a direct Postgres read from the API",
        sourcePublishedAt: null,
        fetchedAt: health.pharmacy.status === "OK" ? health.checkedAt : null,
        cacheMode: "UNCACHED",
        scope: "all synthetic dispensing rows",
        synthetic: true,
      },
      {
        id: "fda_recalls",
        kind: "rest",
        label: "openFDA drug enforcement reports",
        zetarisObject: "fda.recalls_by_ndc (FDA_RAW.recalls)",
        registration,
        description: "Real published FDA recall records with product NDCs and code_info",
        rowCount: health.recalls.totalRecords,
        rowCountBasis: "openFDA meta.results.total for the registered search",
        sourcePublishedAt: health.recalls.sourcePublishedAt,
        fetchedAt: health.recalls.fetchedAt,
        cacheMode: "SNAPSHOT",
        scope: coverage.recallScope,
        synthetic: false,
      },
      {
        id: "fda_shortages",
        kind: "rest",
        label: "openFDA drug shortages",
        zetarisObject: "fda.shortages_by_ndc (FDA_RAW.shortages_p00..p16)",
        registration,
        description: "Real FDA shortage listings, informational availability context only",
        rowCount: health.shortages.totalRecords,
        rowCountBasis: "openFDA meta.results.total for the whole shortage feed",
        sourcePublishedAt: health.shortages.sourcePublishedAt,
        fetchedAt: health.shortages.fetchedAt,
        cacheMode: "SNAPSHOT",
        scope: coverage.shortageScope,
        synthetic: false,
      },
      {
        id: "receiving_csv",
        kind: "csv",
        label: "Synthetic receiving ledger CSV",
        zetarisObject: "lots_files.receiving_lots",
        registration,
        description: "Lots received per store; supports inventory provenance only",
        rowCount: health.receiving.rowCount,
        rowCountBasis: "data lines in seed/receiving_lots.csv",
        sourcePublishedAt: health.receiving.fileModifiedAt,
        fetchedAt: health.receiving.status === "OK" ? health.checkedAt : null,
        cacheMode: "SNAPSHOT",
        scope: "every receipt in the file",
        synthetic: true,
      },
    ],
  };
}

export async function freshness(deps: AppDeps): Promise<FreshnessResponse> {
  const [recalls, shortages] = await Promise.all([
    deps.feeds.probe("recalls"),
    deps.feeds.probe("shortages"),
  ]);
  return {
    checkedAt: deps.now().toISOString(),
    recalls,
    shortages,
    selectedFilters: { recalls: recallSearch, shortages: shortageFilter },
    note: "openFDA publishes enforcement reports weekly and shortages daily. These are the publication and fetch times this API observed, not live FDA postings.",
  };
}

export function featuredRecalls(deps: Pick<AppDeps, "recallsUsed">): FeaturedRecallsResponse {
  const used = deps.recallsUsed;
  const overlap = used.shortages.overlap;
  return {
    selectedAt: used.selectedAt,
    recalls: used.recalls.map((r) => ({
      recallNumber: r.recallNumber,
      classification: r.classification,
      status: r.status,
      recallingFirm: r.recallingFirm,
      productDescription: r.productDescription,
      reasonForRecall: r.reasonForRecall,
      reportDate: parseFdaCompactDate(r.reportDate) ?? { raw: r.reportDate, iso: null },
      codeInfo: r.codeInfo,
      productNdc: r.productNdc,
      permalink: r.permalink,
      sourcePublishedAt: r.lastUpdated,
      fetchedAt: r.fetchedAt,
      sha256: r.sha256,
    })),
    shortageOverlap: {
      found: used.shortages.overlapFound,
      detail: used.shortages.overlapFound
        ? overlap
            .map(
              (o) =>
                `${o.recallNumber}: package ${o.packageNdc} (${o.genericName ?? "unnamed"}) listed ${o.status}, updated ${o.updateDate ?? "unknown"}`,
            )
            .join("; ")
        : "No selected recall product appeared in the shortage feed at selection time; that does not prove availability",
      checkedAt: used.shortages.fetchedAt,
    },
    note: "Real openFDA records selected and cross-checked by direct recall_number lookup at the fetch times shown. This is an archived selection, not a live feed.",
  };
}
