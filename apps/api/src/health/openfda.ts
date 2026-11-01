import { openFdaMetaResponseSchema, type FeedHealth } from "@clarilot/core";
import { sanitize } from "../http/errors";
import { recallSearch } from "./scope";

export type Feed = "recalls" | "shortages";

export type FeedProbe = {
  probe(feed: Feed): Promise<FeedHealth>;
};

export type OpenFdaOptions = {
  baseUrl: string;
  userAgent: string;
  apiKey: string | undefined;
  fetch: typeof fetch;
  now: () => Date;
  cacheMs: number;
};

const paths: Record<Feed, string> = {
  recalls: `/drug/enforcement.json?search=${encodeURIComponent(recallSearch)}&limit=1`,
  shortages: "/drug/shortages.json?limit=1",
};

export function openFdaProbe(options: OpenFdaOptions): FeedProbe {
  const cache = new Map<Feed, { value: FeedHealth; expires: number }>();
  return {
    async probe(feed) {
      const now = options.now();
      const endpoint = `${options.baseUrl}${paths[feed]}`;
      const cached = cache.get(feed);
      if (cached !== undefined && cached.expires > now.getTime()) {
        return {
          ...cached.value,
          checkedAt: now.toISOString(),
          detail: `openFDA metadata fetched at ${cached.value.fetchedAt ?? "unknown"}, reused for up to ${String(Math.round(options.cacheMs / 60_000))} minutes`,
        };
      }
      const started = Date.now();
      const keyed =
        options.apiKey === undefined
          ? endpoint
          : `${endpoint}&api_key=${encodeURIComponent(options.apiKey)}`;
      const unavailable = (detail: string): FeedHealth => ({
        status: "UNAVAILABLE",
        checkedAt: now.toISOString(),
        latencyMs: Date.now() - started,
        detail,
        endpoint,
        sourcePublishedAt: null,
        fetchedAt: null,
        totalRecords: null,
      });
      let response: Response;
      try {
        response = await options.fetch(keyed, {
          headers: { "user-agent": options.userAgent, accept: "application/json" },
          signal: AbortSignal.timeout(10_000),
        });
      } catch (error) {
        return unavailable(
          `openFDA could not be reached: ${sanitize(error instanceof Error ? error.message : "network error")}`,
        );
      }
      if (!response.ok) {
        return unavailable(`openFDA answered HTTP ${String(response.status)}`);
      }
      const parsed = openFdaMetaResponseSchema.safeParse(await response.json());
      if (!parsed.success) {
        return unavailable("openFDA answered without the expected meta block");
      }
      const fetchedAt = options.now().toISOString();
      const value: FeedHealth = {
        status: "OK",
        checkedAt: fetchedAt,
        latencyMs: Date.now() - started,
        detail: `openFDA metadata fetched at ${fetchedAt}`,
        endpoint,
        sourcePublishedAt: parsed.data.meta.last_updated,
        fetchedAt,
        totalRecords: parsed.data.meta.results?.total ?? null,
      };
      cache.set(feed, { value, expires: now.getTime() + options.cacheMs });
      return value;
    },
  };
}
