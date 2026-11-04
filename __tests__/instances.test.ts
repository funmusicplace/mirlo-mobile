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

  test("interleaves the pages newest first and drops a failed instance", () => {
    const merged = mergeReleases(
      [
        {
          status: "fulfilled",
          value: [release(1, "2026-11-03"), release(2, "2026-10-01")],
        },
        { status: "rejected", reason: new Error("offline") },
        { status: "fulfilled", value: [release(3, "2026-10-15")] },
      ],
      2,
    );

    expect(merged.results.map((album) => album.id)).toEqual([1, 3, 2]);
    expect(merged.hasMore).toBe(true);
  });

  test("puts undated releases first, as the API does", () => {
    const undated = release(4, null as unknown as string);
    const merged = mergeReleases(
      [
        { status: "fulfilled", value: [release(1, "2026-11-03"), undated] },
        { status: "fulfilled", value: [release(3, "2026-10-15")] },
      ],
      2,
    );

    expect(merged.results.map((album) => album.id)).toEqual([4, 1, 3]);
  });

  test("stops paging once no instance fills its page", () => {
    const merged = mergeReleases(
      [
        { status: "fulfilled", value: [release(1, "2026-11-03")] },
        { status: "fulfilled", value: [] },
      ],
      2,
    );

    expect(merged.hasMore).toBe(false);
  });

  test("fails when every instance failed", () => {
    const offline = new Error("Network request failed");

    expect(() =>
      mergeReleases([{ status: "rejected", reason: offline }], 2),
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
