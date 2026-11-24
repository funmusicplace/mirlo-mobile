import React from "react";
import { AppState, AppStateStatus, RefreshControl } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
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
let mockInstances = [
  { apiRoot: "https://api.test", name: "Mirlo", siteUrl: "https://test" },
];
jest.mock("@/state/InstancesContext", () => ({
  useInstances: () => ({ instances: mockInstances, loaded: true }),
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

// RN's AppState mock keeps no listeners, so the test keeps the live one
let onAppState: ((state: AppStateStatus) => void) | undefined;
const changeAppState = (...states: AppStateStatus[]) =>
  act(async () => states.forEach((state) => onAppState?.(state)));
// Lets TanStack's zero-delay notification reach the screen
const tick = () => act(async () => jest.advanceTimersByTime(1));

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
  mockGetMany.mockReset();
  mockInstances = mockInstances.slice(0, 1);
  jest.spyOn(AppState, "addEventListener").mockImplementation((_, listener) => {
    onAppState = listener as (state: AppStateStatus) => void;
    return { remove: () => (onAppState = undefined) };
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const badRequest = (message: string) =>
  new MirloFetchError({ status: 400 } as Response, message);

const renderHome = (setIsDataLoaded = jest.fn()) => {
  // The app's own retry rule
  const client = new QueryClient({
    defaultOptions: appQueryClient.getDefaultOptions(),
  });
  const home = () => (
    <QueryClientProvider client={client}>
      <AppReadyContextProvider value={{ isDataLoaded: false, setIsDataLoaded }}>
        <Index />
      </AppReadyContextProvider>
    </QueryClientProvider>
  );
  const view = render(home());
  return { rerender: () => view.rerender(home()) };
};

test("a failed first request ends the splash and keeps the home header above the error", async () => {
  mockGetMany.mockRejectedValue(badRequest("Bad request"));
  const setIsDataLoaded = jest.fn();
  renderHome(setIsDataLoaded);

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

test("Try again, a pull and a return from the background retry, with the box kept through each", async () => {
  let fail!: (error: Error) => void;
  mockGetMany
    .mockRejectedValueOnce(badRequest("Bad request"))
    .mockReturnValueOnce(new Promise((_, reject) => (fail = reject)))
    .mockRejectedValueOnce(badRequest("Pulled"))
    .mockResolvedValueOnce({ results: [] });
  renderHome();
  await screen.findByText("Bad request");

  // The same button stays, busy, so a screen reader keeps its focus
  const retry = screen.getByRole("button", { name: "Try again" });
  fireEvent.press(retry);
  await tick();
  expect(retry.props.accessibilityState.busy).toBe(true);
  expect(screen.getByRole("button", { name: "Try again" })).toBe(retry);
  expect(screen.queryByText("Explore music")).toBeNull();
  // The busy button shows the retry, a pull spinner would shift the box on iOS
  expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
  // Dismiss works mid-retry, and the next failure brings the box back
  fireEvent.press(screen.getByRole("button", { name: "Dismiss" }));
  expect(screen.queryByText("Bad request")).toBeNull();
  await act(async () => fail(badRequest("Still down")));
  expect(await screen.findByText("Still down")).toBeTruthy();
  fireEvent(screen.UNSAFE_getByType(RefreshControl), "refresh");
  expect(await screen.findByText("Pulled")).toBeTruthy();
  // Closing an iOS overlay is no return, a loaded home ignores returns
  await changeAppState("inactive", "active");
  expect(mockGetMany).toHaveBeenCalledTimes(3);
  await changeAppState("background", "active");
  expect(await screen.findByText("Explore music")).toBeTruthy();
  await changeAppState("background", "active");
  expect(mockGetMany).toHaveBeenCalledTimes(4);
});

test("switching back to a source that failed shows the spinner, not its old error", async () => {
  mockGetMany
    .mockRejectedValueOnce(badRequest("Mirlo is down"))
    .mockResolvedValueOnce({ results: [] })
    .mockResolvedValueOnce({ results: [] })
    .mockReturnValueOnce(new Promise(() => undefined));
  const [mirlo] = mockInstances;
  const { rerender } = renderHome();
  await screen.findByText("Mirlo is down");

  mockInstances = [mirlo, { ...mirlo, apiRoot: "https://other.test" }];
  rerender();
  await screen.findByText("Explore music");

  mockInstances = [mirlo];
  rerender();
  await tick();
  expect(mockGetMany).toHaveBeenCalledTimes(4);
  expect(screen.queryByText("Mirlo is down")).toBeNull();
});
