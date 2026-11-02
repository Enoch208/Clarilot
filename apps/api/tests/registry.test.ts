import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fromRepo } from "../src/files";
import { assertReadOnly, createRegistry, loadRegistry, RegistryError } from "../src/sql/registry";

const query = (name: string, sql: string, kind: "select" | "metadata" = "select") => ({
  name,
  file: `${name}.sql`,
  kind,
  sourceIds: [],
  sourceNames: [],
  sql,
  sha256: "0".repeat(64),
});

describe("U-11 named-query allowlist", () => {
  it("loads every committed named query as read-only and only marks it verified on recorded passes", async () => {
    const registry = await loadRegistry(fromRepo("sql/named"));
    expect(registry.names()).toContain("alerts_master");
    const recorded = z
      .object({ checks: z.array(z.object({ id: z.string(), status: z.string() })) })
      .parse(JSON.parse(await readFile(fromRepo("evidence/verification.json"), "utf8")));
    const passed = ["V-06", "V-07", "V-08"].every((id) =>
      recorded.checks.some((c) => c.id === id && c.status === "PASS"),
    );
    expect(registry.verifiedInZetaris).toBe(passed);
    expect(registry.get("alerts_master").sourceIds).toEqual([
      "pharmacy_pg",
      "fda_recalls",
      "fda_shortages",
      "receiving_csv",
    ]);
  });

  it("refuses a query name that is not registered", async () => {
    const registry = await loadRegistry(fromRepo("sql/named"));
    expect(() => registry.get("drop_everything")).toThrow(RegistryError);
    expect(() => registry.get("SELECT * FROM pharmacy_pg.patients")).toThrow(/No named query/);
  });

  it.each([
    ["INSERT INTO pharmacy_pg.dispensing VALUES (1)"],
    ["DELETE FROM pharmacy_pg.dispensing"],
    ["WITH x AS (SELECT 1) UPDATE pharmacy_pg.dispensing SET qty = 1"],
    ["SELECT 1; DROP TABLE pharmacy_pg.dispensing"],
    ["CREATE DATASOURCE evil OPTIONS (x 'y')"],
    ["SELECT * FROM t WHERE x = 1 UNION SELECT * FROM t; GRANT SELECT ON ALL TO USER 'x'"],
  ])("refuses a mutation or DDL statement: %s", (sql) => {
    expect(() => {
      assertReadOnly("bad", "select", sql);
    }).toThrow(RegistryError);
    expect(() => createRegistry(false, [query("bad", sql)])).toThrow(/bad/);
  });

  it("refuses metadata commands that are not explicitly allowlisted", () => {
    expect(() => {
      assertReadOnly("meta", "metadata", "SHOW SERVER VERSION");
    }).not.toThrow();
    expect(() => {
      assertReadOnly("meta", "metadata", "SHOW USERS");
    }).toThrow(RegistryError);
    expect(() => {
      assertReadOnly("meta", "metadata", "RUN DQ x TABLE y");
    }).toThrow(RegistryError);
  });

  it("does not mistake a keyword inside a string literal or identifier for a mutation", () => {
    expect(() => {
      assertReadOnly("ok", "select", "SELECT update_date FROM t WHERE note = 'please delete me'");
    }).not.toThrow();
  });
});
