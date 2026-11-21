/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { createMockUser } from "@/__mocks__/mockUser";

const mockPost = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ trackGroupId: "42" }),
  useRouter: () => ({ push: jest.fn() }),
}));

// Jest resolves the hook's relative import to this same module
jest.mock("@/queries/fetch/fetchWrapper", () => ({
  post: (...args: unknown[]) => mockPost(...args),
}));

const mockUser = createMockUser({ email: "name+tag@example.com" });
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({ user: mockUser }),
}));

jest.mock("@/state/PlayerContext", () => ({
  usePlayer: () => ({ activeTrack: { trackGroup: { id: 42 } } }),
}));

jest.mock("@/components/DismissModalBar", () => ({
  __esModule: true,
  default: () => null,
}));

// The real icon sets state after its font loads, outside act
jest.mock("@expo/vector-icons/Ionicons", () => "Ionicons");

// Local strings, so a Transifex token in the env can't change them
jest.mock("react-i18next", () => {
  const en = jest.requireActual("@/translation/en.json");
  const t = (key: string) =>
    key.split(".").reduce((node, part) => node?.[part], en) ?? key;
  return { useTranslation: () => ({ t }) };
});

const screens = [
  [
    "EmailPurchaseInfoModal",
    () => require("@/app/emailPurchaseInfoModal").default,
  ],
  ["MaxPlaysReached", () => require("@/app/maxPlaysReached").default],
] as const;

const SEND = { name: "Email Purchase Info" };

describe.each(screens)("<%s />", (_name, importScreen) => {
  const renderScreen = () => {
    const Screen = importScreen();
    return render(
      // No gc timer, it would keep jest open
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { mutations: { gcTime: Infinity } },
          })
        }
      >
        <Screen />
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("sends one request with the address encoded and reads Email Sent! once it resolves", async () => {
    let answer!: (value: unknown) => void;
    mockPost.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    renderScreen();

    // The second press lands before the busy state has rendered
    const send = screen.getByRole("button", SEND);
    fireEvent.press(send);
    fireEvent.press(send);

    // In flight, so the button is busy and a later press does nothing
    const busy = await screen.findByRole("button", { ...SEND, busy: true });
    fireEvent.press(busy);
    expect(screen.queryByText("Email Sent!")).toBeNull();

    await act(async () => answer({ message: "success" }));
    expect(
      await screen.findByRole("button", {
        name: "Email Sent!",
        disabled: true,
      }),
    ).toBeTruthy();
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith(
      "/v1/trackGroups/42/emailPurchaseLink?email=name%2Btag%40example.com",
      {},
    );
  });

  test("a rejected request shows the failure and the button can retry", async () => {
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockPost
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValue({ message: "success" });
    renderScreen();

    fireEvent.press(screen.getByRole("button", SEND));

    expect(await screen.findByText("Something went wrong")).toBeTruthy();
    expect(screen.queryByText("Email Sent!")).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      "issue emailing purchase info",
      expect.any(Error),
    );

    fireEvent.press(screen.getByRole("button", { ...SEND, disabled: false }));

    expect(
      await screen.findByRole("button", { name: "Email Sent!" }),
    ).toBeTruthy();
    expect(screen.queryByText("Something went wrong")).toBeNull();
    expect(mockPost).toHaveBeenCalledTimes(2);

    errorSpy.mockRestore();
  });
});
