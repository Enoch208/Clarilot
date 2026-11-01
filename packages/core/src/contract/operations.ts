import { z } from "zod";
import { recallNumberSchema } from "./alerts";
import { isoDateTimeSchema, quarantineRuleSchema, sourceDateSchema } from "./states";

export const quarantineRowSchema = z.object({
  rule: quarantineRuleSchema,
  dispenseId: z.number().int().positive(),
  productNdcRaw: z.string(),
  lotNo: z.string().nullable(),
  dispensedAt: isoDateTimeSchema,
  reason: z.string(),
  synthetic: z.literal(true),
});
export type QuarantineRow = z.infer<typeof quarantineRowSchema>;

export const quarantineRuleSummarySchema = z.object({
  rule: quarantineRuleSchema,
  description: z.string(),
  action: z.string(),
  failing: z.number().int().nonnegative(),
});
export type QuarantineRuleSummary = z.infer<typeof quarantineRuleSummarySchema>;

export const quarantineQuerySchema = z.object({
  rule: quarantineRuleSchema.optional(),
});
export type QuarantineQuery = z.infer<typeof quarantineQuerySchema>;

export const quarantineResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.enum(["RESULTS", "EMPTY_VERIFIED"]),
    checkedAt: isoDateTimeSchema,
    engine: z.enum(["ZETARIS", "APP_DIRECT_POSTGRES"]),
    engineNote: z.string(),
    rules: z.array(quarantineRuleSummarySchema),
    rows: z.array(quarantineRowSchema),
  }),
  z.object({
    status: z.literal("SOURCE_UNAVAILABLE"),
    checkedAt: isoDateTimeSchema,
    reason: z.string(),
  }),
]);
export type QuarantineResponse = z.infer<typeof quarantineResponseSchema>;

export const featuredRecallSchema = z.object({
  recallNumber: recallNumberSchema,
  classification: z.string(),
  status: z.string(),
  recallingFirm: z.string(),
  productDescription: z.string(),
  reasonForRecall: z.string(),
  reportDate: sourceDateSchema,
  codeInfo: z.string(),
  productNdc: z.array(z.string()),
  permalink: z.url(),
  sourcePublishedAt: z.string(),
  fetchedAt: isoDateTimeSchema,
  sha256: z.string(),
});
export type FeaturedRecall = z.infer<typeof featuredRecallSchema>;

export const featuredRecallsResponseSchema = z.object({
  selectedAt: isoDateTimeSchema,
  recalls: z.array(featuredRecallSchema),
  shortageOverlap: z.object({
    found: z.boolean(),
    detail: z.string(),
    checkedAt: isoDateTimeSchema,
  }),
  note: z.string(),
});
export type FeaturedRecallsResponse = z.infer<typeof featuredRecallsResponseSchema>;

export const demoInsertBodySchema = z.object({
  demoCaseId: z.string().min(1).max(64),
});
export type DemoInsertBody = z.infer<typeof demoInsertBodySchema>;

export const demoInsertResponseSchema = z.object({
  demoCaseId: z.string(),
  dispenseId: z.number().int().positive(),
  inserted: z.boolean(),
  insertedAt: isoDateTimeSchema.nullable(),
  note: z.string(),
});
export type DemoInsertResponse = z.infer<typeof demoInsertResponseSchema>;

export const demoResetResponseSchema = z.object({
  removedDispenseIds: z.array(z.number().int().positive()),
  removedDrafts: z.number().int().nonnegative(),
  resetAt: isoDateTimeSchema,
});
export type DemoResetResponse = z.infer<typeof demoResetResponseSchema>;

export const demoCaseSchema = z.object({
  demoCaseId: z.string(),
  label: z.string(),
  dispenseId: z.number().int().positive(),
  recallNumber: recallNumberSchema,
  inserted: z.boolean(),
});
export type DemoCase = z.infer<typeof demoCaseSchema>;

export const demoCasesResponseSchema = z.object({
  demoMode: z.boolean(),
  cases: z.array(demoCaseSchema),
});
export type DemoCasesResponse = z.infer<typeof demoCasesResponseSchema>;

export const demoTokenHeader = "x-demo-token";
