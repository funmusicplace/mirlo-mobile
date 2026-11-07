import React from "react";
import { render, screen } from "@testing-library/react-native";
import Player from "@/components/Player";
import MenuButton from "@/components/MenuButton";
import SearchButton from "@/components/SearchButton";
import DismissModalBar from "@/components/DismissModalBar";
import ErrorNotification from "@/components/ErrorNotification";
import { BackButton } from "@/components/ScreenHeader";

jest.mock("react-native-track-player", () => ({
  __esModule: true,
  default: {},
  RepeatMode: { Off: 0, Track: 1, Queue: 2 },
  State: { Playing: "playing", Paused: "paused", Buffering: "buffering" },
}));
jest.mock("@/scripts/trackPlayUtils", () => ({ skipTrack: jest.fn() }));
jest.mock("expo-router", () => ({ router: {}, useRouter: () => ({}) }));
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({ user: null }),
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: jest.requireActual("react-native").View,
}));

let mockPlayer: Record<string, unknown> = {};
jest.mock("@/state/PlayerContext", () => ({
  usePlayer: () => mockPlayer,
}));

// Local strings, so a Transifex token in the env can't change them
jest.mock("react-i18next", () => {
  const en = jest.requireActual("@/translation/en.json");
  const t = (key: string) =>
    key.split(".").reduce((node, part) => node?.[part], en) ?? key;
  return { useTranslation: () => ({ t }) };
});

const button = (name: string) => screen.getByRole("button", { name });

test("the player controls read translated labels and the repeat mode", () => {
  mockPlayer = {
    shuffled: false,
    looping: "none",
    playbackState: { state: "paused" },
    isPlaying: false,
  };
  const { rerender } = render(<Player />);
  for (const name of [
    "Shuffle music",
    "Previous track",
    "Play",
    "Play next track",
    "Loop music",
  ]) {
    expect(button(name)).toBeTruthy();
  }
  for (const [looping, text] of [
    ["none", "Off"],
    ["queue", "Looping queue"],
    ["track", "Looping current track"],
  ]) {
    mockPlayer = { ...mockPlayer, looping };
    rerender(<Player />);
    expect(button("Loop music").props.accessibilityValue.text).toBe(text);
  }
  mockPlayer = { ...mockPlayer, isPlaying: true };
  rerender(<Player />);
  expect(button("Pause")).toBeTruthy();
});

test("the header buttons read translated labels and hints", () => {
  render(
    <>
      <MenuButton />
      <SearchButton />
      <BackButton />
    </>,
  );
  expect(button("Menu").props.accessibilityHint).toBe("Opens the menu page");
  expect(button("Search").props.accessibilityHint).toBe("Opens the search bar");
  expect(button("Back")).toBeTruthy();
});

test("the close and dismiss buttons read translated labels", () => {
  render(
    <>
      <DismissModalBar />
      <ErrorNotification visible error={new Error("x")} onDismiss={() => {}} />
    </>,
  );
  expect(button("Close")).toBeTruthy();
  expect(button("Dismiss")).toBeTruthy();
});
