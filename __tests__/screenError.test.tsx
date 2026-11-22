/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { act, render, screen } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AlbumTracks from "@/app/artist/[id]/album/[slug]/album-tracks";
import TrackView from "@/app/artist/[id]/album/[slug]/tracks/[trackId]";
import ArtistPage from "@/app/artist/[id]/artist-page";
import TagsView from "@/app/tags/[tag]";
import { MirloFetchError } from "@/queries/fetch/MirloFetchError";
import { queryClient as appQueryClient } from "@/queries/QueryClientWrapper";

const mockGet = jest.fn();
jest.mock("@/queries/fetch/fetchWrapper", () => ({
  get: (...args: unknown[]) => mockGet(...args),
  post: jest.fn(),
}));

jest.mock("expo-router", () => {
  const { Text } = require("react-native");
  const router = {
    navigate: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
    dismissTo: jest.fn(),
    canGoBack: () => true,
  };
  return {
    router,
    useRouter: () => router,
    usePathname: () => "/",
    useLocalSearchParams: () => ({ id: "77", slug: "gone", trackId: "5" }),
    useFocusEffect: (effect: () => void) =>
      require("react").useEffect(effect, [effect]),
    Link: ({ children }: { children?: React.ReactNode }) => (
      <Text>{children}</Text>
    ),
  };
});
jest.mock("react-native-track-player", () => ({
  __esModule: true,
  default: {},
  State: { Playing: "playing", Paused: "paused", Buffering: "buffering" },
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: jest.requireActual("react-native").View,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({ user: null, refreshLoggedInUser: jest.fn() }),
}));
jest.mock("@/state/PlayerContext", () => ({
  usePlayer: () => ({
    playbackState: { state: "paused" },
    isPlaying: false,
    playableTracks: [],
    setPlayableTracks: jest.fn(),
    setActiveTrack: jest.fn(),
    setShuffled: jest.fn(),
  }),
}));
// The real hook is never ready for an unknown source
let mockUnknownSource = false;
jest.mock("@/state/InstancesContext", () => ({
  useKnownApiRoot: () => ({
    apiRoot: undefined,
    ready: !mockUnknownSource,
    unknown: mockUnknownSource,
  }),
}));

// Local strings, so a Transifex token in the env can't change them
jest.mock("react-i18next", () => {
  const en = jest.requireActual("@/translation/en.json");
  const t = (key: string) =>
    key.split(".").reduce((node, part) => node?.[part], en) ?? key;
  return { useTranslation: () => ({ t }), Trans: () => null };
});

// The real icon sets state after their font loads, outside act
jest.mock("@expo/vector-icons/Ionicons", () => "Ionicons");
jest.mock("@expo/vector-icons/FontAwesome5", () => "FontAwesome5");
jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => "Icons");
jest.mock("@expo/vector-icons/MaterialIcons", () => "Icons");
jest.mock("@/components/Markdown", () => "Markdown");
jest.mock("@/components/PlayPauseWrapper", () => "PlayPauseWrapper");

beforeEach(() => {
  mockUnknownSource = false;
  mockGet.mockClear();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

// The app's own retry rule, and no gc timer that would keep jest open
const newClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        ...appQueryClient.getDefaultOptions().queries,
        gcTime: Infinity,
      },
    },
  });

const renderScreen = (Screen: React.ComponentType, client = newClient()) =>
  render(
    <QueryClientProvider client={client}>
      <Screen />
    </QueryClientProvider>,
  );

const fails = (status: number, message: string) =>
  mockGet.mockRejectedValue(
    new MirloFetchError({ status } as Response, message),
  );

const releaseNotFound =
  "This release does not exist or it does not have a public presence.";
const artistNotFound =
  "This artist page does not exist or does not have any public presence yet.";

test.each([
  ["album", AlbumTracks, releaseNotFound],
  ["track", TrackView, releaseNotFound],
  ["artist", ArtistPage, artistNotFound],
])(
  "the %s screen keeps its header when its request fails, a 404 gets the website's message",
  async (_, Screen, notFound) => {
    fails(404, "TrackGroup with id 12 not found");
    renderScreen(Screen);
    expect(await screen.findByText(notFound)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
    expect(screen.queryByText("TrackGroup with id 12 not found")).toBeNull();
    screen.unmount();

    fails(400, "Bad request");
    renderScreen(Screen);
    expect(await screen.findByText("Bad request")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
  },
);

test("the tag screen keeps its header and shows the error message even for a 404", async () => {
  fails(404, "No such tag");
  renderScreen(TagsView);
  expect(await screen.findByText("No such tag")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
});

test("the artist screen keeps its header and explains an unknown source without sending a request", () => {
  mockUnknownSource = true;
  renderScreen(ArtistPage);
  expect(
    screen.getByText("This page comes from a source that isn't in your list."),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
  expect(mockGet).not.toHaveBeenCalled();
});

const release = {
  id: 3,
  title: "Dronefields",
  urlSlug: "dronefields",
  artistId: 7,
  artist: { name: "Joni Void" },
  cover: null,
} as AlbumProps;
const artist = {
  id: 7,
  name: "Joni Void",
  urlSlug: "joni-void",
  trackGroups: [release],
} as Artist;

// The next request fails and the screens already on display refetch
const failRefresh = async (client: QueryClient) => {
  fails(400, "Bad request");
  await act(async () => {
    await client.refetchQueries();
    // React hears of the failure on a timer
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(mockGet).toHaveBeenCalledTimes(2);
};

test("the artist screen keeps its loaded page when a refresh fails", async () => {
  const client = newClient();
  mockGet.mockResolvedValue({ result: artist });
  renderScreen(ArtistPage, client);
  expect(await screen.findByText("Joni Void")).toBeTruthy();

  await failRefresh(client);

  expect(screen.getByText("Joni Void")).toBeTruthy();
  expect(screen.queryByText("Bad request")).toBeNull();
});

test("the tag screen keeps its loaded list when a refresh fails", async () => {
  const client = newClient();
  mockGet.mockResolvedValue({ results: [release] });
  renderScreen(TagsView, client);
  expect(await screen.findByText("Dronefields")).toBeTruthy();

  await failRefresh(client);

  expect(screen.getByText("Dronefields")).toBeTruthy();
  expect(screen.queryByText("Bad request")).toBeNull();
});
