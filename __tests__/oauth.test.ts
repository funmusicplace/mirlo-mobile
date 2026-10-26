import { refreshTokens } from "@/queries/fetch/oauth";
import { fetchDiscoveryAsync, refreshAsync } from "expo-auth-session";

jest.mock("@/constants/api-root", () => ({
  API_ROOT: "https://api.mirlo.space",
}));
jest.mock("@/constants/oauth", () => ({
  OAUTH_CLIENT_ID: "5",
  OAUTH_REDIRECT_URI: "mirlo://oauth/callback",
}));
jest.mock("expo-auth-session", () => ({
  fetchDiscoveryAsync: jest.fn(),
  refreshAsync: jest.fn(),
}));

const mockedFetchDiscovery = fetchDiscoveryAsync as jest.Mock;

// Each host's document lists endpoints on that host
const discoveries: Record<string, unknown> = {
  "https://api.mirlo.space": {
    tokenEndpoint: "https://api.mirlo.space/auth/oidc/token",
    discoveryDocument: { issuer: "https://mirlo.space" },
  },
  "https://mirlo.space": {
    tokenEndpoint: "https://mirlo.space/auth/oidc/token",
    discoveryDocument: { issuer: "https://mirlo.space" },
  },
};

describe("OAuth discovery", () => {
  test("refreshes against the issuer's endpoints when API_ROOT is another host", async () => {
    mockedFetchDiscovery.mockImplementation(
      async (url: string) => discoveries[url],
    );

    await refreshTokens("refresh-token");

    expect(mockedFetchDiscovery.mock.calls).toEqual([
      ["https://api.mirlo.space"],
      ["https://mirlo.space"],
    ]);
    expect(refreshAsync).toHaveBeenCalledWith(
      { clientId: "5", refreshToken: "refresh-token" },
      discoveries["https://mirlo.space"],
    );
  });
});
