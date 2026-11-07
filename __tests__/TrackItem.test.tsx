import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import "../i18n";
import { TrackItem, formatTime } from "@/components/TrackItem";
import { createMockRNTrack } from "@/__mocks__/mockRNTrack";
import { createMockUser } from "@/__mocks__/mockUser";

jest.mock("@react-native-async-storage/async-storage", () => ({}));

jest.mock("expo-router", () => ({ router: {} }));

jest.mock("@/queries/fetch/fetchWrapper", () => ({ post: jest.fn() }));

const mockUser = createMockUser({ id: 1, trackFavorites: [] });
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({ user: mockUser, refreshLoggedInUser: jest.fn() }),
}));

describe("<TrackItem />", () => {
  test("plays from the row and keeps the favorite reachable beside it", () => {
    const onPress = jest.fn();
    render(
      <TrackItem
        track={createMockRNTrack({ title: "Mover", order: 2 })}
        thisSongSelected={false}
        onPress={onPress}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: /Mover/ }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("03:50")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Add to favorites" }),
    ).toBeTruthy();
  });

  test("disables rows the listener can't play", () => {
    const onPress = jest.fn();
    render(
      <TrackItem
        track={createMockRNTrack({
          title: "Locked",
          isPreview: false,
          trackGroup: {
            ...createMockRNTrack().trackGroup,
            userTrackGroupPurchases: [],
          },
        })}
        thisSongSelected={false}
        onPress={onPress}
      />,
    );

    const row = screen.getByRole("button", { name: "Locked" });
    fireEvent.press(row);

    expect(onPress).not.toHaveBeenCalled();
    expect(row).toBeDisabled();
  });

  test("skips blank contributor names instead of leaving a stray comma", () => {
    render(
      <TrackItem
        track={createMockRNTrack({
          artist: "KAN3KI~CHAN",
          trackArtists: [
            { artistName: "Tha303", role: "Vocals", isCoAuthor: true },
            { artistName: "", role: "Lil Blurr Q", isCoAuthor: true },
          ],
        })}
        thisSongSelected={false}
      />,
    );

    expect(screen.getByText("Tha303")).toBeTruthy();
  });

  test("lists the co-authors by order and leaves out other credits", () => {
    render(
      <TrackItem
        track={createMockRNTrack({
          trackArtists: [
            {
              artistName: "Guest",
              role: "Vocals",
              isCoAuthor: false,
              order: 1,
            },
            { artistName: "Second", isCoAuthor: true, order: 2 },
            { artistName: "First", isCoAuthor: true, order: 0 },
          ],
        })}
        thisSongSelected={false}
      />,
    );

    expect(screen.getByText("First, Second")).toBeTruthy();
    expect(screen.queryByText(/Guest/)).toBeNull();
  });

  test("keeps a co-author who is the release artist", () => {
    render(
      <TrackItem
        track={createMockRNTrack({
          artist: "Midwinter",
          trackArtists: [{ artistName: "Midwinter", isCoAuthor: true }],
        })}
        thisSongSelected={false}
      />,
    );

    expect(screen.getByText("Midwinter")).toBeTruthy();
  });
});

test("formatTime rounds the whole value before splitting minutes and seconds", () => {
  expect(formatTime(59.6)).toBe("01:00");
  expect(formatTime(119.7)).toBe("02:00");
  expect(formatTime(179.4)).toBe("02:59");
  expect(formatTime(0)).toBe("00:00");
  expect(formatTime(11.2)).toBe("00:11");
});
