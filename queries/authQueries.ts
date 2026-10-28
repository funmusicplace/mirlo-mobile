import {
  QueryFunction,
  queryOptions,
  useMutation,
} from "@tanstack/react-query";
import * as api from "./fetch/fetchWrapper";
import { MirloFetchError } from "./fetch/MirloFetchError";
import { authorize, revokeRefreshToken } from "./fetch/oauth";
import {
  SessionEndedError,
  clearStoredSession,
  getStoredTokens,
  startSession,
  toStoredTokens,
} from "./fetch/session";
import CookieManager from "@preeternal/react-native-cookie-manager";
import * as SecureStore from "expo-secure-store";

export const AUTH_PROFILE_QUERY_KEY: ["fetchProfile", "auth"] = [
  "fetchProfile",
  "auth",
];

// Signing in happens on mirlo.space in the system browser, so the app never sees a password
export async function signIn() {
  await startSession(toStoredTokens(await authorize()));
}

// The cookie login left a jwt and a refresh token in SecureStore and the
// cookies in the native jar, which fetch would keep sending
export async function clearLegacySession() {
  await SecureStore.deleteItemAsync("jwt").catch(() => undefined);
  await SecureStore.deleteItemAsync("refresh").catch(() => undefined);
  await CookieManager.clearAll().catch(() => undefined);
  await CookieManager.clearAll(true).catch(() => undefined);
}

async function logout() {
  const refreshToken = (await getStoredTokens())?.refreshToken;
  await clearStoredSession();
  if (refreshToken) {
    // Best effort and not awaited, the user is signed out here either way
    revokeRefreshToken(refreshToken).catch(() => undefined);
  }
}

export function useLogoutMutation() {
  return useMutation({ mutationFn: logout });
}

const fetchProfile: QueryFunction<
  LoggedInUser | null,
  ["fetchProfile", ...string[]]
> = async ({ signal }) => {
  // Nothing is stored while signed out, so there is nothing to ask the API
  if (!(await getStoredTokens())) return null;

  try {
    const r = await api.get<{ result: LoggedInUser }>(`/auth/profile`, {
      signal,
    });
    return r.result;
  } catch (e) {
    const unauthorized = e instanceof MirloFetchError && e.status === 401;
    if (unauthorized || e instanceof SessionEndedError) return null;
    throw e;
  }
};

export function queryAuthProfile() {
  return queryOptions({
    queryKey: AUTH_PROFILE_QUERY_KEY,
    queryFn: fetchProfile,
  });
}
