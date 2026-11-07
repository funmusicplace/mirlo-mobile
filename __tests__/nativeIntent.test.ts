import { redirectSystemPath } from "@/app/+native-intent";
import { MirloFetchError } from "@/queries/fetch/MirloFetchError";
import { queryClient } from "@/queries/QueryClientWrapper";
import * as WebBrowser from "expo-web-browser";
import { Linking, Platform } from "react-native";

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(),
  getCustomTabsSupportingBrowsersAsync: jest.fn(async () => ({
    preferredBrowserPackage: "com.android.chrome",
    browserPackages: ["com.android.chrome"],
  })),
}));
const openBrowserAsync = WebBrowser.openBrowserAsync as jest.Mock;

// Only "arod" exists; everything else 404s like the real API
jest
  .spyOn(queryClient, "fetchQuery")
  .mockImplementation(async ({ queryKey }: any) =>
    queryKey[1].artistSlug === "arod"
      ? { id: 4 }
      : Promise.reject(
          new MirloFetchError({ status: 404 } as Response, "Artist not found"),
        ),
  );

const redirect = (path: string) => redirectSystemPath({ path, initial: false });
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("redirectSystemPath", () => {
  test("maps artist, release and track links to app routes", async () => {
    expect(await redirect("https://mirlo.space/arod")).toBe(
      "/artist/arod/artist-page",
    );
    expect(await redirect("https://mirlo.space/arod/releases")).toBe(
      "/artist/arod/artist-page",
    );
    expect(
      await redirect("https://mirlo.space/arod/release/penaflor-single"),
    ).toBe("/artist/arod/album/penaflor-single/album-tracks");
    expect(
      await redirect(
        "https://mirlo.space/arod/release/penaflor-single/tracks/12?x=1",
      ),
    ).toBe("/artist/arod/album/penaflor-single/tracks/12");
    expect(await redirect("https://mirlo.space/")).toBe("/");
  });

  test("hands web-only links to Safari without navigating", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    for (const p of [
      "https://mirlo.space/login",
      "https://mirlo.space/manage/artists/4",
      "https://mirlo.space/arod/release/x/download",
      "https://mirlo.space/arod/posts/5",
    ]) {
      expect(await redirect(p)).toBe("");
      await flush();
      expect(openURL).toHaveBeenLastCalledWith(p);
    }
    expect(openBrowserAsync).not.toHaveBeenCalled();
  });

  test("still opens the artist page when the API check fails for another reason", async () => {
    (queryClient.fetchQuery as jest.Mock).mockRejectedValueOnce(
      new TypeError("Network request failed"),
    );
    expect(await redirect("https://mirlo.space/someone")).toBe(
      "/artist/someone/artist-page",
    );
  });

  test("names an explicit browser package on Android so the link can't loop back", async () => {
    Platform.OS = "android";
    await redirect("https://mirlo.space/login");
    await flush();
    expect(openBrowserAsync.mock.calls.at(-1)[1]).toEqual({
      browserPackage: "com.android.chrome",
    });
    Platform.OS = "ios";
  });

  test("leaves navigation alone for the sign-in redirect", async () => {
    expect(
      await redirect(
        "mirlo://oauth/callback?code=abc&state=xyz&iss=https%3A%2F%2Fmirlo.space",
      ),
    ).toBe("");
  });

  test("leaves other URLs untouched", async () => {
    expect(await redirect("mirlo:///artist/arod/artist-page")).toBe(
      "mirlo:///artist/arod/artist-page",
    );
    expect(await redirect("not a url")).toBe("not a url");
  });

  test("opens Now Playing from the player notification", async () => {
    const path = "trackplayer://notification.click";
    expect(await redirect(path)).toBe("/now-playing");
    expect(await redirectSystemPath({ path, initial: true })).toBe("");
  });
});

describe("a link that remounts the app on Android", () => {
  const route = (slug: string) => `/artist/arod/album/${slug}/album-tracks`;
  const link = (slug: string, repeated = false) => ({
    href: route(slug),
    repeated,
  });
  // Fresh modules stand in for a fresh JS context
  const load = (os: "ios" | "android") => {
    jest.resetModules();
    const { Platform, PixelRatio } = jest.requireActual("react-native");
    Platform.OS = os;
    const fontScale = jest.spyOn(PixelRatio, "getFontScale");
    const mod = jest.requireActual<typeof import("@/app/+native-intent")>(
      "@/app/+native-intent",
    );
    const open = jest.fn();
    const launch = (slug: string) =>
      mod.redirectSystemPath({
        path: `https://mirlo.space/arod/release/${slug}`,
        initial: true,
      });
    // A cold start resolves its link before RootLayout subscribes
    const mount = () => mod.subscribeToRelaunchLink(open);
    // What RootLayout asks once navigation is ready
    const shouldOpen = () =>
      mod.shouldOpenRelaunchLink(open.mock.calls.at(-1)[0]);
    return { open, mount, launch, shouldOpen, fontScale };
  };

  test("maps the first launch as usual", async () => {
    const { open, mount, launch } = load("android");
    expect(await launch("a")).toBe(route("a"));
    mount();
    expect(open).not.toHaveBeenCalled();
  });

  test("hands a new link to RootLayout, now or once it subscribes", async () => {
    const { open, mount, launch, shouldOpen } = load("android");
    await launch("a");
    const unsubscribe = mount();
    expect(await launch("b")).toBe("");
    expect(open).toHaveBeenCalledWith(link("b"));
    expect(shouldOpen()).toBe(true);
    unsubscribe();
    await launch("c");
    expect(open).toHaveBeenCalledTimes(1);
    mount();
    expect(open).toHaveBeenLastCalledWith(link("c"));
    expect(shouldOpen()).toBe(true);
  });

  test("opens the same link again when the configuration is unchanged", async () => {
    const { open, mount, launch, shouldOpen } = load("android");
    await launch("a");
    mount();
    expect(await launch("a")).toBe("");
    expect(open).toHaveBeenCalledWith(link("a", true));
    expect(shouldOpen()).toBe(true);
  });

  test("keeps the restored screen when a font size change repeats the path", async () => {
    const { open, mount, launch, shouldOpen, fontScale } = load("android");
    await launch("a");
    mount();
    fontScale.mockReturnValue(1.3);
    expect(await launch("a")).toBe("");
    expect(open).toHaveBeenCalledWith(link("a", true));
    expect(shouldOpen()).toBe(false);
    await launch("a");
    expect(shouldOpen()).toBe(true);
  });

  test("hands a link over after a remount when the session began without one", async () => {
    const { open, mount, launch, shouldOpen } = load("android");
    mount();
    expect(await launch("a")).toBe("");
    expect(open).toHaveBeenCalledWith(link("a"));
    expect(shouldOpen()).toBe(true);
  });

  test("never hands links over on iOS", async () => {
    const { open, mount, launch } = load("ios");
    await launch("a");
    mount();
    expect(await launch("b")).toBe(route("b"));
    expect(open).not.toHaveBeenCalled();
  });
});
