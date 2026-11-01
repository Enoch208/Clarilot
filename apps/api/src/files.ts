import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { recallsUsedSchema, recallNumberSchema, type RecallsUsed } from "@clarilot/core";
import { z } from "zod";

export const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");

export const fromRepo = (relative: string, root: string = repoRoot) => path.resolve(root, relative);

export const demoCaseFileSchema = z.object({
  demoCaseId: z.string().min(1),
  label: z.string(),
  dispenseId: z.number().int().positive(),
  recallNumber: recallNumberSchema,
  productNdcRaw: z.string(),
  lotNo: z.string(),
  storeId: z.number().int().positive(),
  qty: z.number().int().positive(),
  rxId: z.number().int().positive(),
  patientId: z.number().int().positive(),
});
export type DemoCaseFile = z.infer<typeof demoCaseFileSchema>;

const fixturesSchema = z.object({
  demoCases: z.array(demoCaseFileSchema),
});

export async function loadRecallsUsed(file: string, root = repoRoot): Promise<RecallsUsed> {
  return recallsUsedSchema.parse(JSON.parse(await readFile(fromRepo(file, root), "utf8")));
}

export async function loadDemoCases(root = repoRoot): Promise<DemoCaseFile[]> {
  const raw: unknown = JSON.parse(await readFile(fromRepo("seed/fixtures.json", root), "utf8"));
  return fixturesSchema.parse(raw).demoCases;
}

export type ReceivingStats = {
  rowCount: number;
  sha256: string;
  fileModifiedAt: string;
};

export async function receivingStats(file: string, root = repoRoot): Promise<ReceivingStats> {
  const absolute = fromRepo(file, root);
  const [content, info] = await Promise.all([readFile(absolute, "utf8"), stat(absolute)]);
  const lines = content.split("\n").filter((line) => line.trim() !== "");
  return {
    rowCount: Math.max(0, lines.length - 1),
    sha256: createHash("sha256").update(content).digest("hex"),
    fileModifiedAt: info.mtime.toISOString(),
  };
}
