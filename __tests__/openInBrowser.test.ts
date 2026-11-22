import * as WebBrowser from "expo-web-browser";
import { Alert, Linking, Platform } from "react-native";

import { openInBrowser, openInSystemBrowser } from "@/scripts/openInBrowser";
import en from "../translation/en.json";
import "../i18n";

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(),
  getCustomTabsSupportingBrowsersAsync: jest.fn(),
}));
const openBrowserAsync = WebBrowser.openBrowserAsync as jest.Mock;
const findBrowsers =
  WebBrowser.getCustomTabsSupportingBrowsersAsync as jest.Mock;
const openURL = jest.spyOn(Linking, "openURL");
const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
const logError = jest.spyOn(console, "error").mockImplementation(() => {});

const url = "https://mirlo.space/login";
const error = new Error("failed");
const { title, message } = en.mobileApp.browser;
// Title, optional message, a Close button, and Back or a tap outside closes it
const shown = (body?: string) => [
  title,
  body,
  [{ text: en.common.close }],
  { cancelable: true },
];

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "android";
  findBrowsers.mockResolvedValue({ browserPackages: ["com.android.chrome"] });
});
afterEach(() => {
  Platform.OS = "ios";
});

describe("openInBrowser", () => {
  test("tells the user on Android when no browser can take the page", async () => {
    findBrowsers.mockResolvedValueOnce({ browserPackages: [] });
    expect(await openInBrowser(url)).toBe(false);
    expect(alert.mock.calls).toEqual([shown(message)]);
    expect(openBrowserAsync).not.toHaveBeenCalled();
  });

  test.each(["lookup", "open"])(
    "tells the user on Android when the %s fails, without the install advice",
    async (step) => {
      const failing = step === "lookup" ? findBrowsers : openBrowserAsync;
      failing.mockRejectedValueOnce(error);
      expect(await openInBrowser(url)).toBe(false);
      expect(alert.mock.calls).toEqual([shown()]);
      expect(logError).toHaveBeenCalledWith(error);
    },
  );

  test("leaves iOS alone: true when it opens, a failure still rejects", async () => {
    Platform.OS = "ios";
    expect(await openInBrowser(url)).toBe(true);
    openBrowserAsync.mockRejectedValueOnce(error);
    await expect(openInBrowser(url)).rejects.toBe(error);
    expect(alert).not.toHaveBeenCalled();
  });
});

describe("openInSystemBrowser", () => {
  test("tells the user on Android when no browser can open a web link", async () => {
    openURL.mockRejectedValueOnce(error);
    await openInSystemBrowser("https://example.com");
    expect(alert.mock.calls).toEqual([shown(message)]);
    expect(logError).toHaveBeenCalledWith(error);
  });

  test("keeps rejecting for a mailto: link on Android and any link on iOS", async () => {
    openURL.mockRejectedValueOnce(error).mockRejectedValueOnce(error);
    await expect(openInSystemBrowser("mailto:hi@mirlo.space")).rejects.toBe(
      error,
    );
    Platform.OS = "ios";
    await expect(openInSystemBrowser("https://example.com")).rejects.toBe(
      error,
    );
    expect(alert).not.toHaveBeenCalled();
  });
});
