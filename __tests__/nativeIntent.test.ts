import { redirectSystemPath } from "@/app/+native-intent";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(),
  getCustomTabsSupportingBrowsersAsync: jest.fn(async () => ({
    preferredBrowserPackage: "com.android.chrome",
    browserPackages: ["com.android.chrome"],
  })),
}));
const openBrowserAsync = WebBrowser.openBrowserAsync as jest.Mock;

const redirect = (path: string) => redirectSystemPath({ path, initial: false });

describe("redirectSystemPath", () => {
  test("maps artist, release and track links to app routes", () => {
    expect(redirect("https://mirlo.space/arod")).toBe(
      "/artist/arod/artist-page",
    );
    expect(redirect("https://mirlo.space/arod/")).toBe(
      "/artist/arod/artist-page",
    );
    expect(redirect("https://mirlo.space/arod/release/penaflor-single")).toBe(
      "/artist/arod/album/penaflor-single/album-tracks",
    );
    expect(
      redirect(
        "https://mirlo.space/arod/release/penaflor-single/tracks/12?x=1",
      ),
    ).toBe("/artist/arod/album/penaflor-single/tracks/12");
    expect(redirect("https://mirlo.space/")).toBe("/");
  });

  test("opens web-only links in the browser without navigating", async () => {
    for (const p of [
      "https://mirlo.space/login",
      "https://mirlo.space/manage/artists/4",
      "https://mirlo.space/arod/release/x/download",
      "https://mirlo.space/arod/posts/5",
    ]) {
      expect(redirect(p)).toBe("");
      await Promise.resolve();
      expect(openBrowserAsync.mock.calls.at(-1)[0]).toBe(p);
    }
  });

  test("names an explicit browser package on Android so the link can't loop back", async () => {
    Platform.OS = "android";
    redirect("https://mirlo.space/login");
    await new Promise((r) => setTimeout(r, 0));
    expect(openBrowserAsync.mock.calls.at(-1)[1]).toEqual({
      browserPackage: "com.android.chrome",
    });
    Platform.OS = "ios";
  });

  test("leaves other URLs untouched", () => {
    expect(redirect("mirlo:///artist/arod/artist-page")).toBe(
      "mirlo:///artist/arod/artist-page",
    );
    expect(redirect("not a url")).toBe("not a url");
  });
});
