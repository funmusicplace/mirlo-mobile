import { API_ROOT } from "@/constants/api-root";
import { API_KEY } from "@/constants/api-key";
import { MirloFetchError } from "./MirloFetchError";
import { endSession, getAccessToken, refreshAccessToken } from "./session";

/**
 * Wraps fetch() calls to Mirlo's API with error handling.
 *
 * @param endpoint The API request path (appended to API_ROOT)
 * @param init Fetch request options
 * @param isRetry True on the single retry after a token refresh
 * @returns The resolved JSON response
 * @throws MirloFetchError if the response code is not OK
 * @throws SyntaxError if the response body is not JSON
 */
async function fetchWrapper<R>(
  endpoint: string,
  init: RequestInit,
  isRetry = false,
): Promise<R> {
  const accessToken = await getAccessToken();

  const headers = new Headers(init.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (API_KEY) {
    headers.append("mirlo-api-key", API_KEY);
  }

  const res = await fetch(`${API_ROOT}${endpoint}`, {
    ...init,
    headers,
  });

  // An expired or revoked token (RFC 6750). Other 401s come from a route's own
  // permission check and fall through to the error below
  if (accessToken && res.status === 401 && isInvalidToken(res)) {
    // A token straight from a refresh being rejected means the grant is dead
    if (isRetry) return endSession();
    await refreshAccessToken(accessToken);
    return fetchWrapper(endpoint, init, true);
  }

  if (!res.ok) {
    // Read the body once as text, then opportunistically JSON-parse it.
    // Calling res.json() then res.text() throws because the body stream
    // can only be consumed once
    const text = await res.text();
    let message: string = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.error === "string") message = parsed.error;
    } catch {
      // not JSON — keep the raw text as the message
    }
    throw new MirloFetchError(res, message);
  }
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    // If it's not JSON, return the raw text
    // or wrap it in an object
    return text as any;
  }
}

function isInvalidToken(res: Response) {
  return (res.headers.get("www-authenticate") ?? "").includes("invalid_token");
}

/**
 * Wraps fetch() POST calls to Mirlo's API with error handling.
 *
 * @param endpoint The API request path (appended to API_ROOT)
 * @param body The JSON-encoded request body
 * @param init Fetch request options
 * @returns The resolved JSON response
 * @throws MirloFetchError if the response code is not OK
 * @throws SyntaxError if the response body is not JSON
 */
export function post<T, R>(
  endpoint: string,
  body: T,
  init: RequestInit = {},
): Promise<R> {
  return fetchWrapper(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    ...init,
  });
}

/**
 * Wraps fetch() GET calls to Mirlo's API with error handling.
 *
 * @param endpoint The API request path (appended to API_ROOT)
 * @param init Fetch request options
 * @returns The resolved JSON response
 * @throws MirloFetchError if the response code is not OK
 * @throws SyntaxError if the response body is not JSON
 */
export function get<R>(endpoint: string, init: RequestInit): Promise<R> {
  return fetchWrapper(endpoint, {
    method: "GET",
    ...init,
  });
}

export function del<R>(endpoint: string, init: RequestInit = {}): Promise<R> {
  return fetchWrapper(endpoint, {
    method: "DELETE",
    ...init,
  });
}

export function getMany<R>(
  endpoint: string,
  init: RequestInit,
  query?: { [key: string]: string },
): Promise<{ results: R[]; total?: number }> {
  const fullEndpoint = convertQueryToSeachParams(endpoint, query);

  return fetchWrapper(fullEndpoint, {
    method: "GET",
    ...init,
  });
}
function convertQueryToSeachParams(
  endpoint: string,
  query?: { [key: string]: string },
) {
  if (query) {
    const searchParams = new URLSearchParams();
    Object.keys(query).forEach((key) => {
      searchParams.set(key, query[key]);
    });
    return endpoint + "?" + searchParams.toString();
  }
  return endpoint;
}
