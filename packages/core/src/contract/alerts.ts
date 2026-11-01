import { z } from "zod";
import {
  cacheModeSchema,
  failedSourceSchema,
  isoDateTimeSchema,
  lotEvidenceLevelSchema,
  ndcParseStatusSchema,
  queryFailureStateSchema,
  querySuccessStateSchema,
  receivingStatusSchema,
  shortageEvidenceSchema,
  sourceDateSchema,
  sourceIdSchema,
} from "./states";

export const recallNumberSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[A-Z0-9][A-Z0-9-]*$/);

export const coverageSchema = z.object({
  recallSubset: z.enum(["bounded", "complete", "unknown"]),
  recallScope: z.string(),
  shortageSubset: z.enum(["bounded", "complete", "unknown"]),
  shortageScope: z.string(),
  publicationLagKnown: z.boolean(),
});
export type Coverage = z.infer<typeof coverageSchema>;

export const sourceStampSchema = z.object({
  source: sourceIdSchema,
  zetarisObject: z.string(),
  sourcePublishedAt: z.string().nullable(),
  fetchedAt: isoDateTimeSchema.nullable(),
});
export type SourceStamp = z.infer<typeof sourceStampSchema>;

export const recallFactsSchema = z.object({
  recallNumber: recallNumberSchema,
  classification: z.string(),
  recallStatus: z.string(),
  reportDate: sourceDateSchema,
  recallInitiationDate: sourceDateSchema.nullable(),
  recallingFirm: z.string(),
  productDescription: z.string(),
  reasonForRecall: z.string(),
  codeInfo: z.string(),
  productNdcRaw: z.string(),
  productNdcKey: z.string(),
  permalink: z.url(),
});
export type RecallFacts = z.infer<typeof recallFactsSchema>;

export const dispenseFactsSchema = z.object({
  dispenseId: z.number().int().positive(),
  rxId: z.number().int().positive(),
  drugLabel: z.string(),
  qty: z.number().int().positive(),
  dispensedAt: isoDateTimeSchema,
  productNdcRaw: z.string(),
  productNdcKey: z.string().nullable(),
  ndcParseStatus: ndcParseStatusSchema,
  lotNo: z.string().nullable(),
});
export type DispenseFacts = z.infer<typeof dispenseFactsSchema>;

export const patientDisplaySchema = z.object({
  patientId: z.number().int().positive(),
  displayName: z.string(),
  synthetic: z.literal(true),
});
export type PatientDisplay = z.infer<typeof patientDisplaySchema>;

export const storeSchema = z.object({
  storeId: z.number().int().positive(),
  name: z.string(),
  city: z.string(),
});
export type Store = z.infer<typeof storeSchema>;

export const lotEvidenceSchema = z.object({
  level: lotEvidenceLevelSchema,
  reason: z.string(),
  conclusion: z.string(),
  matchedToken: z.string().nullable(),
  parsedLotTokens: z.array(z.string()),
  classifierVersion: z.string(),
});
export type LotEvidence = z.infer<typeof lotEvidenceSchema>;

export const receivingEvidenceSchema = z.object({
  status: receivingStatusSchema,
  receiptId: z.string().nullable(),
  supplier: z.string().nullable(),
  receivedAt: z.string().nullable(),
  lotNo: z.string().nullable(),
  note: z.string(),
});
export type ReceivingEvidence = z.infer<typeof receivingEvidenceSchema>;

export const shortageContextSchema = z.object({
  evidence: shortageEvidenceSchema,
  sourceStatus: z.string().nullable(),
  genericName: z.string().nullable(),
  availability: z.string().nullable(),
  updateDate: sourceDateSchema.nullable(),
  matchedProductNdcKey: z.string().nullable(),
  scope: z.string(),
  note: z.string(),
});
export type ShortageContext = z.infer<typeof shortageContextSchema>;

export const alertSchema = z.object({
  caseKey: z.string(),
  synthetic: z.literal(true),
  requiresPharmacistReview: z.literal(true),
  recall: recallFactsSchema,
  dispense: dispenseFactsSchema,
  patient: patientDisplaySchema,
  store: storeSchema,
  lot: lotEvidenceSchema,
  receiving: receivingEvidenceSchema,
  shortage: shortageContextSchema,
});
export type Alert = z.infer<typeof alertSchema>;

export const alertsQuerySchema = z.object({
  storeId: z.coerce.number().int().positive().optional(),
  recallNumber: recallNumberSchema.optional(),
  evidenceLevel: lotEvidenceLevelSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type AlertsQuery = z.infer<typeof alertsQuerySchema>;

const queryMetaSchema = z.object({
  queryId: z.uuid(),
  queryName: z.string(),
  fetchedAt: isoDateTimeSchema,
  latencyMs: z.number().int().nonnegative(),
  coverage: coverageSchema,
  cacheMode: cacheModeSchema,
  snapshotTakenAt: isoDateTimeSchema.nullable(),
  sources: z.array(sourceStampSchema),
  classifierVersion: z.string(),
  warnings: z.array(z.string()),
});

export const queryFailureSchema = z.object({
  status: queryFailureStateSchema,
  queryId: z.uuid(),
  queryName: z.string(),
  checkedAt: isoDateTimeSchema,
  failedSource: failedSourceSchema.nullable(),
  reason: z.string(),
});
export type QueryFailure = z.infer<typeof queryFailureSchema>;

export const alertsSuccessSchema = queryMetaSchema.extend({
  status: querySuccessStateSchema,
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCases: z.number().int().nonnegative(),
  alerts: z.array(alertSchema),
});
export type AlertsSuccess = z.infer<typeof alertsSuccessSchema>;

export const alertsResponseSchema = z.discriminatedUnion("status", [
  alertsSuccessSchema,
  queryFailureSchema,
]);
export type AlertsResponse = z.infer<typeof alertsResponseSchema>;
