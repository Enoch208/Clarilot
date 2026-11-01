import { z } from "zod";

const productKeySchema = z.object({ raw: z.string(), productKey: z.string() });

export const selectedRecallSchema = z.object({
  selectionRule: z.string(),
  recallNumber: z.string(),
  permalink: z.url(),
  lastUpdated: z.string(),
  fetchedAt: z.iso.datetime({ offset: true }),
  classification: z.string(),
  status: z.string(),
  reportDate: z.string(),
  recallInitiationDate: z.string().nullable(),
  recallingFirm: z.string(),
  productDescription: z.string(),
  reasonForRecall: z.string(),
  codeInfo: z.string(),
  productNdc: z.array(z.string()).min(1),
  productKeys: z.array(productKeySchema).min(1),
  parsedLotTokens: z.array(z.string()),
  genericName: z.array(z.string()),
  route: z.array(z.string()),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
});
export type SelectedRecall = z.infer<typeof selectedRecallSchema>;

export const shortageOverlapSchema = z.object({
  recallNumber: z.string(),
  productKey: z.string(),
  packageNdc: z.string(),
  status: z.string(),
  availability: z.string().nullable(),
  updateDate: z.string().nullable(),
  genericName: z.string().nullable(),
});
export type ShortageOverlap = z.infer<typeof shortageOverlapSchema>;

export const recallsUsedSchema = z.object({
  selectedAt: z.iso.datetime({ offset: true }),
  enforcement: z.object({
    endpoint: z.url(),
    search: z.string(),
    sort: z.string(),
    pageSize: z.number().int().positive(),
    metaLastUpdated: z.string(),
    totalMatching: z.number().int().nonnegative(),
    fetched: z.number().int().nonnegative(),
    pages: z.number().int().nonnegative(),
    fetchedAt: z.iso.datetime({ offset: true }),
  }),
  constraints: z.array(z.string()),
  rejections: z.record(z.string(), z.number().int().nonnegative()),
  recalls: z.array(selectedRecallSchema).min(1),
  shortages: z.object({
    endpoint: z.url(),
    metaLastUpdated: z.string(),
    totalRecords: z.number().int().nonnegative(),
    fetched: z.number().int().nonnegative(),
    pageSize: z.number().int().positive(),
    pages: z.number().int().nonnegative(),
    fetchedAt: z.iso.datetime({ offset: true }),
    matchedVia: z.string(),
    overlapFound: z.boolean(),
    overlap: z.array(shortageOverlapSchema),
    notes: z.array(z.string()),
  }),
});
export type RecallsUsed = z.infer<typeof recallsUsedSchema>;
