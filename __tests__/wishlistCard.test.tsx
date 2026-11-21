import React from "react";
import { StyleSheet } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CollectionPurchase from "@/components/CollectionPurchase";
import { createMockAlbum } from "@/__mocks__/mockAlbum";
import { createMockRNTrack } from "@/__mocks__/mockRNTrack";
import { createMockUser } from "@/__mocks__/mockUser";

const mockSetQueue = jest.fn().mockResolvedValue(undefined);
jest.mock("react-native-track-player", () => ({
  __esModule: true,
  default: {
    setQueue: (...a: unknown[]) => mockSetQueue(...a),
    play: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("expo-router", () => ({
  router: { navigate: jest.fn() },
  useRouter: () => ({ push: jest.fn() }),
}));

const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock("@/queries/fetch/fetchWrapper", () => ({
  get: (...args: unknown[]) => mockGet(...args),
  post: (...args: unknown[]) => mockPost(...args),
}));

const mockTrack = (id: number, order: number, isPreview = true) =>
  createMockRNTrack({ id, order, isPreview, title: `Song ${id}` });
const album = createMockAlbum({
  id: 9,
  artistId: 77,
  urlSlug: "ep",
  // The last track is locked for this listener
  tracks: [mockTrack(2, 2), mockTrack(1, 1), mockTrack(3, 3, false)],
});
const track = album.tracks![0];

const mockUser = createMockUser({
  id: 1,
  wishlist: [{ userId: 1, trackGroupId: 9 }],
  trackFavorites: [
    { userId: 1, trackId: track.id, track, createdAt: new Date() },
  ],
});
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({ user: mockUser, refreshLoggedInUser: jest.fn() }),
}));

let mockPlayer: { isPlaying: boolean; activeTrack?: RNTrack } = {
  isPlaying: false,
};
jest.mock("@/state/PlayerContext", () => ({
  usePlayer: () => ({
    ...mockPlayer,
    setActiveTrack: jest.fn(),
    setShuffled: jest.fn(),
  }),
}));

// Local strings, so a Transifex token in the env can't change them
jest.mock("react-i18next", () => {
  const en = jest.requireActual("@/translation/en.json");
  const t = (key: string) =>
    key.split(".").reduce((node, part) => node?.[part], en) ?? key;
  return { useTranslation: () => ({ t }) };
});

// The real icon sets state after their font loads, outside act
jest.mock("@expo/vector-icons/Ionicons", () => "Ionicons");
jest.mock("@expo/vector-icons/FontAwesome5", () => "FontAwesome5");

// The jest mock of Image skips merging a bundled image's size into the style
jest.mock("react-native/Libraries/Image/Image", () =>
  jest.requireActual("react-native/Libraries/Image/Image"),
);
// Metro hands a bundled image over as a registry ID, the registry holds its size
jest.mock("@/assets/images/mirlo-logo-logoOnly-light.png", () => 1);
jest.mock("@/assets/images/mirlo-logo-logoOnly-dark.png", () => 1);

const renderCard = (props: {
  track?: RNTrack;
  wishlist?: boolean;
  trackGroup?: AlbumProps;
}) =>
  render(
    // No gc timer, it would keep jest open
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })
      }
    >
      <CollectionPurchase trackGroup={album} width={180} {...props} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({ result: album });
  mockPlayer = { isPlaying: false };
});

test("wishlist cards get remove and play controls, tracks also a caption", () => {
  renderCard({ track, wishlist: true });
  expect(screen.getByText("Track")).toBeTruthy();
  expect(
    screen.getByRole("link", {
      name: `${track.title}, ${album.artist.name}, Track`,
    }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Remove from wishlist" }),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  screen.unmount();

  renderCard({ wishlist: true });
  expect(screen.queryByText("Track")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Remove from wishlist" }),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  screen.unmount();

  renderCard({});
  expect(
    screen.queryByRole("button", { name: "Remove from wishlist" }),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: "Play" })).toBeNull();
});

test("collection cards offer the download of a release, a track has none", () => {
  renderCard({});
  expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
  screen.unmount();

  renderCard({ track });
  expect(screen.queryByRole("button")).toBeNull();
  screen.unmount();

  renderCard({ wishlist: true });
  expect(screen.queryByRole("button", { name: "Download" })).toBeNull();
});

test("the heart removes a track from the favorites and a release from the wishlist", async () => {
  renderCard({ track, wishlist: true });
  fireEvent.press(screen.getByRole("button", { name: "Remove from wishlist" }));
  await waitFor(() =>
    expect(mockPost).toHaveBeenCalledWith(`/v1/tracks/${track.id}/favorite`, {
      favorite: false,
    }),
  );
  screen.unmount();

  mockPost.mockClear();
  renderCard({ wishlist: true });
  fireEvent.press(screen.getByRole("button", { name: "Remove from wishlist" }));
  await waitFor(() =>
    expect(mockPost).toHaveBeenCalledWith(
      `/v1/trackGroups/${album.id}/wishlist`,
      { wishlist: false },
    ),
  );
  expect(mockPost).toHaveBeenCalledTimes(1);
});

test("play queues the playable tracks of a release in order, a track alone", async () => {
  renderCard({ wishlist: true });
  fireEvent.press(screen.getByRole("button", { name: "Play" }));
  await waitFor(() => expect(mockSetQueue).toHaveBeenCalledTimes(1));
  expect(mockSetQueue.mock.calls[0][0].map((t: RNTrack) => t.id)).toEqual([
    1, 2,
  ]);
  screen.unmount();

  mockSetQueue.mockClear();
  renderCard({ track, wishlist: true });
  fireEvent.press(screen.getByRole("button", { name: "Play" }));
  await waitFor(() => expect(mockSetQueue).toHaveBeenCalledTimes(1));
  expect(mockSetQueue.mock.calls[0][0].map((t: RNTrack) => t.id)).toEqual([2]);
});

test("cards of the playing track show pause, the others play", () => {
  mockPlayer = {
    isPlaying: true,
    activeTrack: {
      ...track,
      trackGroup: {
        ...track.trackGroup,
        urlSlug: album.urlSlug,
        artistId: album.artistId,
      },
    },
  };
  renderCard({ wishlist: true });
  expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
  screen.unmount();

  renderCard({ track, wishlist: true });
  expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
  screen.unmount();

  renderCard({ track: album.tracks![1], wishlist: true });
  expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
});

test("the logo of a release without a cover is sized by the card width and the aspect ratio", () => {
  renderCard({
    wishlist: true,
    trackGroup: createMockAlbum({ cover: null }),
  });
  const { height } = StyleSheet.flatten(
    screen.UNSAFE_getByType("RCTImageView" as never).props.style,
  );
  // A fixed height beats the aspect ratio, so the logo overflows the card
  expect(height).not.toEqual(expect.any(Number));
});

test("a deleted release is plain text with no link and no controls, like the website's card", () => {
  const deleted = { ...album, cover: null, deletedAt: "2026-11-01T00:00:00Z" };
  const text = "This album was deleted by the artist";
  renderCard({ wishlist: true, trackGroup: deleted });
  // One labeled element for screen readers, with no link or button role
  expect(
    screen.getByLabelText(`${album.title}, ${album.artist.name}, ${text}`).props
      .accessible,
  ).toBe(true);
  expect(screen.getByText(text)).toBeTruthy();
  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
  screen.unmount();

  // A favorited track of that release has the same dead end
  renderCard({ track, wishlist: true, trackGroup: deleted });
  expect(screen.getByText(text)).toBeTruthy();
  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
});
