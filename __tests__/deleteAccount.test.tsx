/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

import { createMockUser } from "@/__mocks__/mockUser";

const mockDismiss = jest.fn();
const mockOpenInBrowser = jest.fn();
const mockRefreshLoggedInUser = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ dismiss: mockDismiss, dismissTo: mockDismiss }),
}));

jest.mock("@/scripts/openInBrowser", () => ({
  openInBrowser: (...args: unknown[]) => mockOpenInBrowser(...args),
}));

let mockCurrentUser: ReturnType<typeof createMockUser> | null =
  createMockUser();
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({
    user: mockCurrentUser,
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

const importScreen = () => require("@/app/deleteAccount").default;

describe("<DeleteAccountScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = createMockUser();
    mockOpenInBrowser.mockResolvedValue(undefined);
  });

  test("renders the title and warning bullets", () => {
    const Screen = importScreen();
    const { getByText, getAllByText } = render(<Screen />);

    // "Delete account" appears as both title and button label
    expect(getAllByText("Delete account").length).toBeGreaterThanOrEqual(2);
    expect(getByText(/permanently deletes your Mirlo account/i)).toBeTruthy();
    expect(getByText("This action cannot be undone.")).toBeTruthy();
  });

  test("hides the account summary card entirely when all counts are zero", () => {
    mockCurrentUser = createMockUser({
      artists: [],
      artistUserSubscriptions: [],
      userTrackGroupPurchases: [],
      userTrackPurchases: [],
      merchPurchase: [],
    });
    const Screen = importScreen();
    const { queryByText } = render(<Screen />);

    expect(queryByText("Account summary")).toBeNull();
    expect(queryByText(/Artist profiles:/)).toBeNull();
    expect(queryByText(/Music purchases:/)).toBeNull();
  });

  test("shows only nonzero rows in the summary card", () => {
    mockCurrentUser = createMockUser({
      // 1 artist profile, 0 subs, 2 album purchases + 1 track purchase = 3
      // music purchases, 0 merch
      artists: [{ id: 1 } as unknown as Artist],
      artistUserSubscriptions: [],
      userTrackGroupPurchases: [{ trackGroupId: 10 }, { trackGroupId: 11 }],
      userTrackPurchases: [{ trackId: 100 }],
      merchPurchase: [],
    });
    const Screen = importScreen();
    const { getByText, queryByText } = render(<Screen />);

    expect(getByText("Account summary")).toBeTruthy();
    expect(getByText("Artist profiles: 1")).toBeTruthy();
    expect(getByText("Music purchases: 3")).toBeTruthy();
    expect(queryByText(/Artist subscriptions:/)).toBeNull();
    expect(queryByText(/Merch purchases:/)).toBeNull();
  });

  test("Delete account finishes on mirlo.space and refreshes the user afterward", async () => {
    const Screen = importScreen();
    const { getAllByText } = render(<Screen />);

    // getAllByText returns [title, button-label]; press the button
    const matches = getAllByText("Delete account");
    fireEvent.press(matches[matches.length - 1]);

    await waitFor(() => {
      expect(mockOpenInBrowser).toHaveBeenCalledWith(
        "https://mirlo.space/account",
      );
      expect(mockRefreshLoggedInUser).toHaveBeenCalled();
    });
    // The account is still there, so the screen stays
    expect(mockDismiss).not.toHaveBeenCalled();
  });

  test("dismisses to home once the account is gone after the browser closes", async () => {
    const Screen = importScreen();
    const { getAllByText, rerender } = render(<Screen />);

    const matches = getAllByText("Delete account");
    fireEvent.press(matches[matches.length - 1]);
    await waitFor(() => expect(mockRefreshLoggedInUser).toHaveBeenCalled());

    mockCurrentUser = null;
    rerender(<Screen />);

    expect(mockDismiss).toHaveBeenCalledWith("/");
  });

  test("button press is a no-op when there is no logged-in user", () => {
    mockCurrentUser = null;

    const Screen = importScreen();
    const { getAllByText } = render(<Screen />);

    // The button is disabled without a user
    const matches = getAllByText("Delete account");
    fireEvent.press(matches[matches.length - 1]);

    expect(mockOpenInBrowser).not.toHaveBeenCalled();
    expect(mockDismiss).not.toHaveBeenCalled();
  });
});
