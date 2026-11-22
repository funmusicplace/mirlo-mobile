import React from "react";
import { act, render, screen } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "@/app/index";
import { MirloFetchError } from "@/queries/fetch/MirloFetchError";
import { queryClient as appQueryClient } from "@/queries/QueryClientWrapper";
import { AppReadyContextProvider } from "@/state/AppReadyContext";

const mockGetMany = jest.fn();
jest.mock("@/queries/fetch/fetchWrapper", () => ({
  getMany: (...args: unknown[]) => mockGetMany(...args),
}));

// A localhost root ends the splash without any data
jest.mock("@/constants/api-root", () => ({ API_ROOT: "https://api.test" }));
jest.mock("expo-router", () => ({
  router: {},
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: jest.requireActual("react-native").View,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({ user: null }),
}));
jest.mock("@/state/InstancesContext", () => ({
  useInstances: () => ({
    instances: [
      { apiRoot: "https://api.test", name: "Mirlo", siteUrl: "https://test" },
    ],
    loaded: true,
  }),
}));

// Local strings, so a Transifex token in the env can't change them
jest.mock("react-i18next", () => {
  const en = jest.requireActual("@/translation/en.json");
  const t = (key: string) =>
    key.split(".").reduce((node, part) => node?.[part], en) ?? key;
  return { useTranslation: () => ({ t }) };
});

// The real icon set sets state after its font loads, outside act
jest.mock("@expo/vector-icons/FontAwesome5", () => "FontAwesome5");
jest.mock("@/components/PlayFeaturedButton", () => "PlayFeaturedButton");

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test("a failed first request ends the splash and keeps the home header above the error", async () => {
  mockGetMany.mockRejectedValue(
    new MirloFetchError({ status: 400 } as Response, "Bad request"),
  );
  const setIsDataLoaded = jest.fn();
  render(
    // The app's own retry rule
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: appQueryClient.getDefaultOptions() })
      }
    >
      <AppReadyContextProvider value={{ isDataLoaded: false, setIsDataLoaded }}>
        <Index />
      </AppReadyContextProvider>
    </QueryClientProvider>,
  );

  expect(await screen.findByText("Bad request")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Mirlo" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Menu" })).toBeTruthy();
  expect(setIsDataLoaded).not.toHaveBeenCalled();
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(setIsDataLoaded).toHaveBeenCalledWith(true);
});
