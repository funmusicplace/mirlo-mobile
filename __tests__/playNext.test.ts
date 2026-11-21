import { playNextSections } from "@/scripts/playNext";
import { createMockAlbum } from "@/__mocks__/mockAlbum";
import { createMockArtist } from "@/__mocks__/mockArtist";

const release = (id: number) => createMockAlbum({ id });
const releases = (from: number, count: number) =>
  Array.from({ length: count }, (_, index) => release(from + index));
const ids = (list: AlbumProps[]) => list.map(({ id }) => id);
const finished = { id: 1 };

describe("playNextSections", () => {
  test("lists each release once, in the first section that has it, never the finished one", () => {
    const artist = createMockArtist({
      trackGroups: [release(1), release(3), release(4)],
    });
    const sections = playNextSections(finished, {
      recommended: [release(2), release(3)],
      artist,
      tagged: [
        [release(1), release(4), release(5)],
        [release(2), release(6)],
      ],
    });

    expect(sections.map(({ key, releases }) => [key, ids(releases)])).toEqual([
      ["recommended", [2, 3]],
      ["artist", [4]],
      ["similar", [5, 6]],
    ]);
    // The artist's own list carries no artist per release
    expect(sections[1].releases[0].artist).toBe(artist);
  });

  test("leaves out a section with nothing in it", () => {
    const sections = playNextSections(finished, {
      recommended: [],
      artist: createMockArtist({ trackGroups: [release(1)] }),
      tagged: [[release(7)]],
    });

    expect(sections.map(({ key }) => key)).toEqual(["similar"]);
    expect(playNextSections(finished, {})).toEqual([]);
  });

  test("leaves out releases that aren't out yet or have no date", () => {
    const now = Date.parse("2026-11-21T12:00:00Z");
    const dated = (id: number, releaseDate?: string) =>
      createMockAlbum({ id, releaseDate });
    const future = "2026-12-05T00:00:00Z";
    const today = "2026-11-21T00:00:00Z";
    const sections = playNextSections(
      finished,
      {
        recommended: [dated(2, future), dated(3), dated(4, today)],
        artist: createMockArtist({
          trackGroups: [dated(5, future), dated(6), dated(7, "2024-03-01")],
        }),
        tagged: [[dated(8, future), dated(9), dated(10, today)]],
      },
      now,
    );

    expect(sections.map(({ key, releases }) => [key, ids(releases)])).toEqual([
      ["recommended", [4]],
      ["artist", [7]],
      ["similar", [10]],
    ]);
  });

  test("reads the first three tags and stops at ten similar releases", () => {
    const sections = playNextSections(finished, {
      tagged: [releases(10, 4), releases(20, 4), releases(30, 4), [release(9)]],
    });

    expect(ids(sections[0].releases)).toEqual([
      10, 11, 12, 13, 20, 21, 22, 23, 30, 31,
    ]);
  });

  test("shows at most 20 other releases by the artist, like the web", () => {
    const sections = playNextSections(finished, {
      artist: createMockArtist({ trackGroups: releases(100, 25) }),
    });

    expect(sections[0].releases).toHaveLength(20);
  });

  test("keeps another instance's releases on it and skips the tags", () => {
    const apiRoot = "https://api.example.org";
    const sections = playNextSections(
      { id: 1, apiRoot },
      {
        recommended: [release(2)],
        artist: createMockArtist({ trackGroups: [release(1), release(3)] }),
        tagged: [[release(4)]],
      },
    );

    expect(sections.map(({ key, releases }) => [key, ids(releases)])).toEqual([
      ["recommended", [2]],
      ["artist", [3]],
    ]);
    for (const { releases: list } of sections) {
      expect(list.every((item) => item.apiRoot === apiRoot)).toBe(true);
    }
  });
});
