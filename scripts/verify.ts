import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fromRepo } from "@clarilot/api/files";
import { createContext, type Check, type Context } from "./lib/context";
import { v10 } from "./lib/outage-check";
import { v06, v07, v08, v09 } from "./lib/query-checks";
import { v01, v02, v03, v04, v05 } from "./lib/source-checks";

const checks: ((ctx: Context) => Promise<Check>)[] = [
  v01,
  v02,
  v03,
  v04,
  v05,
  v06,
  v07,
  v08,
  v09,
  v10,
];

async function main() {
  const ctx = await createContext(process.argv.slice(2));
  const results: Check[] = [];
  for (const run of checks) {
    const result = await run(ctx);
    results.push(result);
    process.stdout.write(
      `[${result.id}] ${result.title.padEnd(44)} ${result.status}\n        ${result.observed}\n`,
    );
  }
  await ctx.db.end({ timeout: 5 });
  const output = {
    generatedAt: new Date().toISOString(),
    zetarisConfigured: ctx.zetaris.configured,
    zetarisTransport: ctx.zetaris.transport,
    namedSqlVerified: ctx.registry.verifiedInZetaris,
    passed: results.filter((r) => r.status === "PASS").length,
    failed: results.filter((r) => r.status === "FAIL").length,
    checks: results,
  };
  const file = fromRepo("evidence/verification.json");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(output, null, 2)}\n`);
  process.stdout.write(
    `\n${String(output.passed)} passed, ${String(output.failed)} failed. Wrote evidence/verification.json\n`,
  );
  process.exitCode = output.failed > 0 ? 1 : 0;
}

await main();
