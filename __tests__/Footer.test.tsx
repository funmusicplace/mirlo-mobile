/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { StyleSheet } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import Footer from "@/components/Footer";

jest.mock("@react-native-async-storage/async-storage", () => ({}));

const mockSeekTo = jest.fn().mockResolvedValue(undefined);
const mockSkip = jest.fn().mockResolvedValue(undefined);
const mockSkipToNext = jest.fn().mockResolvedValue(undefined);
const mockSkipToPrevious = jest.fn().mockResolvedValue(undefined);
const mockPlay = jest.fn().mockResolvedValue(undefined);
const mockPause = jest.fn().mockResolvedValue(undefined);
let mockProgress = { position: 30, duration: 120, buffered: 0 };
let mockQueue = [1, 2, 3];
let mockIndex: number | undefined = 0;

jest.mock("react-native-track-player", () => ({
  __esModule: true,
  default: {
    seekTo: (...a: unknown[]) => mockSeekTo(...a),
    getQueue: async () => mockQueue,
    getActiveTrackIndex: async () => mockIndex,
    skip: (...a: unknown[]) => mockSkip(...a),
    skipToNext: (...a: unknown[]) => mockSkipToNext(...a),
    skipToPrevious: (...a: unknown[]) => mockSkipToPrevious(...a),
    play: (...a: unknown[]) => mockPlay(...a),
    pause: (...a: unknown[]) => mockPause(...a),
  },
  useProgress: () => mockProgress,
  State: {
    Playing: "playing",
    Paused: "paused",
    Ready: "ready",
    Buffering: "buffering",
  },
}));

let mockPathname = "/";
const mockRouter = {
  dismissTo: jest.fn(),
  push: jest.fn(),
  navigate: jest.fn(),
};
jest.mock("expo-router", () => ({
  Link: jest.requireActual("expo-router").Link,
  router: {
    dismissTo: (...a: unknown[]) => mockRouter.dismissTo(...a),
    push: (...a: unknown[]) => mockRouter.push(...a),
    navigate: (...a: unknown[]) => mockRouter.navigate(...a),
  },
  usePathname: () => mockPathname,
}));

let mockUser: object | null = null;
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({ user: mockUser }),
}));

const track = {
  artwork: "https://example.com/a.jpg",
  trackGroup: { artistId: 7, urlSlug: "album" },
};
let mockPlayer: Record<string, unknown> = {};
jest.mock("@/state/PlayerContext", () => ({
  usePlayer: () => mockPlayer,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

let mockWidth = 390;
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: mockWidth, height: 800, scale: 3, fontScale: 1 }),
}));

const flat = (el: { props: { style?: unknown } }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;
// RNTL skips every event while onStartShouldSetResponder is false, so lay out directly
const layout = (el: { props: { onLayout: (e: unknown) => void } }) =>
  act(() => el.props.onLayout({ nativeEvent: { layout: { width: 400 } } }));
const ev = (pageX: number, locationX = pageX) => ({
  nativeEvent: { pageX, locationX },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockProgress = { position: 30, duration: 120, buffered: 0 };
  mockQueue = [1, 2, 3];
  mockIndex = 0;
  mockPathname = "/";
  mockUser = null;
  mockWidth = 390;
  mockPlayer = {
    activeTrack: track,
    playbackState: { state: "paused" },
    isPlaying: false,
  };
});

test("drag to seek holds the target until progress catches up", async () => {
  const { rerender } = render(<Footer />);
  const seek = () => screen.getByLabelText("Track progress");
  const fill = () => flat(seek().children[0] as never).width;
  layout(seek());
  expect(seek().props.onStartShouldSetResponder()).toBe(true);
  // Touch starts on a child whose locationX is offset, pageX keeps it right
  fireEvent(seek(), "responderGrant", ev(250, 200));
  expect(fill()).toBe("50%");
  fireEvent(seek(), "responderMove", ev(350));
  expect(fill()).toBe("75%");
  fireEvent(seek(), "responderMove", ev(-100));
  expect(fill()).toBe("0%");
  fireEvent(seek(), "responderMove", ev(900));
  expect(fill()).toBe("100%");
  fireEvent(seek(), "responderMove", ev(250));
  await act(async () => {
    fireEvent(seek(), "responderRelease", ev(250));
  });
  expect(mockSeekTo).toHaveBeenCalledWith(60);
  // Same polled position as before the release, still holds 60 s
  rerender(<Footer />);
  expect(fill()).toBe("50%");
  mockProgress = { position: 60.5, duration: 120, buffered: 0 };
  rerender(<Footer />);
  expect(fill()).toBe(`${(60.5 / 120) * 100}%`);
});

test("screen reader increment and decrement seek 10 s, clamped", async () => {
  const { rerender } = render(<Footer />);
  const seek = () => screen.getByLabelText("Track progress");
  layout(seek());
  await act(async () => {
    fireEvent(seek(), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
  });
  expect(mockSeekTo).toHaveBeenLastCalledWith(40);
  expect(seek().props.accessibilityValue.now).toBe(40);
  await act(async () => {
    fireEvent(seek(), "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    });
  });
  expect(mockSeekTo).toHaveBeenLastCalledWith(30);
  mockProgress = { position: 115, duration: 120, buffered: 0 };
  rerender(<Footer />);
  await act(async () => {
    fireEvent(seek(), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
  });
  expect(mockSeekTo).toHaveBeenLastCalledWith(120);
});
