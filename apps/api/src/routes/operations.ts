import { demoInsertBodySchema, demoTokenHeader, quarantineQuerySchema } from "@clarilot/core";
import { Hono } from "hono";
import type { AppDeps } from "../deps";
import { jsonBody, parseWith } from "../http/parse";
import { insertDemoCase, listDemoCases, requireDemo, resetDemo } from "../operations/demo";
import { quarantine } from "../operations/quarantine";

export function operationRoutes(deps: AppDeps) {
  return new Hono()
    .get("/quarantine", async (c) => {
      const query = parseWith(quarantineQuerySchema, c.req.query());
      const body = await quarantine(deps, query.rule);
      return c.json(body, body.status === "SOURCE_UNAVAILABLE" ? 503 : 200);
    })
    .get("/demo/cases", async (c) => c.json(await listDemoCases(deps)))
    .post("/demo/insert-case", async (c) => {
      requireDemo(deps, c.req.header(demoTokenHeader));
      const body = parseWith(demoInsertBodySchema, await jsonBody(c));
      return c.json(await insertDemoCase(deps, body.demoCaseId));
    })
    .post("/demo/reset", async (c) => {
      requireDemo(deps, c.req.header(demoTokenHeader));
      return c.json(await resetDemo(deps));
    });
}
