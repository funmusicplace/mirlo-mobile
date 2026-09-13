import { redirectSystemPath } from "@/app/+native-intent";
import { MirloFetchError } from "@/queries/fetch/MirloFetchError";
import { queryClient } from "@/queries/QueryClientWrapper";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

jest.mock("@preeternal/react-native-cookie-manager", () => ({
  __esModule: true,
  default: { get: jest.fn(), getAll: jest.fn(), clearAll: jest.fn() },
}));
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

  test("opens web-only links in the browser without navigating", async () => {
    for (const p of [
      "https://mirlo.space/login",
      "https://mirlo.space/manage/artists/4",
      "https://mirlo.space/arod/release/x/download",
      "https://mirlo.space/arod/posts/5",
    ]) {
      expect(await redirect(p)).toBe("");
      await flush();
      expect(openBrowserAsync.mock.calls.at(-1)[0]).toBe(p);
    }
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

  test("leaves other URLs untouched", async () => {
    expect(await redirect("mirlo:///artist/arod/artist-page")).toBe(
      "mirlo:///artist/arod/artist-page",
    );
    expect(await redirect("not a url")).toBe("not a url");
  });
});
