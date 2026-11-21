/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AlbumTracks from "@/app/artist/[id]/album/[slug]/album-tracks";
import TrackView from "@/app/artist/[id]/album/[slug]/tracks/[trackId]";
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
jest.mock("@/state/InstancesContext", () => ({
  useKnownApiRoot: () => ({ apiRoot: undefined, ready: true, unknown: false }),
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
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

const renderScreen = (Screen: React.ComponentType) =>
  render(
    // The app's own retry rule, and no gc timer that would keep jest open
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: {
              ...appQueryClient.getDefaultOptions().queries,
              gcTime: Infinity,
            },
          },
        })
      }
    >
      <Screen />
    </QueryClientProvider>,
  );

const fails = (status: number, message: string) =>
  mockGet.mockRejectedValue(
    new MirloFetchError({ status } as Response, message),
  );

test.each([
  ["album", AlbumTracks],
  ["track", TrackView],
])(
  "the %s screen keeps its header when the release fails to load, a 404 gets the website's message",
  async (_, Screen) => {
    fails(404, "TrackGroup with id 12 not found");
    renderScreen(Screen);
    expect(
      await screen.findByText(
        "This release does not exist or it does not have a public presence.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
    expect(screen.queryByText("TrackGroup with id 12 not found")).toBeNull();
    screen.unmount();

    fails(400, "Bad request");
    renderScreen(Screen);
    expect(await screen.findByText("Bad request")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
  },
);
