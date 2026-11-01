import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const repoRoot = path.resolve(import.meta.dirname, "..", "..");
export const rawDir = path.join(repoRoot, "evidence", "raw");
export const openFdaBase = "https://api.fda.gov";

const userAgent = process.env.OPENFDA_USER_AGENT ?? "ClarilotDemo/1.0";

export type Fetched = { url: string; fetchedAt: string; status: number; body: unknown };

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function compactDate(date: Date): string {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

export async function fetchOpenFda(url: string, saveAs: string): Promise<Fetched> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await fetch(url, {
      headers: { "user-agent": userAgent, accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    });
    const fetchedAt = new Date().toISOString();
    if ((response.status === 429 || response.status >= 500) && attempt === 1) {
      await pause(2_000);
      continue;
    }
    const body: unknown = await response.json();
    await mkdir(rawDir, { recursive: true });
    const record = { url, fetchedAt, status: response.status, body };
    await writeFile(path.join(rawDir, saveAs), `${JSON.stringify(record, null, 2)}\n`);
    return record;
  }
  throw new Error(`openFDA did not answer ${url} after one retry`);
}

export type Page<T> = {
  meta: { last_updated: string; results?: { total: number } | undefined };
  results: T[];
};

export type Paginated<T> = {
  records: T[];
  total: number;
  pages: number;
  lastUpdated: string;
  fetchedAt: string;
};

export async function paginate<T>(
  urlFor: (skip: number) => string,
  pageSize: number,
  saveAs: (page: number) => string,
  parse: (body: unknown) => Page<T>,
): Promise<Paginated<T>> {
  const records: T[] = [];
  const seen: { total: number; lastUpdated: string; fetchedAt: string }[] = [];
  for (let skip = 0; skip < 25_000; skip += pageSize) {
    const page = await fetchOpenFda(urlFor(skip), saveAs(seen.length));
    const parsed = parse(page.body);
    records.push(...parsed.results);
    const total = parsed.meta.results?.total ?? parsed.results.length;
    seen.push({ total, lastUpdated: parsed.meta.last_updated, fetchedAt: page.fetchedAt });
    if (records.length >= total || parsed.results.length === 0) {
      break;
    }
  }
  const first = seen[0];
  if (first === undefined) {
    throw new Error("openFDA pagination returned no pages");
  }
  return { records, pages: seen.length, ...first };
}
