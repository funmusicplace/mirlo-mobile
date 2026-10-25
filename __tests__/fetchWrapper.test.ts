import * as api from "@/queries/fetch/fetchWrapper";
import { MirloFetchError } from "@/queries/fetch/MirloFetchError";
import { refreshTokens } from "@/queries/fetch/oauth";
import {
  SessionEndedError,
  clearStoredSession,
  getStoredTokens,
  onSessionEnded,
  startSession,
} from "@/queries/fetch/session";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@/queries/fetch/oauth", () => ({ refreshTokens: jest.fn() }));

jest.mock("@/constants/api-root", () => ({ API_ROOT: "https://test.api" }));
jest.mock("@/constants/api-key", () => ({ API_KEY: "test-api-key" }));

import * as SecureStore from "expo-secure-store";

const mockedGetItem = SecureStore.getItemAsync as jest.MockedFunction<
  typeof SecureStore.getItemAsync
>;
const mockedRefreshTokens = refreshTokens as jest.MockedFunction<
  typeof refreshTokens
>;

const okJson = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

const errorJson = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const signedInTokens = {
  accessToken: "access-token-value",
  refreshToken: "refresh-token-value",
  expiresAt: Date.now() + 60 * 60 * 1000,
};

describe("fetchWrapper.get", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockedGetItem.mockResolvedValue(null);
    global.fetch = jest.fn();
    await clearStoredSession();
  });

  test("appends API_ROOT and forwards mirlo-api-key header", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(okJson({ ok: true }));

    await api.get("/v1/foo", {});

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://test.api/v1/foo");
    const headers = init.headers as Headers;
    expect(headers.get("mirlo-api-key")).toBe("test-api-key");
  });

  test("attaches the bearer token and keeps the api key when signed in", async () => {
    await startSession(signedInTokens);
    (global.fetch as jest.Mock).mockResolvedValueOnce(okJson({ ok: true }));

    await api.get("/v1/foo", {});

    const init = (global.fetch as jest.Mock).mock.calls[0][1];
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer access-token-value");
    expect(headers.get("mirlo-api-key")).toBe("test-api-key");
    expect(headers.has("Cookie")).toBe(false);
  });

  test("omits Authorization when signed out", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(okJson({ ok: true }));

    await api.get("/v1/foo", {});

    const headers = (global.fetch as jest.Mock).mock.calls[0][1]
      .headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  });

  test("returns parsed JSON on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      okJson({ result: { id: 1, title: "song" } }),
    );

    const data = await api.get<{ result: { id: number; title: string } }>(
      "/v1/tracks/1",
      {},
    );

    expect(data.result).toEqual({ id: 1, title: "song" });
  });

  test("falls back to raw text when response is not JSON", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("plaintext body", { status: 200 }),
    );

    const data = await api.get<string>("/v1/text", {});
    expect(data).toBe("plaintext body");
  });

  test("throws MirloFetchError on non-2xx response with the API's error message", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      errorJson(401, { error: "Invalid jwt" }),
    );

    expect.assertions(3);
    try {
      await api.get("/v1/auth/profile", {});
    } catch (e) {
      expect(e).toBeInstanceOf(MirloFetchError);
      expect((e as MirloFetchError).status).toBe(401);
      expect((e as Error).message).toBe("Invalid jwt");
    }
  });

  test("throws MirloFetchError with raw text when error body is not JSON", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response("Service Unavailable", { status: 503 }),
    );

    try {
      await api.get("/v1/x", {});
      fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(MirloFetchError);
      expect((e as MirloFetchError).status).toBe(503);
      expect((e as Error).message).toBe("Service Unavailable");
    }
  });
});

describe("fetchWrapper.post", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockedGetItem.mockResolvedValue(null);
    global.fetch = jest.fn();
    await clearStoredSession();
  });

  test("sets POST + JSON content-type + serialized body", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(okJson({ ok: true }));

    await api.post("/v1/purchase", { artistId: 1, deferred: true });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ artistId: 1, deferred: true }));
    const headers = init.headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Accept")).toBe("application/json");
  });
});

