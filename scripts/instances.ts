import { API_ROOT } from "@/constants/api-root";

export type Instance = { apiRoot: string; name: string; siteUrl: string };

export const DEFAULT_INSTANCE: Instance = {
  apiRoot: API_ROOT,
  name: "Mirlo",
  siteUrl: "https://mirlo.space",
};

export function normalizeUrl(input: string) {
  const url = input.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// Self-hosted APIs often sit on an api. subdomain of the site
export function candidateApiRoots(input: string) {
  const url = normalizeUrl(input);
  const withApi = url.replace(/^(https?:\/\/)(?!api\.)/i, "$1api.");
  return withApi === url ? [url] : [url, withApi];
}

export function siteUrlFor(apiRoot?: string) {
  if (!apiRoot || apiRoot === API_ROOT) return DEFAULT_INSTANCE.siteUrl;
  const origin = apiRoot.match(/^https?:\/\/[^/]+/i)?.[0] ?? apiRoot;
  return origin.replace(/^(https?:\/\/)api\./i, "$1");
}

// Rejects with "duplicate" or "notFound", the Sources screen's two messages
export async function findInstance(
  input: string,
  known: Instance[],
): Promise<Instance> {
  for (const apiRoot of candidateApiRoots(input)) {
    // An HTML page or a failed request means no Mirlo API at this address
    const name = await fetch(`${apiRoot}/v1/instance`)
      .then((res) => res.json())
      .then(
        (body) => body?.result?.name,
        () => undefined,
      );
    if (typeof name !== "string" || !name) continue;

    const siteUrl = siteUrlFor(apiRoot);
    if (known.some((i) => i.apiRoot === apiRoot || i.siteUrl === siteUrl)) {
      throw new Error("duplicate");
    }
    return { apiRoot, name, siteUrl };
  }
  throw new Error("notFound");
}

// Undated releases sort first, like the API's NULLS FIRST on a descending order
function releaseTime({ releaseDate }: AlbumProps) {
  const time = Date.parse(releaseDate ?? "");
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

// One page from every instance, newest first. A failed instance drops out
// unless they all failed
export function mergeReleases(
  pages: PromiseSettledResult<AlbumProps[]>[],
  pageSize: number,
) {
  const loaded = pages.flatMap((page) =>
    page.status === "fulfilled" ? [page.value] : [],
  );
  const failed = pages.find(
    (page): page is PromiseRejectedResult => page.status === "rejected",
  );
  if (failed && !loaded.length) throw failed.reason;

  return {
    results: loaded.flat().sort((a, b) => releaseTime(b) - releaseTime(a)),
    // Offset paging: any instance that filled its page may have more
    hasMore: loaded.some((results) => results.length === pageSize),
  };
}
