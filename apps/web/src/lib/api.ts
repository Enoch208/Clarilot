import type { z } from "zod";

export class ApiFailure extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return null;
  return JSON.parse(text) as unknown;
}

function describeFailure(body: unknown, status: number): string {
  if (
    body !== null &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }
  return `The API answered with HTTP ${String(status)}`;
}

export async function getJson<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, {
    headers: { accept: "application/json" },
    ...(signal ? { signal } : {}),
  });
  const body = await readBody(response);
  const parsed = schema.safeParse(body);
  if (parsed.success) return parsed.data;
  if (!response.ok) throw new ApiFailure(describeFailure(body, response.status), response.status);
  throw new ApiFailure(
    `The API response for ${path} did not match the expected shape`,
    response.status,
  );
}

export async function postJson<T>(
  path: string,
  payload: unknown,
  schema: z.ZodType<T>,
  headers: Record<string, string> = {},
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
  const body = await readBody(response);
  const parsed = schema.safeParse(body);
  if (parsed.success) return parsed.data;
  if (!response.ok) throw new ApiFailure(describeFailure(body, response.status), response.status);
  throw new ApiFailure(
    `The API response for ${path} did not match the expected shape`,
    response.status,
  );
}
