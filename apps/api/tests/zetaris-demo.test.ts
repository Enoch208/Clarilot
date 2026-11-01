import { demoCasesResponseSchema, featuredRecallsResponseSchema } from "@clarilot/core";
import { describe, expect, it } from "vitest";
import { fromRepo } from "../src/files";
import { loadRegistry } from "../src/sql/registry";
import { httpZetaris } from "../src/zetaris/client";
import { call, testDeps } from "./support/fakes";

const token = { "x-demo-token": "test-demo-token-0123456789" };

describe("demo controls", () => {
  it("refuse without the token and accept only allowlisted cases", async () => {
    const { app } = await testDeps();
    expect(
      (await call(app, "POST", "/api/demo/insert-case", { demoCaseId: "insert-exact-lot" })).status,
    ).toBe(403);
    const unknown = await call(
      app,
      "POST",
      "/api/demo/insert-case",
      { demoCaseId: "drop-table" },
      token,
    );
    expect(unknown).toMatchObject({ status: 404, body: { code: "UNKNOWN_DEMO_CASE" } });
    const first = await call(
      app,
      "POST",
      "/api/demo/insert-case",
      { demoCaseId: "insert-exact-lot" },
      token,
    );
    const second = await call(
      app,
      "POST",
      "/api/demo/insert-case",
      { demoCaseId: "insert-exact-lot" },
      token,
    );
    expect(first.body).toMatchObject({ inserted: true, dispenseId: 900001 });
    expect(second.body).toMatchObject({ inserted: false });
    const cases = demoCasesResponseSchema.parse((await call(app, "GET", "/api/demo/cases")).body);
    expect(cases.cases[0]?.inserted).toBe(true);
    const reset = await call(app, "POST", "/api/demo/reset", undefined, token);
    expect(reset.body).toMatchObject({ removedDispenseIds: [900001] });
  });

  it("are unreachable when demo mode is off", async () => {
    const { app } = await testDeps({ demo: { enabled: false, token: null } });
    const reply = await call(app, "POST", "/api/demo/reset", undefined, token);
    expect(reply).toMatchObject({ status: 404, body: { code: "DEMO_DISABLED" } });
    expect((await call(app, "GET", "/api/demo/cases")).body).toEqual({
      demoMode: false,
      cases: [],
    });
  });
});

describe("featured recalls", () => {
  it("serves the selected real recall records with their fetch timestamps", async () => {
    const { app } = await testDeps();
    const body = featuredRecallsResponseSchema.parse(
      (await call(app, "GET", "/api/recalls/featured")).body,
    );
    expect(body.recalls.map((r) => r.recallNumber)).toEqual([
      "D-0038-2027",
      "D-0042-2027",
      "D-0788-2026",
    ]);
    expect(
      body.recalls.every((r) => r.permalink.includes(encodeURIComponent(r.recallNumber))),
    ).toBe(true);
    expect(body.shortageOverlap.found).toBe(true);
  });
});

describe("Zetaris HTTP transport", () => {
  const options = {
    baseUrl: "http://zetaris.test",
    apiKey: "secret-key",
    orgId: "1",
    transport: "UI_PROXY" as const,
    principal: "reader",
    timeoutMs: 1_000,
    rowLimit: 10,
  };

  it("sends one named statement to the UI proxy route and zips header rows", async () => {
    const registry = await loadRegistry(fromRepo("sql/named"));
    const seen: { url: string; init: RequestInit | undefined }[] = [];
    const client = httpZetaris({
      ...options,
      fetch: (url, init) => {
        seen.push({ url: url instanceof Request ? url.url : url.toString(), init });
        return Promise.resolve(Response.json({ headers: [{ name: "one" }], data: [["1"]] }));
      },
    });
    const outcome = await client.run(registry.get("select_one"), "q");
    expect(outcome).toMatchObject({ ok: true, rows: [{ one: "1" }] });
    expect(seen[0]?.url).toBe("http://zetaris.test/api/proxy/sql-editor/sqls/run-query");
    expect(
      JSON.parse(typeof seen[0]?.init?.body === "string" ? seen[0].init.body : "null"),
    ).toEqual({ sql: "SELECT 1 AS one", limit: 10 });
  });

  it("maps 401 to ACCESS_DENIED and an unknown shape to SOURCE_UNAVAILABLE", async () => {
    const registry = await loadRegistry(fromRepo("sql/named"));
    const denied = httpZetaris({
      ...options,
      fetch: () => Promise.resolve(new Response("no", { status: 401 })),
    });
    expect(await denied.run(registry.get("select_one"), "q")).toMatchObject({
      ok: false,
      state: "ACCESS_DENIED",
    });
    const odd = httpZetaris({
      ...options,
      fetch: () => Promise.resolve(Response.json({ rows: [] })),
    });
    expect(await odd.run(registry.get("select_one"), "q")).toMatchObject({
      ok: false,
      state: "SOURCE_UNAVAILABLE",
      errorCode: "ZETARIS_UNEXPECTED_RESPONSE",
    });
  });
});
