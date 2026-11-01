import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { sourceIdSchema } from "@clarilot/core";
import { z } from "zod";

const entrySchema = z.object({
  name: z.string().regex(/^[a-z][a-z_]*$/),
  file: z.string().regex(/^[a-z][a-z_]*\.sql$/),
  kind: z.enum(["select", "metadata"]),
  sourceIds: z.array(sourceIdSchema),
  sourceNames: z.array(z.string()),
});

const manifestSchema = z.object({
  verifiedInZetaris: z.boolean(),
  queries: z.array(entrySchema).min(1),
});

export type NamedQuery = z.infer<typeof entrySchema> & { sql: string; sha256: string };

export type SqlRegistry = {
  verifiedInZetaris: boolean;
  names(): string[];
  get(name: string): NamedQuery;
};

export class RegistryError extends Error {
  readonly code: "UNKNOWN_QUERY" | "NOT_READ_ONLY";

  constructor(code: "UNKNOWN_QUERY" | "NOT_READ_ONLY", message: string) {
    super(message);
    this.name = "RegistryError";
    this.code = code;
  }
}

const allowedMetadata = new Set([
  "SHOW SERVER VERSION",
  "SHOW DATASOURCES",
  "SHOW LIGHTNING DATABASES",
]);

const mutating =
  /\b(insert|update|delete|merge|upsert|create|drop|alter|grant|revoke|truncate|register|cache|uncache|refresh|assign|activate|compile|set|call|exec|execute|copy|load|run)\b/i;

const withoutLiterals = (sql: string) =>
  sql.replace(/'(?:[^']|'')*'/g, "''").replace(/"(?:[^"])*"/g, '""');

export function assertReadOnly(name: string, kind: "select" | "metadata", sql: string): void {
  const text = sql.trim();
  if (kind === "metadata") {
    if (!allowedMetadata.has(text.toUpperCase())) {
      throw new RegistryError("NOT_READ_ONLY", `${name} is not an allowlisted metadata command`);
    }
    return;
  }
  const scanned = withoutLiterals(text);
  if (!/^(select|with)\b/i.test(scanned)) {
    throw new RegistryError("NOT_READ_ONLY", `${name} must start with SELECT or WITH`);
  }
  if (scanned.includes(";")) {
    throw new RegistryError("NOT_READ_ONLY", `${name} must be a single statement`);
  }
  const hit = mutating.exec(scanned);
  if (hit !== null) {
    throw new RegistryError(
      "NOT_READ_ONLY",
      `${name} contains the keyword ${hit[0].toUpperCase()}`,
    );
  }
}

export function createRegistry(
  verifiedInZetaris: boolean,
  queries: readonly NamedQuery[],
): SqlRegistry {
  const byName = new Map(queries.map((query) => [query.name, query]));
  for (const query of queries) {
    assertReadOnly(query.name, query.kind, query.sql);
  }
  return {
    verifiedInZetaris,
    names: () => [...byName.keys()],
    get(name) {
      const query = byName.get(name);
      if (query === undefined) {
        throw new RegistryError("UNKNOWN_QUERY", `No named query called ${name}`);
      }
      return query;
    },
  };
}

export async function loadRegistry(directory: string): Promise<SqlRegistry> {
  const manifest = manifestSchema.parse(
    JSON.parse(await readFile(path.join(directory, "registry.json"), "utf8")),
  );
  const queries = await Promise.all(
    manifest.queries.map(async (entry) => {
      const sql = (await readFile(path.join(directory, entry.file), "utf8")).trim();
      return { ...entry, sql, sha256: createHash("sha256").update(sql).digest("hex") };
    }),
  );
  return createRegistry(manifest.verifiedInZetaris, queries);
}
