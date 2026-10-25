import {
  AuthRequest,
  CodeChallengeMethod,
  DiscoveryDocument,
  exchangeCodeAsync,
  fetchDiscoveryAsync,
  Prompt,
  refreshAsync,
  revokeAsync,
  TokenResponse,
  TokenTypeHint,
} from "expo-auth-session";
import { API_ROOT } from "@/constants/api-root";
import { OAUTH_CLIENT_ID, OAUTH_REDIRECT_URI } from "@/constants/oauth";

// Mirlo only honors offline_access (the refresh token) together with prompt=consent
const SCOPES = ["openid", "api", "offline_access"];

let discoveryPromise: Promise<DiscoveryDocument> | null = null;

// The endpoints come from the discovery document, whose issuer (not API_ROOT)
// is what the redirect's iss parameter must equal
function getDiscovery(): Promise<DiscoveryDocument> {
  discoveryPromise ??= fetchDiscoveryAsync(API_ROOT).catch((error) => {
    discoveryPromise = null;
    throw error;
  });
  return discoveryPromise;
}

export class SignInCancelledError extends Error {
  constructor() {
    super("Sign-in was cancelled");
    this.name = "SignInCancelledError";
  }
}

// Authorization code with PKCE (S256) in the system browser, then the code exchange
export async function authorize(): Promise<TokenResponse> {
  // The browser would only show an error page, which looks like a cancel
  if (!OAUTH_CLIENT_ID) {
    throw new Error(
      "Sign-in isn't set up (EXPO_PUBLIC_OAUTH_CLIENT_ID is empty)",
    );
  }

  const discovery = await getDiscovery();
  const request = new AuthRequest({
    clientId: OAUTH_CLIENT_ID,
    redirectUri: OAUTH_REDIRECT_URI,
    scopes: SCOPES,
    prompt: Prompt.Consent,
    usePKCE: true,
    codeChallengeMethod: CodeChallengeMethod.S256,
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== "success" && result.type !== "error") {
    throw new SignInCancelledError();
  }
  if (result.type === "error") {
    throw new Error(
      describeAuthError(
        result.params.error ?? result.errorCode,
        result.params.error_description,
      ),
    );
  }

  // RFC 9207: the code has to come from the server we sent the user to
  const expectedIssuer = discovery.discoveryDocument?.issuer;
  if (expectedIssuer && result.params.iss !== expectedIssuer) {
    throw new Error("The sign-in response came from an unexpected server");
  }

  return exchangeCodeAsync(
    {
      clientId: OAUTH_CLIENT_ID,
      code: result.params.code,
      redirectUri: OAUTH_REDIRECT_URI,
      extraParams: { code_verifier: request.codeVerifier ?? "" },
    },
    discovery,
  );
}

function describeAuthError(
  code: string | null | undefined,
  description: string | undefined,
): string {
  // Mirlo answers access_denied when the user declines, when the account's
  // email is unverified and when the app isn't approved on the instance yet
  if (code === "access_denied") {
    return (
      description ??
      "Mirlo didn't allow this sign-in. Check that your email is verified, then try again."
    );
  }
  return description ?? code ?? "Sign-in failed";
}

// Every refresh returns a new refresh token and the old one stops working
export async function refreshTokens(
  refreshToken: string,
): Promise<TokenResponse> {
  return refreshAsync(
    { clientId: OAUTH_CLIENT_ID, refreshToken },
    await getDiscovery(),
  );
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await revokeAsync(
    {
      clientId: OAUTH_CLIENT_ID,
      token: refreshToken,
      tokenTypeHint: TokenTypeHint.RefreshToken,
    },
    await getDiscovery(),
  );
}
