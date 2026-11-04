/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { createMockUser } from "@/__mocks__/mockUser";

const mockPost = jest.fn();
const mockDismiss = jest.fn();
let mockSendToken: (token: string | null) => void;

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ trackGroupId: "42" }),
  useRouter: () => ({ dismiss: mockDismiss }),
}));

// Jest resolves the modal's relative import to this same module
jest.mock("@/queries/fetch/fetchWrapper", () => ({
  post: (...args: unknown[]) => mockPost(...args),
}));

const mockUser = createMockUser();
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({ user: mockUser }),
}));

jest.mock("@/components/DismissModalBar", () => ({
  __esModule: true,
  default: () => null,
}));

// Stands in for the web view, the test sends the token
jest.mock("@/components/Turnstile", () => ({
  __esModule: true,
  default: ({ onToken }: { onToken: (token: string | null) => void }) => {
    mockSendToken = onToken;
    return null;
  },
}));

// Local strings, so a Transifex token in the env can't change them
jest.mock("react-i18next", () => {
  const en = jest.requireActual("@/translation/en.json");
  const t = (key: string) =>
    key.split(".").reduce((node, part) => node?.[part], en) ?? key;
  return { useTranslation: () => ({ t }) };
});

const importScreen = () => require("@/app/reportAlbumModal").default;

const fillIn = () => {
  // The reason group shares its question with the description field
  const description = screen.getAllByLabelText("Why are you flagging it?");
  fireEvent.changeText(description[description.length - 1], "Not theirs");
  fireEvent.press(screen.getByRole("radio", { name: "Inappropriate content" }));
};

describe("<ReportAlbumModal />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("prefills the email and reports once the check sends a token", async () => {
    mockPost.mockResolvedValue({ message: "success" });
    const Screen = importScreen();
    render(<Screen />);

    expect(screen.getByLabelText("How can we contact you?").props.value).toBe(
      "test@example.com",
    );
    fillIn();
    expect(
      screen.getByRole("button", { name: "Report", disabled: true }),
    ).toBeTruthy();

    act(() => mockSendToken("token"));
    fireEvent.press(
      screen.getByRole("button", { name: "Report", disabled: false }),
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
    });
    expect(mockPost).toHaveBeenCalledWith("/v1/flag", {
      reason: "inappropriateContent",
      email: "test@example.com",
      description: "Not theirs",
      cfTurnstile: "token",
      trackGroupId: 42,
    });
    expect(
      screen.getByText(
        "Successfully reported a problem with this content. We will investigate it.",
      ),
    ).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  test("a failed report shows the error and waits for a new token", async () => {
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockPost.mockRejectedValue(new Error("Sounds like a robot"));
    const Screen = importScreen();
    render(<Screen />);

    fillIn();
    act(() => mockSendToken("token"));
    fireEvent.press(screen.getByRole("button", { name: "Report" }));

    await waitFor(() => {
      expect(
        screen.getByText("An error happened while reporting this content"),
      ).toBeTruthy();
    });
    // The used token is gone, so the remounted check has to pass again
    expect(
      screen.getByRole("button", { name: "Report", disabled: true }),
    ).toBeTruthy();
    act(() => mockSendToken("fresh"));
    expect(
      screen.getByRole("button", { name: "Report", disabled: false }),
    ).toBeTruthy();

    errorSpy.mockRestore();
  });
});
