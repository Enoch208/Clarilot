import { z } from "zod";

export const lotEvidenceLevels = [
  "LOT_EXACT",
  "ALL_LOTS_EXPLICIT",
  "PRODUCT_MATCH_LOT_UNKNOWN",
  "LOT_DIFFERENT_UNVERIFIED",
  "IDENTIFIER_UNVERIFIED",
  "SOURCE_UNAVAILABLE",
] as const;
export const lotEvidenceLevelSchema = z.enum(lotEvidenceLevels);
export type LotEvidenceLevel = z.infer<typeof lotEvidenceLevelSchema>;

export const lotEvidenceConclusions: Record<LotEvidenceLevel, string> = {
  LOT_EXACT: "Potentially affected dispensing record; lot identifier matches recall notice",
  ALL_LOTS_EXPLICIT: "Potentially affected; explicit broad lot scope",
  PRODUCT_MATCH_LOT_UNKNOWN: "Requires pharmacist investigation; this is not a negative finding",
  LOT_DIFFERENT_UNVERIFIED: "Product match; no decisive lot confirmation; review source notice",
  IDENTIFIER_UNVERIFIED: "Needs data correction or review; still counted as an exception",
  SOURCE_UNAVAILABLE: "Cannot complete verification",
};

export const shortageEvidences = [
  "LISTED_CURRENT",
  "LISTED_OTHER_STATUS",
  "NOT_VERIFIED_IN_SUBSET",
] as const;
export const shortageEvidenceSchema = z.enum(shortageEvidences);
export type ShortageEvidence = z.infer<typeof shortageEvidenceSchema>;

export const shortageEvidenceConclusions: Record<ShortageEvidence, string> = {
  LISTED_CURRENT: "Listed in the bounded FDA shortage subset with source status Current",
  LISTED_OTHER_STATUS: "Listed in the bounded FDA shortage subset with another source status",
  NOT_VERIFIED_IN_SUBSET:
    "Not found in the bounded FDA shortage subset; this does not prove the product is available",
};

export const queryStates = [
  "RESULTS",
  "EMPTY_VERIFIED",
  "SOURCE_UNAVAILABLE",
  "ACCESS_DENIED",
  "TIMEOUT",
  "DEGRADED_CACHED",
] as const;
export const queryStateSchema = z.enum(queryStates);
export type QueryState = z.infer<typeof queryStateSchema>;

export const queryFailureStates = ["SOURCE_UNAVAILABLE", "ACCESS_DENIED", "TIMEOUT"] as const;
export const queryFailureStateSchema = z.enum(queryFailureStates);
export type QueryFailureState = z.infer<typeof queryFailureStateSchema>;

export const querySuccessStates = ["RESULTS", "EMPTY_VERIFIED", "DEGRADED_CACHED"] as const;
export const querySuccessStateSchema = z.enum(querySuccessStates);
export type QuerySuccessState = z.infer<typeof querySuccessStateSchema>;

export const draftStates = [
  "DRAFT_PENDING_REVIEW",
  "APPROVED_DRAFT",
  "REJECTED_DRAFT",
  "INVALIDATED_DRAFT",
] as const;
export const draftStateSchema = z.enum(draftStates);
export type DraftState = z.infer<typeof draftStateSchema>;

export const sourceIds = ["pharmacy_pg", "fda_recalls", "fda_shortages", "receiving_csv"] as const;
export const sourceIdSchema = z.enum(sourceIds);
export type SourceId = z.infer<typeof sourceIdSchema>;

export const failedSourceSchema = z.enum([...sourceIds, "zetaris"]);
export type FailedSource = z.infer<typeof failedSourceSchema>;

export const healthStatuses = ["OK", "DEGRADED", "UNAVAILABLE", "NOT_CONFIGURED"] as const;
export const healthStatusSchema = z.enum(healthStatuses);
export type HealthStatus = z.infer<typeof healthStatusSchema>;

export const cacheModes = ["UNCACHED", "CACHED_FDA_UNCACHED_PHARMACY", "SNAPSHOT"] as const;
export const cacheModeSchema = z.enum(cacheModes);
export type CacheMode = z.infer<typeof cacheModeSchema>;

export const ndcParseStatuses = [
  "OK_PRODUCT",
  "OK_PACKAGE",
  "BLANK",
  "AMBIGUOUS",
  "BAD_SHAPE",
] as const;
export const ndcParseStatusSchema = z.enum(ndcParseStatuses);
export type NdcParseStatus = z.infer<typeof ndcParseStatusSchema>;

export const receivingStatuses = ["RECEIPT_MATCHED", "NO_MATCHING_RECEIPT"] as const;
export const receivingStatusSchema = z.enum(receivingStatuses);
export type ReceivingStatus = z.infer<typeof receivingStatusSchema>;

export const draftGenerators = ["template", "model"] as const;
export const draftGeneratorSchema = z.enum(draftGenerators);
export type DraftGenerator = z.infer<typeof draftGeneratorSchema>;

export const reviewDecisions = ["approve", "reject"] as const;
export const reviewDecisionSchema = z.enum(reviewDecisions);
export type ReviewDecision = z.infer<typeof reviewDecisionSchema>;

export const quarantineRules = [
  "ndc_parseable",
  "dispensed_at_plausible",
  "lot_present",
  "lot_clean",
] as const;
export const quarantineRuleSchema = z.enum(quarantineRules);
export type QuarantineRule = z.infer<typeof quarantineRuleSchema>;

export const isoDateTimeSchema = z.iso.datetime({ offset: true });

export const sourceDateSchema = z.object({
  raw: z.string(),
  iso: z.iso.date().nullable(),
});
export type SourceDate = z.infer<typeof sourceDateSchema>;

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export function isQueryFailure<T extends { status: QueryState }>(
  response: T,
): response is Extract<T, { status: QueryFailureState }> {
  return (queryFailureStates as readonly string[]).includes(response.status);
}
