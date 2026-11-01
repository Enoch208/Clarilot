import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, ".vercel", "output");
const api = path.join(output, "functions", "api.func");
const dataFiles = [
  "seed/recalls_used.json",
  "seed/fixtures.json",
  "seed/receiving_lots.csv",
  "sql/named",
];

const functionConfig = {
  runtime: "nodejs22.x",
  handler: "index.mjs",
  launcherType: "Nodejs",
  shouldAddHelpers: false,
  maxDuration: 60,
};

const routes = {
  version: 3,
  routes: [
    { src: "^/api(?:/.*)?$", dest: "/api" },
    { handle: "filesystem" },
    { src: "^/assets/.*$", status: 404 },
    { src: "^/.*$", dest: "/index.html" },
  ],
};

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

await rm(output, { recursive: true, force: true });
await mkdir(api, { recursive: true });
await cp(path.join(root, "apps/web/dist"), path.join(output, "static"), { recursive: true });
await build({
  entryPoints: [path.join(root, "apps/api/src/vercel.ts")],
  outfile: path.join(api, "index.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
  logLevel: "warning",
});
for (const file of dataFiles) {
  await cp(path.join(root, file), path.join(api, file), { recursive: true });
}
await writeFile(path.join(api, ".vc-config.json"), json(functionConfig));
await writeFile(path.join(output, "config.json"), json(routes));
process.stdout.write(`Vercel build output written to ${path.relative(root, output)}\n`);
