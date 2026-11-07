import React from "react";
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
jest.mock("@/queries/fetch/fetchWrapper", () => ({
  get: (...args: unknown[]) => mockGet(...args),
  post: jest.fn(),
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

const renderCard = (props: { track?: RNTrack; wishlist?: boolean }) =>
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
    screen.getByRole("button", { name: "Remove from favorites" }),
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
  expect(screen.queryByRole("button")).toBeNull();
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
