// Default each mocked async function to a resolved Promise: the source
// code chains .catch() on the return values, which would otherwise
// throw "Cannot read properties of undefined (reading 'catch')"
jest.mock("@preeternal/react-native-cookie-manager", () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({}),
    getAll: jest.fn().mockResolvedValue({}),
    clearAll: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/constants/api-root", () => ({ API_ROOT: "https://test.api" }));
jest.mock("@/constants/api-key", () => ({ API_KEY: "test-key" }));

import { clearLegacySession } from "@/queries/authQueries";
import CookieManager from "@preeternal/react-native-cookie-manager";
import * as SecureStore from "expo-secure-store";

const cm = CookieManager as unknown as {
  clearAll: jest.Mock;
};

const deleteItem = SecureStore.deleteItemAsync as jest.MockedFunction<
  typeof SecureStore.deleteItemAsync
>;

describe("clearLegacySession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("clears cookies (both webview stores) and removes both stored tokens", async () => {
    cm.clearAll.mockResolvedValue(true);

    await clearLegacySession();

    // both passes are called: false (default cookie store) + true (WebKit
    // cookie store on iOS)
    expect(cm.clearAll).toHaveBeenCalledTimes(2);
    expect(cm.clearAll).toHaveBeenNthCalledWith(1);
    expect(cm.clearAll).toHaveBeenNthCalledWith(2, true);

    expect(deleteItem).toHaveBeenCalledWith("jwt");
    expect(deleteItem).toHaveBeenCalledWith("refresh");
  });

  test("swallows clearAll rejection so a partial failure doesn't break startup", async () => {
    cm.clearAll.mockRejectedValue(new Error("oops"));

    await expect(clearLegacySession()).resolves.toBeUndefined();

    expect(deleteItem).toHaveBeenCalledWith("jwt");
    expect(deleteItem).toHaveBeenCalledWith("refresh");
  });

  test("swallows secure-store rejection so a partial failure doesn't break startup", async () => {
    cm.clearAll.mockResolvedValue(true);
    deleteItem.mockRejectedValue(new Error("ks unavailable"));

    await expect(clearLegacySession()).resolves.toBeUndefined();
  });
});
