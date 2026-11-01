import type { ApiError } from "@clarilot/core";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class HttpError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: string;

  constructor(status: ContentfulStatusCode, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }

  toBody(): ApiError {
    return { code: this.code, message: this.message };
  }
}

export const badRequest = (message: string) => new HttpError(400, "INVALID_REQUEST", message);

export const forbidden = (code: string, message: string) => new HttpError(403, code, message);

export const notFound = (message: string, code = "NOT_FOUND") => new HttpError(404, code, message);

export const conflict = (code: string, message: string) => new HttpError(409, code, message);

export const unprocessable = (code: string, message: string) => new HttpError(422, code, message);

export const unavailable = (code: string, message: string) => new HttpError(503, code, message);

export function sanitize(message: string): string {
  return message
    .replace(/postgres(ql)?:\/\/[^\s"']+/gi, "postgres://[redacted]")
    .replace(/Bearer\s+[\w.-]+/gi, "Bearer [redacted]")
    .slice(0, 300);
}

export function describeFailure(error: unknown): string {
  if (error instanceof Error) {
    const frames = (error.stack ?? "")
      .split("\n")
      .filter((line) => line.trimStart().startsWith("at "))
      .slice(0, 8)
      .join("\n");
    return `${error.name}: ${sanitize(error.message)}\n${frames}`;
  }
  return "A non-error value was thrown";
}
