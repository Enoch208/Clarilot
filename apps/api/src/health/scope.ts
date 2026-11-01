import type { Coverage } from "@clarilot/core";

export const recallSearch = "_exists_:openfda.product_ndc AND report_date:[20260701 TO 20261231]";

export const coverage: Coverage = {
  recallSubset: "bounded",
  recallScope:
    "openFDA enforcement reports with a product NDC and report_date 2026-07-01 to 2026-12-31, first page of up to 1000",
  shortageSubset: "bounded",
  shortageScope:
    "openFDA drug shortages registered as 17 pages of 100 (skip 0 to 1600); records beyond those pages are not covered",
  publicationLagKnown: true,
};

export const shortageFilter = "limit=100 with skip 0 to 1600 (17 pages)";
