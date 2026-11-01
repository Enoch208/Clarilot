import { Hono } from "hono";
import type { AppDeps } from "../deps";
import { checkHealth } from "../health/service";
import { describeSources, featuredRecalls, freshness } from "../status/service";

export function statusRoutes(deps: AppDeps) {
  return new Hono()
    .get("/health", async (c) => c.json(await checkHealth(deps)))
    .get("/sources", async (c) => c.json(await describeSources(deps)))
    .get("/freshness", async (c) => c.json(await freshness(deps)))
    .get("/recalls/featured", (c) => c.json(featuredRecalls(deps)));
}
