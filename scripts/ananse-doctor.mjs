#!/usr/bin/env node
/**
 * Ananse DX doctor — quick environment + data checks.
 *
 *   node scripts/ananse-doctor.mjs
 *   node scripts/ananse-doctor.mjs --data ./people.json
 *   pnpm doctor
 */

import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
const dataIdx = args.indexOf("--data");
const dataPath = dataIdx >= 0 ? args[dataIdx + 1] : null;

let failed = 0;
function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function warn(msg) {
  console.log(`  ⚠ ${msg}`);
}
function bad(msg) {
  console.log(`  ✗ ${msg}`);
  failed += 1;
}

console.log("\nAnanse doctor\n");

// Packages present
for (const pkg of ["@ananse/core", "@ananse/react", "@ananse/tokens"]) {
  const p = join(root, "packages", pkg.replace("@ananse/", ""), "package.json");
  if (existsSync(p)) ok(`${pkg} package found`);
  else bad(`${pkg} package missing at ${p}`);
}

// Built dist?
for (const name of ["core", "react"]) {
  const dist = join(root, "packages", name, "dist", "index.js");
  if (existsSync(dist)) ok(`@ananse/${name} dist built`);
  else warn(`@ananse/${name} not built — run: pnpm build`);
}

// Node version
const major = Number(process.versions.node.split(".")[0]);
if (major >= 18) ok(`Node ${process.versions.node}`);
else bad(`Node ${process.versions.node} — need >= 18 (20+ recommended)`);

// Optional data check
if (dataPath) {
  try {
    const raw = JSON.parse(readFileSync(dataPath, "utf8"));
    const { loadOrg, formatLoadOrgErrors } = await import(
      join(root, "packages/core/dist/index.js")
    ).catch(async () => {
      // try source via vitest-less dynamic — fall back message
      throw new Error("Build @ananse/core first: pnpm --filter=@ananse/core build");
    });
    const result = loadOrg({ type: "employees", data: raw });
    if (result.ok) {
      ok(`Data OK — ${result.employees.length} people from ${dataPath}`);
      for (const w of result.warnings.slice(0, 5)) warn(w);
    } else {
      bad(`Data issues in ${dataPath}:\n${formatLoadOrgErrors(result)}`);
    }
  } catch (err) {
    bad(err instanceof Error ? err.message : String(err));
  }
}

console.log(
  failed === 0
    ? '\nAll clear. Quickstart:\n\n  import { OrgChart } from "@ananse/react";\n  <OrgChart defaultData={people} height="100vh" showSearch />\n'
    : `\n${failed} issue(s) found.\n`,
);
process.exit(failed === 0 ? 0 : 1);
