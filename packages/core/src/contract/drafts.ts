import { z } from "zod";
import { alertSchema, queryFailureSchema, recallNumberSchema } from "./alerts";
import {
  cacheModeSchema,
  draftGeneratorSchema,
  draftStateSchema,
  isoDateTimeSchema,
  querySuccessStateSchema,
  reviewDecisionSchema,
} from "./states";

export const draftContentSchema = z.object({
  recallNumber: recallNumberSchema,
  drugLabel: z.string(),
  lotLabel: z.string(),
  draftText: z.string().min(1).max(1200),
  pharmacistNote: z.string().min(1).max(1200),
  sourceIds: z.array(z.string()),
});
export type DraftContent = z.infer<typeof draftContentSchema>;

export const groundingCheckSchema = z.object({
  check: z.string(),
  ok: z.boolean(),
  detail: z.string(),
});
export type GroundingCheck = z.infer<typeof groundingCheckSchema>;

export const groundingSchema = z.object({
  ok: z.boolean(),
  checks: z.array(groundingCheckSchema),
});
export type Grounding = z.infer<typeof groundingSchema>;

export const draftSchema = z.object({
  draftId: z.uuid(),
  caseKey: z.string(),
  dispenseId: z.number().int().positive(),
  recallNumber: recallNumberSchema,
  state: draftStateSchema,
  generator: draftGeneratorSchema,
  modelName: z.string().nullable(),
  content: draftContentSchema,
  grounding: groundingSchema,
  sourceQueryId: z.uuid(),
  reviewerLabel: z.string().nullable(),
  decidedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  sent: z.literal(false),
});
export type Draft = z.infer<typeof draftSchema>;

export const createDraftBodySchema = z.object({
  recallNumber: recallNumberSchema,
});
export type CreateDraftBody = z.infer<typeof createDraftBodySchema>;

export const draftDecisionBodySchema = z.object({
  decision: reviewDecisionSchema,
  reviewerLabel: z.string().trim().min(1).max(80),
  idempotencyKey: z.uuid(),
});
export type DraftDecisionBody = z.infer<typeof draftDecisionBodySchema>;

export const alertDetailSuccessSchema = z.object({
  status: querySuccessStateSchema,
  queryId: z.uuid(),
  queryName: z.string(),
  fetchedAt: isoDateTimeSchema,
  cacheMode: cacheModeSchema,
  dispenseId: z.number().int().positive(),
  cases: z.array(alertSchema),
  drafts: z.array(draftSchema),
  warnings: z.array(z.string()),
});
export type AlertDetailSuccess = z.infer<typeof alertDetailSuccessSchema>;

export const alertDetailResponseSchema = z.discriminatedUnion("status", [
  alertDetailSuccessSchema,
  queryFailureSchema,
]);
export type AlertDetailResponse = z.infer<typeof alertDetailResponseSchema>;
