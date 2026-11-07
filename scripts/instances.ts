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

// One window from every instance, merged newest first. Each instance's offset
// advances by the releases taken from its window, so the order holds across
// pages and a page is never larger than pageSize. A failed instance drops out
// unless they all failed
export function mergeReleases(
  pages: PromiseSettledResult<AlbumProps[]>[],
  skips: number[],
  pageSize: number,
): { results: AlbumProps[]; next?: number[] } {
  const windows = pages.map((page) =>
    page.status === "fulfilled" ? page.value : null,
  );
  const failed = pages.find(
    (page): page is PromiseRejectedResult => page.status === "rejected",
  );
  if (failed && windows.every((window) => window === null)) throw failed.reason;

  const candidates = windows
    .flatMap((window, source) =>
      (window ?? []).map((album) => ({ album, source })),
    )
    .sort((a, b) => releaseTime(b.album) - releaseTime(a.album));
  const taken = candidates.slice(0, pageSize);
  const next = skips.map(
    (skip, source) => skip + taken.filter((c) => c.source === source).length,
  );
  // A full window may have more behind it, a partly used one still has the rest
  const hasMore = windows.some(
    (window, source) =>
      window !== null &&
      (window.length === pageSize ||
        next[source] - skips[source] < window.length),
  );
  return {
    results: taken.map((c) => c.album),
    next: hasMore ? next : undefined,
  };
}

// Offset pages can repeat a release that moved between them, so the feed keeps
// the first copy of each
export function dedupeReleases(pages: { results: AlbumProps[] }[]) {
  const seen = new Set<string>();
  return pages.flatMap((page) =>
    page.results.filter((album) => {
      const key = `${album.apiRoot ?? ""}-${album.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  );
}