describe("fetchWrapper.del", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockedGetItem.mockResolvedValue(null);
    global.fetch = jest.fn();
    await clearStoredSession();
  });

  test("sets method DELETE and forwards auth headers", async () => {
    await startSession(signedInTokens);
    (global.fetch as jest.Mock).mockResolvedValueOnce(okJson({ ok: true }));

    await api.del("/v1/users/4");

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://test.api/v1/users/4");
    expect(init.method).toBe("DELETE");
    const headers = init.headers as Headers;
    expect(headers.get("mirlo-api-key")).toBe("test-api-key");
    expect(headers.get("Authorization")).toBe("Bearer access-token-value");
  });

  test("propagates 401 as MirloFetchError", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      errorJson(401, { error: "Unauthenticated" }),
    );

    try {
      await api.del("/v1/users/4");
      fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(MirloFetchError);
      expect((e as MirloFetchError).status).toBe(401);
    }
  });
});

describe("fetchWrapper after a rejected token", () => {
  const rejected = () =>
    new Response(JSON.stringify({ error: "invalid_token" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Bearer error="invalid_token"',
      },
    });
  const bearerOf = (call: unknown[]) =>
    ((call[1] as RequestInit).headers as Headers).get("Authorization");
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    await startSession({ ...signedInTokens, accessToken: "old-access" });
  });

  test("two requests rejected together share one refresh and retry once each", async () => {
    let finishRefresh!: (
      tokens: Awaited<ReturnType<typeof refreshTokens>>,
    ) => void;
    mockedRefreshTokens.mockReturnValue(
      new Promise((resolve) => {
        finishRefresh = resolve;
      }),
    );
    (global.fetch as jest.Mock).mockImplementation(async (_url, init) =>
      (init.headers as Headers).get("Authorization") === "Bearer new-access"
        ? okJson({ ok: true })
        : rejected(),
    );

    const first = api.get("/v1/first", {});
    const second = api.get("/v1/second", {});
    await tick();
    // Both saw the 401 before the token endpoint answered
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(mockedRefreshTokens).toHaveBeenCalledTimes(1);
    expect(mockedRefreshTokens).toHaveBeenCalledWith("refresh-token-value");

    finishRefresh({
      accessToken: "new-access",
      refreshToken: "new-refresh",
      issuedAt: Math.floor(Date.now() / 1000),
      expiresIn: 3600,
    } as Awaited<ReturnType<typeof refreshTokens>>);
    await expect(Promise.all([first, second])).resolves.toEqual([
      { ok: true },
      { ok: true },
    ]);

    // One retry each, never a third request
    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls.map(bearerOf)).toEqual([
      "Bearer old-access",
      "Bearer old-access",
      "Bearer new-access",
      "Bearer new-access",
    ]);
    expect(mockedRefreshTokens).toHaveBeenCalledTimes(1);
    expect(await getStoredTokens()).toMatchObject({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });
  });

  test("a token rejected again straight after a refresh ends the session", async () => {
    mockedRefreshTokens.mockResolvedValue({
      accessToken: "new-access",
      refreshToken: "new-refresh",
      issuedAt: Math.floor(Date.now() / 1000),
      expiresIn: 3600,
    } as Awaited<ReturnType<typeof refreshTokens>>);
    (global.fetch as jest.Mock).mockImplementation(async () => rejected());
    const onEnded = jest.fn();
    const stopListening = onSessionEnded(onEnded);

    await expect(api.get("/v1/foo", {})).rejects.toBeInstanceOf(
      SessionEndedError,
    );
    stopListening();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(mockedRefreshTokens).toHaveBeenCalledTimes(1);
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(await getStoredTokens()).toBeNull();
  });
});
