/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { render, act, waitFor } from "@testing-library/react-native";

import { createMockRNTrack } from "@/__mocks__/mockRNTrack";
import { createMockUser } from "@/__mocks__/mockUser";
import { clearStoredSession, startSession } from "@/queries/fetch/session";

type PlayerEvent = {
  type: string;
  position?: number;
  duration?: number;
  state?: string;
};

const mockEvent = {
  PlaybackActiveTrackChanged: "playback-active-track-changed",
  PlaybackProgressUpdated: "playback-progress-updated",
  PlaybackState: "playback-state",
  PlaybackQueueEnded: "playback-queue-ended",
};
const mockGetActiveTrack = jest.fn();
const mockSetQueue = jest.fn().mockResolvedValue(undefined);
const mockLoad = jest.fn().mockResolvedValue(undefined);
const mockPause = jest.fn().mockResolvedValue(undefined);
const mockSkip = jest.fn().mockResolvedValue(undefined);
const mockGet = jest.fn();
let mockHandler: (event: PlayerEvent) => Promise<void>;

jest.mock("react-native-track-player", () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn().mockResolvedValue(undefined),
    updateOptions: jest.fn().mockResolvedValue(undefined),
    getActiveTrack: mockGetActiveTrack,
    setQueue: mockSetQueue,
    load: mockLoad,
    pause: mockPause,
    skip: mockSkip,
    getProgress: jest.fn().mockResolvedValue({ position: 0 }),
    getPlayWhenReady: jest.fn().mockResolvedValue(false),
  },
  useTrackPlayerEvents: (_events: unknown, handler: typeof mockHandler) => {
    mockHandler = handler;
  },
  usePlaybackState: () => ({ state: undefined }),
  Event: mockEvent,
  State: { Playing: "playing" },
  Capability: {},
  IOSCategory: {},
  IOSCategoryOptions: {},
  AppKilledPlaybackBehavior: {},
}));

jest.mock("@react-native-async-storage/async-storage", () => ({}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

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

const importTrackPlayer = () => require("react-native-track-player").default;

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

  test("shows the track that is already playing when the provider mounts", async () => {
    mockGetActiveTrack.mockResolvedValue(createMockRNTrack({ id: 7 }));
    const Provider = importProvider();
    const { usePlayer } = require("@/state/PlayerContext");
    let seen: { id?: number } | undefined;
    const Probe = () => {
      seen = usePlayer().activeTrack;
      return null;
    };
    render(
      <Provider>
        <Probe />
      </Provider>,
    );

    await waitFor(() => expect(seen).toMatchObject({ id: 7 }));
  });
});

describe("queue end", () => {
  let finished: RNTrack["trackGroup"] | undefined;
  let track: RNTrack;
  const renderProvider = () => {
    const Provider = importProvider();
    const { usePlayer } = require("@/state/PlayerContext");
    const Probe = () => {
      finished = usePlayer().finished;
      return null;
    };
    render(
      <Provider>
        <Probe />
      </Provider>,
    );
  };
  const endQueue = async () => {
    await fire({ type: mockEvent.PlaybackState, state: "ended" });
    await fire({ type: mockEvent.PlaybackQueueEnded });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    track = createMockRNTrack({ id: 3 });
    mockGetActiveTrack.mockResolvedValue(track);
  });

  test("lasts through the rewind and clears once something plays", async () => {
    renderProvider();
    await endQueue();
    // Paused first, so Android's rewind doesn't start the release over
    expect(mockPause.mock.invocationCallOrder[0]).toBeLessThan(
      mockSkip.mock.invocationCallOrder[0],
    );
    expect(mockSkip).toHaveBeenCalledWith(0);
    // What the rewind itself fires
    await fire({ type: mockEvent.PlaybackActiveTrackChanged });
    await fire({ type: mockEvent.PlaybackState, state: "buffering" });
    await fire({ type: mockEvent.PlaybackState, state: "ready" });
    expect(finished).toEqual(track.trackGroup);

    await fire({ type: mockEvent.PlaybackState, state: "playing" });
    expect(finished).toBeUndefined();
  });

  test("keeps the release of the queue's last track", async () => {
    const first = createMockRNTrack({
      id: 1,
      trackGroup: { ...track.trackGroup, id: track.trackGroup.id + 1 },
    });
    // The rewind makes the queue's first track, from another release, active
    mockSkip.mockImplementationOnce(async () => {
      mockGetActiveTrack.mockResolvedValue(first);
    });
    renderProvider();
    await endQueue();
    await fire({ type: mockEvent.PlaybackActiveTrackChanged });

    expect(finished).toEqual(track.trackGroup);
  });

  test("clears when a new queue is set", async () => {
    renderProvider();
    await endQueue();
    expect(finished).toEqual(track.trackGroup);

    await act(() => importTrackPlayer().setQueue([createMockRNTrack()]));
    expect(finished).toBeUndefined();
  });
});

describe("bearer token on tracks", () => {
  const fromOtherInstance = (id: number) => {
    const { trackGroup, ...track } = createMockRNTrack({ id });
    return {
      ...track,
      trackGroup: { ...trackGroup, apiRoot: "https://api.example.org" },
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await startSession({
      accessToken: "access-token-value",
      refreshToken: "refresh-token-value",
      expiresAt: Date.now() + 60 * 60 * 1000,
    });
  });

  afterEach(() => clearStoredSession());

  test("only this API's queued tracks get it", async () => {
    importProvider();
    const own = createMockRNTrack({ headers: { "mirlo-api-key": "key" } });
    const remote = fromOtherInstance(2);

    await importTrackPlayer().setQueue([own, remote]);

    const [queued] = mockSetQueue.mock.calls[0];
    expect(queued[0].headers).toEqual({
      "mirlo-api-key": "key",
      Authorization: "Bearer access-token-value",
    });
    expect(queued[1].headers).toEqual(remote.headers);
  });

  test("an active track from this API is reloaded with it", async () => {
    mockGetActiveTrack.mockResolvedValue(createMockRNTrack({ id: 1 }));
    const Provider = importProvider();
    render(<Provider>{null}</Provider>);

    await fire({ type: mockEvent.PlaybackActiveTrackChanged });

    expect(mockLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { Authorization: "Bearer access-token-value" },
      }),
    );
  });

  test("an active track from another instance is left alone", async () => {
    mockGetActiveTrack.mockResolvedValue(fromOtherInstance(2));
    const Provider = importProvider();
    render(<Provider>{null}</Provider>);

    await fire({ type: mockEvent.PlaybackActiveTrackChanged });

    expect(mockLoad).not.toHaveBeenCalled();
  });
});
