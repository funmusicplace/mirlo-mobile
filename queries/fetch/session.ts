import { TokenError, TokenResponse } from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import { refreshTokens } from "./oauth";

// The OAuth tokens live in the Keychain/Keystore so a relaunch stays signed in
const TOKENS_KEY = "mirlo_oauth_tokens";

// Refresh a little early so a request never leaves with a token that expires in flight
const EXPIRY_MARGIN_MS = 60 * 1000;

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export class SessionEndedError extends Error {
  constructor() {
    super("Your session has ended. Please log in again.");
    this.name = "SessionEndedError";
  }
}

// undefined means SecureStore wasn't read yet, null means signed out
let cached: StoredTokens | null | undefined;
// Bumped when the session is replaced or cleared, so a refresh already in
// flight can't write its tokens over a sign-out or a newer sign-in
let generation = 0;
let refreshing: Promise<string> | null = null;
const sessionEndedListeners = new Set<() => void>();

// currentRefreshToken covers a refresh response that didn't rotate the refresh token
export function toStoredTokens(
  response: TokenResponse,
  currentRefreshToken?: string,
): StoredTokens {
  const refreshToken = response.refreshToken ?? currentRefreshToken;
  if (!refreshToken) {
    throw new Error("Mirlo did not return a refresh token");
  }
  return {
    accessToken: response.accessToken,
    refreshToken,
    expiresAt: (response.issuedAt + (response.expiresIn ?? 3600)) * 1000,
  };
}

export async function getStoredTokens(): Promise<StoredTokens | null> {
  if (cached === undefined) {
    const raw = await SecureStore.getItemAsync(TOKENS_KEY);
    // A sign-in or sign-out during the read wins over the stale value
    if (cached === undefined) {
      try {
        cached = raw ? (JSON.parse(raw) as StoredTokens) : null;
      } catch {
        cached = null;
      }
    }
  }
  return cached ?? null;
}

async function writeTokens(tokens: StoredTokens): Promise<void> {
  cached = tokens;
  // Refreshes run during locked background playback, and a backup restored on
  // another phone would replay a rotated refresh token
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens), {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
}

export async function startSession(tokens: StoredTokens): Promise<void> {
  generation++;
  await writeTokens(tokens);
}

export async function clearStoredSession(): Promise<void> {
  generation++;
  cached = null;
  sessionEndedListeners.forEach((listener) => listener());
  await SecureStore.deleteItemAsync(TOKENS_KEY);
}

// Lets the auth state drop to signed out on Log out and when the server ends
// the session underneath us, for example a refresh token that expired or was revoked
export function onSessionEnded(listener: () => void): () => void {
  sessionEndedListeners.add(listener);
  return () => sessionEndedListeners.delete(listener);
}

export async function endSession(): Promise<never> {
  await clearStoredSession();
  throw new SessionEndedError();
}

export async function getAccessToken(): Promise<string | null> {
  const tokens = await getStoredTokens();
  if (!tokens) return null;
  if (Date.now() < tokens.expiresAt - EXPIRY_MARGIN_MS) {
    return tokens.accessToken;
  }
  return refreshAccessToken(tokens.accessToken);
}

// Single flight: Mirlo rotates refresh tokens and revokes the whole grant when
// an old one is used again, so two concurrent refreshes would sign the user
// out. staleAccessToken is the token a caller saw rejected, and if another
// caller already replaced it that caller's token is reused
export function refreshAccessToken(staleAccessToken?: string): Promise<string> {
  refreshing ??= (async () => {
    const tokens = await getStoredTokens();
    if (!tokens) return endSession();
    if (staleAccessToken && tokens.accessToken !== staleAccessToken) {
      return tokens.accessToken;
    }

    const startedAt = generation;
    let response: TokenResponse;
    try {
      response = await refreshTokens(tokens.refreshToken);
    } catch (error) {
      // Only the server rejecting the grant or this app ends the session,
      // network errors and 5xx pass through so a bad connection can't sign the user out
      if (
        error instanceof TokenError &&
        (error.code === "invalid_grant" || error.code === "invalid_client")
      ) {
        return endSession();
      }
      throw error;
    }
    if (generation !== startedAt) throw new SessionEndedError();

    const next = toStoredTokens(response, tokens.refreshToken);
    await writeTokens(next);
    return next.accessToken;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}
