import { readFile } from "node:fs/promises";
import { fromRepo, loadDemoCases } from "@clarilot/api/files";
import { ndcParseStatus, normalizeProductNdc } from "@clarilot/core";
import { z } from "zod";
import {
  caseKeys,
  check,
  describe,
  runNamed,
  runQuery,
  zetarisMissing,
  type Check,
  type Context,
} from "./context";

const sourceObjects = [
  "pharmacy_pg.dispensing",
  "fda.recalls_by_ndc",
  "fda.shortages_by_ndc",
  "lots_files.receiving_lots",
];

export async function v06(ctx: Context): Promise<Check> {
  const sql = ctx.registry.get("alerts_master").sql;
  const absent = sourceObjects.filter((name) => !sql.includes(name));
  const base = {
    id: "V-06",
    title: "Four-source SQL parses and returns rows",
    source: "sql/named/alerts_master.sql",
    expected: `one statement referencing ${sourceObjects.join(", ")} returns at least one row`,
    evidencePath: "sql/named/alerts_master.sql",
  };
  const missing = zetarisMissing(ctx);
  if (missing !== null || absent.length > 0) {
    return check({
      ...base,
      status: "FAIL",
      observed:
        absent.length > 0
          ? `SQL lacks ${absent.join(", ")}`
          : `SQL references all four sources; ${missing ?? ""}`,
    });
  }
  const ran = await runNamed(ctx, "alerts_master");
  const keys = caseKeys(ran.outcome);
  return check({
    ...base,
    status: keys.length > 0 ? "PASS" : "FAIL",
    observed: ran.outcome.ok
      ? `${describe(ran.outcome)}, ${String(keys.length)} unique case keys`
      : describe(ran.outcome),
    queryId: ran.queryId,
  });
}

export async function v07(ctx: Context): Promise<Check> {
  const exportPath = "evidence/jdbc-case-ids.json";
  const base = {
    id: "V-07",
    title: "Independent JDBC client and backend same case IDs",
    source: "alerts_master",
    expected: `case keys from the same SQL run over Zetaris JDBC, saved to ${exportPath}, equal the backend REST run`,
    evidencePath: exportPath,
  };
  const exported = await readFile(fromRepo(exportPath), "utf8").then(
    (text) => z.array(z.string()).safeParse(JSON.parse(text)),
    () => null,
  );
  const missing = zetarisMissing(ctx);
  if (missing !== null || exported === null || !exported.success) {
    return check({
      ...base,
      status: "FAIL",
      observed: [
        exported === null
          ? `${exportPath} does not exist`
          : exported.success
            ? ""
            : `${exportPath} is not a JSON string array`,
        missing ?? "",
      ]
        .filter(Boolean)
        .join("; "),
    });
  }
  const ran = await runNamed(ctx, "alerts_master");
  const keys = caseKeys(ran.outcome);
  const jdbc = [...new Set(exported.data)].sort();
  const same = JSON.stringify(keys) === JSON.stringify(jdbc);
  return check({
    ...base,
    status: ran.outcome.ok && same ? "PASS" : "FAIL",
    observed: `backend ${String(keys.length)} keys, JDBC ${String(jdbc.length)} keys, identical: ${String(same)}`,
    queryId: ran.queryId,
  });
}

export async function v08(ctx: Context): Promise<Check> {
  const [demo] = await loadDemoCases();
  const expectedKey =
    demo === undefined ? "none" : `${demo.recallNumber}:${String(demo.dispenseId)}`;
  const base = {
    id: "V-08",
    title: "Source INSERT increases unique case IDs",
    source: "pharmacy_pg.dispensing",
    expected: `after one committed INSERT the same SQL gains exactly ${expectedKey}`,
  };
  const missing = zetarisMissing(ctx);
  if (missing !== null || demo === undefined) {
    return check({
      ...base,
      status: "FAIL",
      observed: `${missing ?? "no allowlisted demo case"}; no row was inserted`,
    });
  }
  await ctx.db`delete from dispensing where dispense_id = ${demo.dispenseId}`;
  const before = await runNamed(ctx, "alerts_master");
  const parsed = normalizeProductNdc(demo.productNdcRaw);
  await ctx.db`
    insert into dispensing (dispense_id, rx_id, patient_id, store_id, product_ndc_raw, product_ndc_key, ndc_parse_status, lot_no, qty, dispensed_at, synthetic)
    values (${demo.dispenseId}, ${demo.rxId}, ${demo.patientId}, ${demo.storeId}, ${demo.productNdcRaw}, ${parsed.ok ? parsed.productKey : null}, ${ndcParseStatus(parsed)}, ${demo.lotNo}, ${demo.qty}, now(), true)`;
  const after = await runNamed(ctx, "alerts_master");
  await ctx.db`delete from dispensing where dispense_id = ${demo.dispenseId}`;
  const added = caseKeys(after.outcome).filter((key) => !caseKeys(before.outcome).includes(key));
  const ok =
    before.outcome.ok &&
    after.outcome.ok &&
    JSON.stringify(added) === JSON.stringify([expectedKey]);
  return check({
    ...base,
    status: ok ? "PASS" : "FAIL",
    observed: `before ${describe(before.outcome)}, after ${describe(after.outcome)}, new keys [${added.join(", ")}]; demo row removed afterwards`,
    queryId: after.queryId,
  });
}

export async function v09(ctx: Context): Promise<Check> {
  const base = {
    id: "V-09",
    title: "No unauthorized writer permission",
    source: "zetaris principal",
    expected: `a CREATE attempted as ${ctx.zetaris.principal ?? "the runtime principal"} is refused`,
  };
  const missing = zetarisMissing(ctx);
  if (missing !== null) {
    return check({ ...base, status: "FAIL", observed: missing });
  }
  const probe = {
    name: "v09_write_probe",
    file: "none",
    kind: "select" as const,
    sourceIds: [],
    sourceNames: [],
    sql: 'CREATE LIGHTNING DATABASE CLARILOT_V09_PROBE DESCRIBE BY "write probe"',
    sha256: "",
  };
  const ran = await runQuery(ctx, probe);
  return check({
    ...base,
    status: ran.outcome.ok ? "FAIL" : "PASS",
    observed: ran.outcome.ok
      ? "CREATE succeeded: the runtime principal can write (drop CLARILOT_V09_PROBE as admin)"
      : `refused: ${describe(ran.outcome)}`,
    queryId: ran.queryId,
  });
}
