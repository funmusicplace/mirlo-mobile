import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

// Top-level web routes that sit beside artist slugs (client/src/routes.tsx in the web repo)
const WEB_ONLY = new Set([
  "account",
  "admin",
  "artists",
  "checkout",
  "checkout-error",
  "confirm-email-change",
  "email-confirmation",
  "fulfillment",
  "label",
  "login",
  "manage",
  "pages",
  "password-reset",
  "post",
  "profile",
  "releases",
  "sales",
  "search",
  "signup",
  "tags",
  "widget",
]);

// The Android Custom Tab intent has to name a browser: an implicit VIEW intent
// for a mirlo.space URL resolves to this app again and loops
async function openInBrowser(url: string) {
  let browserPackage: string | undefined;
  if (Platform.OS === "android") {
    const b = await WebBrowser.getCustomTabsSupportingBrowsersAsync();
    browserPackage =
      b.preferredBrowserPackage ??
      b.defaultBrowserPackage ??
      b.browserPackages[0];
    if (!browserPackage) return;
  }
  await WebBrowser.openBrowserAsync(url, { browserPackage });
}

// Maps a mirlo.space link to the app route that shows it. Anything the app
// can't show opens in an in-app browser tab and leaves navigation alone
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  let url: URL;
  try {
    url = new URL(path);
  } catch {
    return path;
  }
  if (url.hostname !== "mirlo.space") return path;

  const [artist, release, album, tracks, trackId] = url.pathname
    .split("/")
    .filter(Boolean);
  if (!artist) return "/";
  if (!WEB_ONLY.has(artist)) {
    if (!release) return `/artist/${artist}/artist-page`;
    if (release === "release" && album) {
      if (!tracks) return `/artist/${artist}/album/${album}/album-tracks`;
      if (tracks === "tracks" && trackId) {
        return `/artist/${artist}/album/${album}/tracks/${trackId}`;
      }
    }
  }
  openInBrowser(path);
  return "";
}
