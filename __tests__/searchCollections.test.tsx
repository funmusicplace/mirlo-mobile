/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { createMockAlbum } from "@/__mocks__/mockAlbum";
import { createMockRNTrack } from "@/__mocks__/mockRNTrack";
import { createMockUser } from "@/__mocks__/mockUser";

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  dismiss: jest.fn(),
};
jest.mock("expo-router", () => ({
  router: mockRouter,
  useRouter: () => mockRouter,
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: View,
  };
});

jest.mock("@/components/MirloLogo", () => {
  const { View } = require("react-native");
  return { __esModule: true, LOGO_SIZE: 32, default: () => <View /> };
});

// Local strings, so a Transifex token in the env can't change them
jest.mock("react-i18next", () => {
  const en = jest.requireActual("@/translation/en.json");
  const t = (key: string) =>
    key.split(".").reduce((node, part) => node?.[part], en) ?? key;
  // Renders the translated string as is, the tags inside it become plain text
  const Trans = ({ i18nKey }: { i18nKey: string }) =>
    t(i18nKey).replace(/<\/?\w+>/g, "");
  return { useTranslation: () => ({ t }), Trans };
});

let mockUser: ReturnType<typeof createMockUser> | null = null;
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({ user: mockUser }),
}));

let mockQueries: Record<string, object> = {};
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: (options: { queryKey: string[] }) =>
    mockQueries[options.queryKey[0]] ?? {
      isPending: true,
      isError: false,
      data: undefined,
      error: null,
    },
}));

const mockGetMany = jest.fn();
jest.mock("@/queries/fetch/fetchWrapper", () => ({
  getMany: (...args: unknown[]) => mockGetMany(...args),
}));

const loaded = (data: object) => ({
  isPending: false,
  isError: false,
  data,
  error: null,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = null;
  mockQueries = {};
});

test("signed out, collection and wishlist show the empty box and redirect", () => {
  const Collections = require("@/app/collections").default;
  const Wishlist = require("@/app/wishlist").default;
  render(<Collections />);
  expect(screen.getByText("Your collection")).toBeTruthy();
  expect(screen.getByText(/nothing in your collection/)).toBeTruthy();
  render(<Wishlist />);
  expect(screen.getByText(/nothing in your wishlist/)).toBeTruthy();
  expect(mockRouter.push).toHaveBeenCalledWith("/login");
});

test("wishlist puts the newest first and tracks open the track page", () => {
  const track = createMockRNTrack({ title: "Newer track", id: 5 });
  mockUser = createMockUser({
    trackFavorites: [
      { userId: 1, trackId: 5, track, createdAt: new Date("2026-02-01") },
    ],
  });
  mockQueries.fetchWishlist = loaded({
    results: [
      {
        userId: 1,
        trackGroupId: 9,
        trackGroup: createMockAlbum({ title: "Older album" }),
        createdAt: new Date("2026-01-01"),
      },
    ],
  });
  const Wishlist = require("@/app/wishlist").default;
  render(<Wishlist />);
  const titles = screen
    .getAllByText(/Newer track|Older album/)
    .map((node) => node.props.children);
  expect(titles).toEqual(["Newer track", "Older album"]);
  fireEvent.press(screen.getByText("Newer track"));
  expect(mockRouter.navigate).toHaveBeenCalledWith({
    pathname: "/artist/[id]/album/[slug]/tracks/[trackId]",
    params: {
      id: track.trackGroup.artistId,
      slug: track.trackGroup.urlSlug,
      trackId: 5,
    },
  });
});

test("search groups results in the web order", async () => {
  jest.useFakeTimers();
  mockQueries.fetchTags = loaded({ results: [{ tag: "ambient" }] });
  const artist = { name: "Elec Artist", id: 1, urlSlug: "elec" };
  mockGetMany.mockImplementation(async (url: string) => {
    if (url === "/v1/artists") return { results: [artist] };
    if (url === "/v1/trackGroups") {
      return { results: [{ title: "Elec Album", id: 2, artist }] };
    }
    if (url === "/v1/tracks") return { results: [] };
    return { results: [{ tag: "electronic" }] };
  });
  const { SearchContextProvider } = require("@/state/SearchContext");
  const Search = require("@/app/search").default;
  render(
    <SearchContextProvider>
      <Search />
    </SearchContextProvider>,
  );
  expect(screen.getByText("ambient")).toBeTruthy();

  fireEvent.changeText(screen.getByLabelText("Search music"), "elec");
  await act(async () => {
    jest.advanceTimersByTime(600);
  });
  await screen.findByText("Tags");
  const texts = screen
    .getAllByText(/^(Tags|Artists|Releases|Tracks)$|Elec|electronic/)
    .map((node) => node.props.children);
  expect(texts).toEqual([
    "Tags",
    "electronic",
    "Artists",
    "Elec Artist",
    "Releases",
    "Elec Artist · Elec Album",
  ]);

  fireEvent.press(screen.getByLabelText("Clear search"));
  expect(screen.getByText("ambient")).toBeTruthy();
  jest.useRealTimers();
});
