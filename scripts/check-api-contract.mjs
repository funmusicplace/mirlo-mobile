/* global AbortSignal */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REGISTRY = join(import.meta.dirname, "..", "api-endpoints.json");
const METHODS = ["get", "put", "post", "delete", "options", "head", "patch"];

async function send(method, url, init) {
  try {
    return await fetch(url, {
      method,
      signal: AbortSignal.timeout(15_000),
      ...init,
    });
  } catch (error) {
    const reason = error.cause?.message || error.cause?.code || error.message;
    throw new Error(`${method} ${url} failed: ${reason}`);
  }
}

async function documentedRoutes(apiRoot) {
  const url = `${apiRoot}/v1/api-docs`;
  const res = await send("GET", url);
  if (!res.ok) throw new Error(`GET ${url} returned ${res.status}`);
  const doc = await res.json().catch(() => null);
  if (!doc?.paths) throw new Error(`${url} is not a Swagger document`);

  const routes = new Set();
  for (const [path, item] of Object.entries(doc.paths)) {
    const route = path.replace(/\{[^}]*\}/g, "{param}");
    for (const method of METHODS.filter((name) => name in item)) {
      routes.add(`${method.toUpperCase()} ${route}`);
    }
  }
  return { routes, pathCount: Object.keys(doc.paths).length };
}

async function probe(method, url) {
  const res = await send(method, url, {
    redirect: "manual",
    // Handlers that read req.body answer 500 when it is undefined
    ...(["POST", "PUT", "PATCH"].includes(method) && {
      body: "{}",
      headers: { "content-type": "application/json" },
    }),
  });
  // Unknown paths outside /v1 answer 200 with the web app's index.html
  const isWebApp =
    res.status === 200 &&
    res.headers.get("content-type")?.includes("text/html");
  return {
    present: res.status !== 404 && res.status !== 405 && !isWebApp,
    note: `probe ${res.status}${isWebApp ? " text/html" : ""}`,
  };
}

async function check({ method, path }, routes, apiRoot) {
  const isV1 = path.startsWith("/v1/");
  // The document omits the /v1 prefix, so match both forms
  const names = [path.slice(3), path];
  if (isV1 && names.some((name) => routes.has(`${method} ${name}`))) {
    return { present: true };
  }
  // Probe the auth routes (mounted outside the document) and GET routes it
  // lacks (it lists /tracks without operations), but never write methods in /v1
  if (isV1 && method !== "GET") return { present: false };
  return probe(method, `${apiRoot}${path}`);
}

async function main() {
  const registry = JSON.parse(readFileSync(REGISTRY, "utf8"));
  const apiRoot = process.env.API_ROOT || registry.apiRoot;
  const { routes, pathCount } = await documentedRoutes(apiRoot);

  const missing = [];
  for (const endpoint of registry.endpoints) {
    const { present, note } = await check(endpoint, routes, apiRoot);
    const label = (present ? "ok" : "MISSING").padEnd(7);
    const suffix = note ? ` (${note})` : "";
    console.log(`${label} ${endpoint.method} ${endpoint.path}${suffix}`);
    if (!present) missing.push(endpoint);
  }

  const total = registry.endpoints.length;
  console.log(
    `\nChecked ${total} routes against ${pathCount} documented paths at ${apiRoot}`,
  );
  if (missing.length > 0) {
    console.error(`\n${missing.length} missing from the live API:`);
    for (const { method, path, sources } of missing) {
      console.error(`  ${method} ${path} (used by ${sources.join(", ")})`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`API contract check could not run: ${error.message}`);
  process.exitCode = 1;
});
