import { z } from "zod";

export const openFdaMetaSchema = z.object({
  last_updated: z.string(),
  results: z
    .object({
      skip: z.number().int().nonnegative(),
      limit: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
    })
    .optional(),
});
export type OpenFdaMeta = z.infer<typeof openFdaMetaSchema>;

const openFdaHarmonizedSchema = z
  .object({
    product_ndc: z.array(z.string()),
    package_ndc: z.array(z.string()),
    generic_name: z.array(z.string()),
    brand_name: z.array(z.string()),
    route: z.array(z.string()),
  })
  .partial();

export const enforcementRecordSchema = z.object({
  recall_number: z.string(),
  classification: z.string(),
  status: z.string(),
  report_date: z.string(),
  recall_initiation_date: z.string().optional(),
  recalling_firm: z.string(),
  product_description: z.string(),
  reason_for_recall: z.string(),
  code_info: z.string().optional(),
  openfda: openFdaHarmonizedSchema.optional(),
});
export type EnforcementRecord = z.infer<typeof enforcementRecordSchema>;

export const shortageRecordSchema = z.object({
  package_ndc: z.string().optional(),
  status: z.string(),
  update_date: z.string().optional(),
  generic_name: z.string().optional(),
  company_name: z.string().optional(),
  availability: z.string().optional(),
  presentation: z.string().optional(),
  openfda: openFdaHarmonizedSchema.optional(),
});
export type ShortageRecord = z.infer<typeof shortageRecordSchema>;

export const enforcementResponseSchema = z.object({
  meta: openFdaMetaSchema,
  results: z.array(enforcementRecordSchema),
});
export type EnforcementResponse = z.infer<typeof enforcementResponseSchema>;

export const shortageResponseSchema = z.object({
  meta: openFdaMetaSchema,
  results: z.array(shortageRecordSchema),
});
export type ShortageResponse = z.infer<typeof shortageResponseSchema>;

export const openFdaMetaResponseSchema = z.object({ meta: openFdaMetaSchema });

export function enforcementPermalink(
  recallNumber: string,
  baseUrl = "https://api.fda.gov",
): string {
  const search = encodeURIComponent(`recall_number:"${recallNumber}"`);
  return `${baseUrl}/drug/enforcement.json?search=${search}`;
}
