/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { act, render } from "@testing-library/react-native";
import TrackView from "@/app/artist/[id]/album/[slug]/tracks/[trackId]";
import { createMockAlbum } from "@/__mocks__/mockAlbum";

// The API sends a release's id and no trackGroupId
const mockAlbum = createMockAlbum({ id: 42, trackGroupId: undefined });
// Stable objects, so the screen's callbacks and effects keep their deps
const mockQuery = {
  data: { result: mockAlbum },
  isPending: false,
  isError: false,
};
const mockPlayer = {
  setPlayableTracks: jest.fn(),
  playableTracks: [],
  playbackState: { state: undefined },
  isPlaying: false,
};

jest.mock("expo-router", () => {
  const { useEffect } = require("react");
  return {
    router: {},
    useRouter: () => ({}),
    useLocalSearchParams: () => ({
      id: "7",
      slug: "album",
      trackId: String(mockAlbum.tracks?.[0].id),
    }),
    useFocusEffect: (effect: () => void) => useEffect(effect, [effect]),
    Link: () => null,
  };
});
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => mockQuery,
}));
jest.mock("@/queries/queries", () => ({
  queryAlbum: () => ({ enabled: true }),
}));
jest.mock("@/state/InstancesContext", () => ({
  useKnownApiRoot: () => ({ apiRoot: undefined, ready: true, unknown: false }),
}));
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({ user: null }),
}));
jest.mock("@/state/PlayerContext", () => ({
  usePlayer: () => mockPlayer,
}));
jest.mock("react-native-track-player", () => ({
  __esModule: true,
  default: { getQueue: async () => [] },
  State: {},
}));
jest.mock("@/components/PlayPauseWrapper", () => () => null);
jest.mock("@/scripts/openInBrowser", () => ({ openOnWeb: jest.fn() }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: require("react-native").View,
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: () => null,
}));

test("the track it queues carries its release's id", async () => {
  render(<TrackView />);
  // Lets the play button's queue read and the icon fonts settle
  await act(async () => {});

  const [[queued]] = mockPlayer.setPlayableTracks.mock.calls;
  expect(queued[0].trackGroup.id).toBe(42);
});
