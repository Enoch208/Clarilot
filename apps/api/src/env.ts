import { z } from "zod";

const flag = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const optionalSecret = z.string().min(1).optional();

export const apiEnvSchema = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(8820),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  OPENFDA_BASE_URL: z
    .url({ protocol: /^https$/ })
    .default("https://api.fda.gov")
    .transform((value) => value.replace(/\/+$/, "")),
  OPENFDA_USER_AGENT: z.string().min(1).default("ClarilotDemo/1.0"),
  OPENFDA_API_KEY: optionalSecret,
  ZETARIS_BASE_URL: z
    .url({ protocol: /^https?$/ })
    .transform((value) => value.replace(/\/+$/, ""))
    .optional(),
  ZETARIS_TRANSPORT: z.enum(["UI_PROXY", "REST_V1"]).default("UI_PROXY"),
  ZETARIS_API_KEY: optionalSecret,
  ZETARIS_ORG_ID: z.string().regex(/^\d+$/, "must be the numeric organisation ID").optional(),
  ZETARIS_PRINCIPAL: z.string().min(1).optional(),
  ZETARIS_QUERY_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(600_000).default(60_000),
  DEMO_MODE: flag,
  DEMO_TOKEN: z.string().min(16).optional(),
  RECEIVING_CSV_PATH: z.string().min(1).default("seed/receiving_lots.csv"),
  RECALLS_USED_PATH: z.string().min(1).default("seed/recalls_used.json"),
  SQL_NAMED_DIR: z.string().min(1).default("sql/named"),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvError";
  }
}

const variableNames = apiEnvSchema.keyof().options;

export function loadApiEnv(source: Record<string, string | undefined>): ApiEnv {
  const present = Object.fromEntries(
    variableNames.map((name) => [name, source[name] === "" ? undefined : source[name]]),
  );
  const parsed = apiEnvSchema.safeParse(present);
  if (!parsed.success) {
    const failing = variableNames.filter((name) =>
      parsed.error.issues.some((issue) => issue.path[0] === name),
    );
    const missing = failing.filter((name) => present[name] === undefined);
    const invalid = failing.filter((name) => present[name] !== undefined);
    const parts = [
      ...(missing.length > 0 ? [`Missing: ${missing.join(", ")}.`] : []),
      ...(invalid.length > 0 ? [`Invalid: ${invalid.join(", ")}.`] : []),
    ];
    throw new EnvError(`The API environment is incomplete. ${parts.join(" ")}`);
  }
  if (parsed.data.DEMO_MODE && parsed.data.DEMO_TOKEN === undefined) {
    throw new EnvError("The API environment is incomplete. DEMO_MODE=true requires DEMO_TOKEN.");
  }
  return parsed.data;
}

export const zetarisConfigured = (env: ApiEnv) =>
  env.ZETARIS_BASE_URL !== undefined &&
  env.ZETARIS_API_KEY !== undefined &&
  env.ZETARIS_ORG_ID !== undefined;
