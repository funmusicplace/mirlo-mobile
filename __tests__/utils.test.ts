import {
  audioTrackType,
  isTrackOwned,
  isTrackOwnedOrPreview,
  pickFeaturedTrack,
} from "@/scripts/utils";
import { createMockUser } from "@/__mocks__/mockUser";
import { createMockRNTrack } from "@/__mocks__/mockRNTrack";
import { createMockAlbum } from "@/__mocks__/mockAlbum";

describe("audioTrackType", () => {
  test("returns 'hls' for .m3u8 URLs", () => {
    expect(audioTrackType("/v1/tracks/123/stream/playlist.m3u8")).toBe("hls");
    expect(audioTrackType("https://api.mirlo.space/v1/tracks/1/x.m3u8")).toBe(
      "hls",
    );
  });

  test("returns 'dash' for .mpd URLs", () => {
    expect(audioTrackType("https://example.com/manifest.mpd")).toBe("dash");
  });

  test("returns 'default' for everything else", () => {
    expect(audioTrackType("https://example.com/track.mp3")).toBe("default");
    expect(audioTrackType("https://example.com/track.flac")).toBe("default");
    expect(audioTrackType("file:///local/path.wav")).toBe("default");
    expect(audioTrackType("")).toBe("default");
  });

  test("is case-sensitive on the extension (matches what the server actually sends)", () => {
    // server sends lowercase; uppercase shouldn't trigger HLS
    expect(audioTrackType("https://example.com/PLAYLIST.M3U8")).toBe("default");
  });
});

describe("isTrackOwned", () => {
  test("returns false when user is not logged in", () => {
    const track = createMockRNTrack();
    expect(isTrackOwned(track, undefined, null)).toBe(false);
    expect(isTrackOwned(track, undefined, undefined)).toBe(false);
  });

  test("returns true when user owns the track group (artist match)", () => {
    const user = createMockUser({ id: 42 });
    const track = createMockRNTrack({
      trackGroup: {
        ...createMockRNTrack().trackGroup,
        artistId: 42,
      },
    });
    expect(isTrackOwned(track, undefined, user)).toBe(true);
  });

  test("returns true when user has purchased the track group", () => {
    const user = createMockUser({ id: 7 });
    const track = createMockRNTrack({
      trackGroup: {
        ...createMockRNTrack().trackGroup,
        artistId: 999,
        userTrackGroupPurchases: [{ userId: 7 }],
      },
    });
    expect(isTrackOwned(track, undefined, user)).toBe(true);
  });

  test("returns false when user neither owns nor purchased", () => {
    const user = createMockUser({ id: 1 });
    const track = createMockRNTrack({
      trackGroup: {
        ...createMockRNTrack().trackGroup,
        artistId: 999,
        userTrackGroupPurchases: [{ userId: 2 }, { userId: 3 }],
      },
    });
    expect(isTrackOwned(track, undefined, user)).toBe(false);
  });

  test("returns false on null track", () => {
    const user = createMockUser();
    // @ts-expect-error - validating defensive check
    expect(isTrackOwned(null, undefined, user)).toBe(false);
  });
});

describe("isTrackOwnedOrPreview", () => {
  test("returns true for any preview track (regardless of user state)", () => {
    const track = createMockRNTrack({ isPreview: true });
    expect(isTrackOwnedOrPreview(track)).toBe(true);
    expect(isTrackOwnedOrPreview(track, undefined)).toBe(true);
    expect(isTrackOwnedOrPreview(track, null)).toBe(true);
    expect(isTrackOwnedOrPreview(track, createMockUser())).toBe(true);
  });

  test("non-preview unreleased track is never playable", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const track = createMockRNTrack({ isPreview: false });
    const trackGroup = {
      ...track.trackGroup,
      releaseDate: future,
    };
    const user = createMockUser({ id: trackGroup.artistId });
    expect(isTrackOwnedOrPreview(track, user, trackGroup)).toBe(false);
  });

  test("non-preview released track is playable when user owns it", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const track = createMockRNTrack({ isPreview: false });
    const trackGroup = {
      ...track.trackGroup,
      releaseDate: past,
      artistId: 42,
    };
    const user = createMockUser({ id: 42 });
    expect(isTrackOwnedOrPreview(track, user, trackGroup)).toBe(true);
  });

  test("non-preview released track is NOT playable for an anonymous user", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const track = createMockRNTrack({ isPreview: false });
    const trackGroup = {
      ...track.trackGroup,
      releaseDate: past,
    };
    expect(isTrackOwnedOrPreview(track, null, trackGroup)).toBe(false);
  });
});

describe("pickFeaturedTrack", () => {
  test("prefers a playable featured track", () => {
    const album = createMockAlbum();
    const first = createMockRNTrack({ order: 0, isPreview: true });
    const featured = createMockRNTrack({
      order: 1,
      isPreview: true,
      isFeatured: true,
    });
    expect(pickFeaturedTrack([first, featured], undefined, album)).toBe(
      featured,
    );
  });

  test("falls back to the first playable track by order", () => {
    const album = createMockAlbum();
    const first = createMockRNTrack({ order: 0, isPreview: true });
    const second = createMockRNTrack({ order: 1, isPreview: true });
    expect(pickFeaturedTrack([second, first], undefined, album)).toBe(first);
  });

  test("skips a featured track the listener can't play", () => {
    const album = createMockAlbum();
    const locked = createMockRNTrack({
      order: 0,
      isPreview: false,
      isFeatured: true,
    });
    const open = createMockRNTrack({ order: 1, isPreview: true });
    expect(pickFeaturedTrack([locked, open], undefined, album)).toBe(open);
  });
});
