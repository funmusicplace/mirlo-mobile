import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import "../i18n";
import { TrackItem } from "@/components/TrackItem";
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
});
