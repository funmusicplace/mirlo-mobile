/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

import { createMockUser } from "@/__mocks__/mockUser";

const mockDismiss = jest.fn();
const mockPush = jest.fn();
const mockOpenInBrowser = jest.fn();
const mockRefreshLoggedInUser = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    dismiss: mockDismiss,
    dismissTo: mockDismiss,
    push: mockPush,
  }),
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

// Real i18next on the local strings: a Transifex token in the env can't
// change them and plurals resolve
jest.mock("react-i18next", () => {
  const i18n = jest.requireActual("i18next").createInstance();
  i18n.init({
    lng: "en",
    resources: {
      en: { translation: jest.requireActual("@/translation/en.json") },
    },
    interpolation: { escapeValue: false },
    showSupportNotice: false,
  });
  const t = i18n.t.bind(i18n);
  return { useTranslation: () => ({ t }) };
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

  test("the warning lines use the singular for one and the plural for more", () => {
    mockCurrentUser = createMockUser({
      artists: [{ id: 1 }, { id: 2 }] as unknown as Artist[],
      artistUserSubscriptions: [
        { id: 1 },
      ] as unknown as LoggedInUser["artistUserSubscriptions"],
      userTrackGroupPurchases: [{ trackGroupId: 10 }],
      userTrackPurchases: [],
      merchPurchase: [{ id: 1 }, { id: 2 }] as unknown as MerchPurchase[],
    });
    const Screen = importScreen();
    const { getByText } = render(<Screen />);

    expect(getByText("This account has 2 artist profiles.")).toBeTruthy();
    expect(
      getByText("This account has 1 active artist subscription."),
    ).toBeTruthy();
    expect(getByText("This account has 1 music purchase.")).toBeTruthy();
    expect(getByText("This account has 2 merch purchases.")).toBeTruthy();
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
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("signed out visitors go to login and never see the button", () => {
    mockCurrentUser = null;

    const Screen = importScreen();
    const { queryByText } = render(<Screen />);

    expect(mockPush).toHaveBeenCalledWith("/login");
    expect(queryByText("Delete account")).toBeNull();
    expect(mockOpenInBrowser).not.toHaveBeenCalled();
  });
});
