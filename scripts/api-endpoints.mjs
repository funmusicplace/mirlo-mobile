import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";
import { isDeepStrictEqual } from "node:util";

const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "api-endpoints.json");
const DIRS = ["app", "components", "queries", "scripts", "state"];
// getMany is a GET that takes query parameters as a third argument
const METHOD_NAMES = { del: "DELETE", getMany: "GET" };
// The path group stays unset when the first argument is not a literal
const CALL =
  /api\.(getMany|get|post|put|delete|del|patch)\s*(?:<[^(]*?>)?\s*\(\s*(?:([`"'])([^`"']*)\2)?/g;

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function sourceFiles() {
  return DIRS.flatMap((dir) =>
    readdirSync(join(ROOT, dir), { recursive: true })
      .map((file) => `${dir}/${file.split(sep).join("/")}`)
      .filter(
        (file) =>
          /\.tsx?$/.test(file) &&
          !/(^|\/)(node_modules|__tests__)\//.test(file),
      ),
  );
}

function scan() {
  const routes = new Map();
  const escapes = [];

  for (const file of sourceFiles()) {
    const text = readFileSync(join(ROOT, file), "utf8");
    for (const match of text.matchAll(CALL)) {
      const [, name, , raw] = match;
      if (!raw?.startsWith("/")) {
        const line = text.slice(0, match.index).split("\n").length;
        escapes.push(`${file}:${line} api.${name}`);
        continue;
      }
      const method = METHOD_NAMES[name] ?? name.toUpperCase();
      const path = raw
        .replace(/\$\{[^}]*\}/g, "{param}")
        .split("?")[0]
        .replace(/\/$/, "");
      const route = routes.get(`${method} ${path}`) ?? {
        method,
        path,
        sources: new Set(),
      };
      route.sources.add(file);
      routes.set(`${method} ${path}`, route);
    }
  }

  const endpoints = [...routes.values()]
    .map((route) => ({ ...route, sources: [...route.sources].sort() }))
    .sort((a, b) => compare(a.path, b.path) || compare(a.method, b.method));
  return { endpoints, escapes };
}

function readCommitted() {
  try {
    return JSON.parse(readFileSync(OUT, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const mode = process.argv[2] ?? "--check";
  if (mode !== "--write" && mode !== "--check") {
    console.error("Usage: node scripts/api-endpoints.mjs [--write|--check]");
    process.exitCode = 1;
    return;
  }

  const { endpoints, escapes } = scan();
  if (escapes.length > 0) {
    console.error(
      "These calls have no string or template literal path, so they would escape api-endpoints.json:",
    );
    console.error(escapes.map((escape) => `  ${escape}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  const registry = {
    generatedBy: "scripts/api-endpoints.mjs",
    apiRoot: "https://api.mirlo.space",
    endpoints,
  };
  if (mode === "--write") {
    // The committed file has to pass prettier --check
    const { format, resolveConfig } = await import("prettier");
    const options = { ...(await resolveConfig(OUT)), filepath: OUT };
    writeFileSync(OUT, await format(JSON.stringify(registry), options));
    console.log(`Wrote api-endpoints.json (${endpoints.length} endpoints)`);
  } else if (isDeepStrictEqual(readCommitted(), registry)) {
    console.log(
      `api-endpoints.json is current (${endpoints.length} endpoints)`,
    );
  } else {
    console.error("api-endpoints.json is stale, run npm run api:endpoints");
    process.exitCode = 1;
  }
}

await main();
