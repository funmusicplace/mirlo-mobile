/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { render, act } from "@testing-library/react-native";

import { createMockRNTrack } from "@/__mocks__/mockRNTrack";
import { createMockUser } from "@/__mocks__/mockUser";

type PlayerEvent = { type: string; position?: number; duration?: number };

const mockEvent = {
  PlaybackActiveTrackChanged: "playback-active-track-changed",
  PlaybackProgressUpdated: "playback-progress-updated",
};
const mockGetActiveTrack = jest.fn();
const mockGet = jest.fn();
let mockHandler: (event: PlayerEvent) => Promise<void>;

jest.mock("react-native-track-player", () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn().mockResolvedValue(undefined),
    updateOptions: jest.fn().mockResolvedValue(undefined),
    getActiveTrack: mockGetActiveTrack,
  },
  useTrackPlayerEvents: (_events: unknown, handler: typeof mockHandler) => {
    mockHandler = handler;
  },
  usePlaybackState: () => ({ state: undefined }),
  Event: mockEvent,
  State: {},
  Capability: {},
  IOSCategory: {},
  IOSCategoryOptions: {},
  AppKilledPlaybackBehavior: {},
}));

jest.mock("@react-native-async-storage/async-storage", () => ({}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/queries/fetch/fetchWrapper", () => ({
  get: (...args: unknown[]) => mockGet(...args),
}));

let mockCurrentUser = createMockUser({ id: 1 });
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({ user: mockCurrentUser }),
}));

const importProvider = () =>
  require("@/state/PlayerContext").PlayerContextProvider;

const fire = (event: PlayerEvent) => act(() => mockHandler(event));

describe("PlayerContextProvider", () => {
  test("records a play against the active track after the user changes", async () => {
    mockGet.mockResolvedValue({});
    mockGetActiveTrack.mockResolvedValue(createMockRNTrack({ id: 42 }));
    const Provider = importProvider();
    const { rerender } = render(<Provider>{null}</Provider>);

    await fire({ type: mockEvent.PlaybackActiveTrackChanged });
    // Same user, new object
    mockCurrentUser = createMockUser({ id: 1 });
    rerender(<Provider>{null}</Provider>);
    await fire({
      type: mockEvent.PlaybackProgressUpdated,
      position: 60,
      duration: 100,
    });

    expect(mockGet).toHaveBeenCalledWith("/v1/tracks/42/trackPlay", {});
  });
});
