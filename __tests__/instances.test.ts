import { createMockAlbum } from "@/__mocks__/mockAlbum";
import {
  DEFAULT_INSTANCE,
  candidateApiRoots,
  findInstance,
  mergeReleases,
  normalizeUrl,
  siteUrlFor,
} from "@/scripts/instances";

jest.mock("@/constants/api-root", () => ({
  API_ROOT: "https://api.mirlo.space",
}));

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });

const html = () =>
  new Response("<!doctype html><title>Mirlo</title>", {
    headers: { "Content-Type": "text/html" },
  });

describe("normalizeUrl", () => {
  test("trims, adds https and drops the trailing slash", () => {
    expect(normalizeUrl("  mirlo.example.org/ ")).toBe(
      "https://mirlo.example.org",
    );
    expect(normalizeUrl("http://localhost:3999/")).toBe(
      "http://localhost:3999",
    );
  });
});

describe("candidateApiRoots", () => {
  test("tries the address as typed, then its api. subdomain", () => {
    expect(candidateApiRoots("mirlo.example.org")).toEqual([
      "https://mirlo.example.org",
      "https://api.mirlo.example.org",
    ]);
  });

  test("doesn't add a second api.", () => {
    expect(candidateApiRoots("https://api.mirlo.example.org/")).toEqual([
      "https://api.mirlo.example.org",
    ]);
  });
});

describe("siteUrlFor", () => {
  test("gives the default instance mirlo.space", () => {
    expect(siteUrlFor(undefined)).toBe("https://mirlo.space");
    expect(siteUrlFor("https://api.mirlo.space")).toBe("https://mirlo.space");
  });

  test("drops the api. subdomain and any path", () => {
    expect(siteUrlFor("https://api.mirlo.example.org")).toBe(
      "https://mirlo.example.org",
    );
    expect(siteUrlFor("https://mirlo.example.org/api")).toBe(
      "https://mirlo.example.org",
    );
    expect(siteUrlFor("http://localhost:3999")).toBe("http://localhost:3999");
  });
});

describe("mergeReleases", () => {
  const release = (id: number, releaseDate: string) =>
    createMockAlbum({ id, releaseDate });

  test("takes the newest releases across sources and advances each offset by its share", () => {
    const merged = mergeReleases(
      [
        {
          status: "fulfilled",
          value: [release(1, "2026-11-03"), release(2, "2026-11-02")],
        },
        {
          status: "fulfilled",
          value: [release(3, "2026-10-15"), release(4, "2026-10-01")],
        },
      ],
      [0, 0],
      2,
    );

    expect(merged.results.map((album) => album.id)).toEqual([1, 2]);
    expect(merged.next).toEqual([2, 0]);
  });

  test("never returns more than a page", () => {
    const merged = mergeReleases(
      [
        {
          status: "fulfilled",
          value: [release(1, "2026-11-06"), release(2, "2026-11-03")],
        },
        {
          status: "fulfilled",
          value: [release(3, "2026-11-05"), release(4, "2026-11-02")],
        },
        {
          status: "fulfilled",
          value: [release(5, "2026-11-04"), release(6, "2026-11-01")],
        },
      ],
      [0, 0, 0],
      2,
    );

    expect(merged.results.map((album) => album.id)).toEqual([1, 3]);
    expect(merged.next).toEqual([1, 1, 0]);
  });

  test("puts undated releases first, as the API does", () => {
    const undated = release(4, null as unknown as string);
    const merged = mergeReleases(
      [
        { status: "fulfilled", value: [release(1, "2026-11-03"), undated] },
        { status: "fulfilled", value: [release(3, "2026-10-15")] },
      ],
      [0, 0],
      3,
    );

    expect(merged.results.map((album) => album.id)).toEqual([4, 1, 3]);
  });

  test("keeps paging while a short window has releases left", () => {
    const merged = mergeReleases(
      [
        {
          status: "fulfilled",
          value: [release(1, "2026-11-05"), release(2, "2026-10-01")],
        },
        {
          status: "fulfilled",
          value: [release(3, "2026-11-04"), release(4, "2026-11-03")],
        },
      ],
      [0, 0],
      3,
    );

    expect(merged.results.map((album) => album.id)).toEqual([1, 3, 4]);
    expect(merged.next).toEqual([1, 2]);
  });

  test("stops paging once every window is short and fully taken", () => {
    const merged = mergeReleases(
      [
        { status: "fulfilled", value: [release(1, "2026-11-03")] },
        { status: "fulfilled", value: [] },
      ],
      [20, 20],
      2,
    );

    expect(merged.results.map((album) => album.id)).toEqual([1]);
    expect(merged.next).toBeUndefined();
  });

  test("drops a failed source for the page and keeps its offset", () => {
    const merged = mergeReleases(
      [
        {
          status: "fulfilled",
          value: [release(1, "2026-11-03"), release(2, "2026-10-01")],
        },
        { status: "rejected", reason: new Error("offline") },
        { status: "fulfilled", value: [release(3, "2026-10-15")] },
      ],
      [20, 40, 20],
      2,
    );

    expect(merged.results.map((album) => album.id)).toEqual([1, 3]);
    expect(merged.next).toEqual([21, 40, 21]);
  });

  test("fails when every instance failed", () => {
    const offline = new Error("Network request failed");

    expect(() =>
      mergeReleases(
        [
          { status: "rejected", reason: offline },
          { status: "rejected", reason: new Error("timeout") },
        ],
        [0, 0],
        2,
      ),
    ).toThrow(offline);
  });
});

describe("findInstance", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test("skips an HTML answer and takes the name from the api. subdomain", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(html())
      .mockResolvedValueOnce(json({ result: { name: "Example Mirlo" } }));

    await expect(
      findInstance("mirlo.example.org", [DEFAULT_INSTANCE]),
    ).resolves.toEqual({
      apiRoot: "https://api.mirlo.example.org",
      name: "Example Mirlo",
      siteUrl: "https://mirlo.example.org",
    });
    expect((global.fetch as jest.Mock).mock.calls.map(([url]) => url)).toEqual([
      "https://mirlo.example.org/v1/instance",
      "https://api.mirlo.example.org/v1/instance",
    ]);
  });

  test("rejects an address where nothing answers like Mirlo", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(html())
      .mockRejectedValueOnce(new TypeError("Network request failed"));

    await expect(
      findInstance("example.org", [DEFAULT_INSTANCE]),
    ).rejects.toThrow("notFound");
  });

  test("rejects a source that's already in the list", async () => {
    // mirlo.space serves the API on its own domain too
    (global.fetch as jest.Mock).mockImplementation(async () =>
      json({ result: { name: "Mirlo" } }),
    );

    await expect(
      findInstance("mirlo.space", [DEFAULT_INSTANCE]),
    ).rejects.toThrow("duplicate");
  });
});
