import { faker } from "@faker-js/faker";
import { createMockAlbum } from "@/__mocks__/mockAlbum";
import { createMockRNTrack } from "@/__mocks__/mockRNTrack";

export const FIXTURE_SEED = 1234;

const COVER_SIZES = [60, 120, 300, 600, 960, 1200, 1500] as const;

// loremflickr is flaky
function stableCoverSizes(): AlbumProps["cover"]["sizes"] {
  const sizes: Record<number, string> = {};
  for (const size of COVER_SIZES) {
    sizes[size] = faker.image.urlPicsumPhotos({
      width: size,
      height: size,
      grayscale: false,
      blur: 0,
    });
  }
  return sizes as AlbumProps["cover"]["sizes"];
}

export function mockAlbum(overrides?: Partial<AlbumProps>): AlbumProps {
  const album = createMockAlbum(overrides);
  album.cover.sizes = stableCoverSizes();
  return album;
}

export function mockRNTrack(overrides?: Partial<RNTrack>): RNTrack {
  const track = createMockRNTrack(overrides);
  track.trackGroup.cover.sizes = stableCoverSizes();
  track.artwork = track.trackGroup.cover.sizes[600];
  return track;
}
