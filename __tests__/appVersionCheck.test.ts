import { Alert } from "react-native";
import {
  checkForUpdates,
  compareVersions,
  isVersionGreater,
} from "@/scripts/appVersionCheck";

jest.mock("expo-application", () => ({
  applicationId: "space.mirlo.mobile",
  nativeApplicationVersion: "1.0.4",
  nativeBuildVersion: "1",
}));

describe("checkForUpdates", () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  const storeVersion = (version: string) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ version, trackViewUrl: "https://apps.apple.com/app" }],
      }),
    });
  };
  afterEach(() => alert.mockClear());

  test("compares the app version, not the build number", async () => {
    storeVersion("1.0.3");
    expect(await checkForUpdates()).toBe(false);
    expect(alert).not.toHaveBeenCalled();
  });

  test("asks for an update when the store is ahead", async () => {
    storeVersion("1.0.5");
    expect(await checkForUpdates()).toBe(true);
    expect(alert.mock.calls[0][1]).toContain("This version (1.0.4)");
  });
});

describe("compareVersions", () => {
  test("returns 0 for equal versions", () => {
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
    expect(compareVersions("2.3.4", "2.3.4")).toBe(0);
  });

  test("returns 1 when v1 is greater", () => {
    expect(compareVersions("1.0.1", "1.0.0")).toBe(1);
    expect(compareVersions("2.0.0", "1.99.99")).toBe(1);
    expect(compareVersions("1.10.0", "1.9.0")).toBe(1);
  });

  test("returns -1 when v1 is smaller", () => {
    expect(compareVersions("1.0.0", "1.0.1")).toBe(-1);
    expect(compareVersions("1.99.99", "2.0.0")).toBe(-1);
    expect(compareVersions("1.9.0", "1.10.0")).toBe(-1);
  });

  test("pads shorter versions with zeros", () => {
    expect(compareVersions("1.0", "1.0.0")).toBe(0);
    expect(compareVersions("1", "1.0.0")).toBe(0);
    expect(compareVersions("1.1", "1.0.5")).toBe(1);
  });

  test("strips non-numeric characters except dots", () => {
    expect(compareVersions("v1.0.0", "1.0.0")).toBe(0);
    expect(compareVersions("1.0.0-beta", "1.0.0")).toBe(0);
    expect(compareVersions("1.0.1-rc1", "1.0.0")).toBe(1);
  });

  test("handles build numbers vs semver-style", () => {
    expect(compareVersions("42", "41")).toBe(1);
    expect(compareVersions("100", "99")).toBe(1);
  });
});

describe("isVersionGreater", () => {
  test("true when v1 > v2", () => {
    expect(isVersionGreater("1.0.1", "1.0.0")).toBe(true);
    expect(isVersionGreater("2.0.0", "1.99.99")).toBe(true);
  });

  test("false when v1 == v2", () => {
    expect(isVersionGreater("1.0.0", "1.0.0")).toBe(false);
  });

  test("false when v1 < v2", () => {
    expect(isVersionGreater("1.0.0", "1.0.1")).toBe(false);
  });
});
