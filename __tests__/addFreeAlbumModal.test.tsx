/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { createMockUser } from "@/__mocks__/mockUser";

const mockPost = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockRefreshLoggedInUser = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({
    trackGroupTitle: "Demo",
    trackGroupId: "42",
    artistId: "5",
  }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

// Jest resolves the modal's relative import to this same module
jest.mock("@/queries/fetch/fetchWrapper", () => ({
  post: (...args: unknown[]) => mockPost(...args),
}));

const mockUser = createMockUser();
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({
    user: mockUser,
    refreshLoggedInUser: mockRefreshLoggedInUser,
  }),
}));

jest.mock("@/components/DismissModalBar", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="dismiss-modal-bar" />,
  };
});

// Local strings, so a Transifex token in the env can't change them
jest.mock("react-i18next", () => {
  const en = jest.requireActual("@/translation/en.json");
  const t = (key: string) =>
    key.split(".").reduce((node, part) => node?.[part], en) ?? key;
  return { useTranslation: () => ({ t }) };
});

const importScreen = () => require("@/app/addFreeAlbumModal").default;

describe("<AddFreeAlbumModal />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Add to Collection posts the free purchase and then reads Added!", async () => {
    mockPost.mockResolvedValue({ redirectUrl: "/x" });
    const Screen = importScreen();
    render(<Screen />);

    fireEvent.press(screen.getByRole("button", { name: "Add to Collection" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Added!" })).toBeTruthy();
    });
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith("/v1/purchase", {
      artistId: 5,
      items: [{ type: "trackGroup", id: 42, price: "0" }],
      deferred: true,
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["fetchUserPurchases", { userId: mockUser.id }],
    });
    expect(mockRefreshLoggedInUser).toHaveBeenCalledTimes(1);
  });

  test("a rejected purchase shows the error and keeps the button", async () => {
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockPost.mockRejectedValue(new Error("boom"));
    const Screen = importScreen();
    render(<Screen />);

    fireEvent.press(screen.getByRole("button", { name: "Add to Collection" }));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeTruthy();
    });
    expect(
      screen.getByRole("button", { name: "Add to Collection" }),
    ).toBeTruthy();
    expect(mockRefreshLoggedInUser).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "Issue purchasing free album",
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });
});
