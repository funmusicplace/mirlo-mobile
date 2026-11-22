import React from "react";
import { ActivityIndicator, VirtualizedList } from "react-native";
import { act, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "@/app/index";
import { MirloFetchError } from "@/queries/fetch/MirloFetchError";
import { queryClient as appQueryClient } from "@/queries/QueryClientWrapper";

const mockGetMany = jest.fn();
jest.mock("@/queries/fetch/fetchWrapper", () => ({
  getMany: (...args: unknown[]) => mockGetMany(...args),
}));

jest.mock("@/constants/api-root", () => ({ API_ROOT: "https://api.test" }));
jest.mock("expo-router", () => ({
  router: {},
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => ({
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

// What the native side reports: a 600 tall window on 2000 of content, and 100
// more under the spinner footer while it shows
const WINDOW = 600;
const END = 2000 - WINDOW;
let stamp = 0;
const list = () => screen.UNSAFE_getByType(VirtualizedList).instance;
const footer = () => screen.UNSAFE_queryAllByType(ActivityIndicator).length > 0;
const content = () => 2000 + (footer() ? 100 : 0);
const resize = () =>
  act(async () => list()._onContentSizeChange(390, content()));
const scrollTo = (offset: number) =>
  act(async () =>
    list()._onScroll({
      timeStamp: ++stamp,
      nativeEvent: {
        contentOffset: { x: 0, y: offset },
        contentSize: { width: 390, height: content() },
        layoutMeasurement: { width: 390, height: WINDOW },
        zoomScale: 1,
      },
    }),
  );

test("a failed next page is asked for again only after a scroll, once per scroll", async () => {
  const fail: (() => void)[] = [];
  mockGetMany.mockImplementation(() =>
    mockGetMany.mock.calls.length === 1
      ? Promise.resolve({
          results: Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            title: `Release ${i + 1}`,
            urlSlug: `release-${i + 1}`,
            artistId: 7,
            artist: { name: "Joni Void" },
            cover: null,
          })),
        })
      : new Promise((_, reject) =>
          fail.push(() =>
            reject(new MirloFetchError({ status: 400 } as Response, "Bad")),
          ),
        ),
  );
  // The app's own retry rule, and no gc timer that would keep jest open
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        ...appQueryClient.getDefaultOptions().queries,
        gcTime: Infinity,
      },
    },
  });
  render(
    <QueryClientProvider client={client}>
      <Index />
    </QueryClientProvider>,
  );
  expect(await screen.findByText("Release 1")).toBeTruthy();
  await act(async () =>
    list()._onLayout({
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: WINDOW } },
    }),
  );
  await resize();

  // The request fails: the spinner footer goes, which leaves the list at its
  // end again and makes it ask for the page once more, unless it is held back.
  // The listener drags into the spinner meanwhile, a scroll of that request
  const failPage = async () => {
    await waitFor(() => expect(footer()).toBe(true));
    await resize();
    await scrollTo(END + 50);
    await act(async () => fail.shift()!());
    await waitFor(() => expect(footer()).toBe(false));
    await resize();
  };

  await scrollTo(END);
  expect(mockGetMany).toHaveBeenCalledTimes(2);
  await failPage();
  expect(mockGetMany).toHaveBeenCalledTimes(2);

  await scrollTo(END - 300);
  await scrollTo(END);
  expect(mockGetMany).toHaveBeenCalledTimes(3);
  await failPage();
  expect(mockGetMany).toHaveBeenCalledTimes(3);
});
