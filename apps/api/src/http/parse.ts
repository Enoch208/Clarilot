import type { Context } from "hono";
import { z } from "zod";
import { badRequest } from "./errors";

export function parseWith<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw badRequest(z.prettifyError(parsed.error));
  }
  return parsed.data;
}

export async function jsonBody(c: Context): Promise<unknown> {
  const text = await c.req.text();
  if (text.trim() === "") {
    throw badRequest("The request body must be JSON");
  }
  const parsed = z.string().transform((value, ctx) => {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      ctx.addIssue({ code: "custom", message: "The request body must be valid JSON" });
      return z.NEVER;
    }
  });
  return parseWith(parsed, text);
}

export const dispenseIdSchema = z.coerce.number().int().positive().max(2_147_483_647);
export const uuidParamSchema = z.uuid();
