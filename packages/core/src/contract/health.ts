import { z } from "zod";
import { coverageSchema } from "./alerts";
import {
  cacheModeSchema,
  healthStatusSchema,
  isoDateTimeSchema,
  queryStateSchema,
  sourceIdSchema,
} from "./states";

export const componentHealthSchema = z.object({
  status: healthStatusSchema,
  checkedAt: isoDateTimeSchema,
  latencyMs: z.number().int().nonnegative().nullable(),
  detail: z.string(),
});
export type ComponentHealth = z.infer<typeof componentHealthSchema>;

export const zetarisHealthSchema = componentHealthSchema.extend({
  transport: z.enum(["UI_PROXY", "REST_V1"]).nullable(),
  version: z.string().nullable(),
});
export type ZetarisHealth = z.infer<typeof zetarisHealthSchema>;

export const pharmacyHealthSchema = componentHealthSchema.extend({
  dispensingRows: z.number().int().nonnegative().nullable(),
});
export type PharmacyHealth = z.infer<typeof pharmacyHealthSchema>;

export const feedHealthSchema = componentHealthSchema.extend({
  endpoint: z.url(),
  sourcePublishedAt: z.string().nullable(),
  fetchedAt: isoDateTimeSchema.nullable(),
  totalRecords: z.number().int().nonnegative().nullable(),
});
export type FeedHealth = z.infer<typeof feedHealthSchema>;

export const receivingHealthSchema = componentHealthSchema.extend({
  rowCount: z.number().int().nonnegative().nullable(),
  sha256: z.string().nullable(),
  fileModifiedAt: isoDateTimeSchema.nullable(),
});
export type ReceivingHealth = z.infer<typeof receivingHealthSchema>;

export const healthResponseSchema = z.object({
  zetaris: zetarisHealthSchema,
  pharmacy: pharmacyHealthSchema,
  recalls: feedHealthSchema,
  shortages: feedHealthSchema,
  receiving: receivingHealthSchema,
  checkedAt: isoDateTimeSchema,
  coverage: coverageSchema,
  verificationReady: z.boolean(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const sourceDescriptionSchema = z.object({
  id: sourceIdSchema,
  kind: z.enum(["postgres", "rest", "csv"]),
  label: z.string(),
  zetarisObject: z.string(),
  registration: z.enum(["VERIFIED", "UNVERIFIED"]),
  description: z.string(),
  rowCount: z.number().int().nonnegative().nullable(),
  rowCountBasis: z.string(),
  sourcePublishedAt: z.string().nullable(),
  fetchedAt: isoDateTimeSchema.nullable(),
  cacheMode: cacheModeSchema,
  scope: z.string(),
  synthetic: z.boolean(),
});
export type SourceDescription = z.infer<typeof sourceDescriptionSchema>;

export const sourcesResponseSchema = z.object({
  checkedAt: isoDateTimeSchema,
  sources: z.array(sourceDescriptionSchema),
});
export type SourcesResponse = z.infer<typeof sourcesResponseSchema>;

export const freshnessResponseSchema = z.object({
  checkedAt: isoDateTimeSchema,
  recalls: feedHealthSchema,
  shortages: feedHealthSchema,
  selectedFilters: z.object({
    recalls: z.string(),
    shortages: z.string(),
  }),
  note: z.string(),
});
export type FreshnessResponse = z.infer<typeof freshnessResponseSchema>;

export const ledgerEntrySchema = z.object({
  queryId: z.uuid(),
  queryName: z.string(),
  statementSha256: z.string(),
  safeSql: z.string(),
  zetarisPrincipal: z.string().nullable(),
  sourceNames: z.array(z.string()),
  fetchedAt: z.record(z.string(), z.string().nullable()).nullable(),
  cacheMode: cacheModeSchema.nullable(),
  rowCount: z.number().int().nonnegative().nullable(),
  latencyMs: z.number().int().nonnegative().nullable(),
  executionStatus: queryStateSchema,
  errorCode: z.string().nullable(),
  errorSummary: z.string().nullable(),
  classifierVersion: z.string().nullable(),
  createdAt: isoDateTimeSchema,
});
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;
