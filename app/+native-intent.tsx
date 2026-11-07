import { OAUTH_REDIRECT_URI } from "@/constants/oauth";
import { MirloFetchError } from "@/queries/fetch/MirloFetchError";
import { queryClient } from "@/queries/QueryClientWrapper";
import { queryArtist } from "@/queries/queries";
import { openOnWeb } from "@/scripts/openInBrowser";
import { Platform } from "react-native";

// Artist pages share the site root with routes like /login, so a single
// segment is an artist only if the API says so. Fetching through the query
// client also primes the artist page's cache. Anything but a 404 (offline,
// server error) still goes to the artist page, which shows its own error
async function isArtist(slug: string) {
  try {
    await queryClient.fetchQuery({
      ...queryArtist({ artistSlug: slug }),
      retry: false,
    });
    return true;
  } catch (e) {
    return !(e instanceof MirloFetchError && e.status === 404);
  }
}

let launchPath: string | undefined;
let pendingHref: string | undefined;
let openRelaunchLink: ((href: string) => void) | undefined;

// RootLayout opens the route that a remount couldn't show
export function subscribeToRelaunchLink(open: (href: string) => void) {
  openRelaunchLink = open;
  if (pendingHref) open(pendingHref);
  pendingHref = undefined;
  return () => {
    if (openRelaunchLink === open) openRelaunchLink = undefined;
  };
}

// Maps a mirlo.space link to the app route that shows it. Anything the app
// can't show opens on the web and leaves navigation alone
export async function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): Promise<string> {
  // The playback service keeps the process alive after a swipe away, so a
  // link remounts the app, and expo-router restores the old screen. A
  // recreated activity repeats its path, so only a new one goes to RootLayout
  if (initial && Platform.OS === "android" && path !== launchPath) {
    const isRemount = launchPath !== undefined;
    launchPath = path;
    if (isRemount) {
      const href = await redirectSystemPath({ path, initial });
      if (!href.startsWith("/")) return href;
      if (openRelaunchLink) openRelaunchLink(href);
      else pendingHref = href;
      return "";
    }
  }

  // On Android the sign-in redirect also arrives as a deep link. The auth
  // session already has it, so leave navigation alone
  if (path.startsWith(OAUTH_REDIRECT_URI)) return "";

  let url: URL;
  try {
    url = new URL(path);
  } catch {
    return path;
  }
  // Android's player notification opens trackplayer://notification.click,
  // and after a cold start the player is empty until the next track
  if (path.startsWith("trackplayer://")) return initial ? "" : "/now-playing";
  if (url.hostname !== "mirlo.space") return path;

  const [artist, section, album, tracks, trackId] = url.pathname
    .split("/")
    .filter(Boolean);
  if (!artist) return "/";
  // The site's release list, never an artist slug
  if (artist === "releases" && !section) {
    const tag = url.searchParams.get("tag");
    return tag ? `/tags/${tag}` : "/";
  }
  if (!section || section === "releases") {
    if (await isArtist(artist)) return `/artist/${artist}/artist-page`;
  } else if (section === "release" && album) {
    if (!tracks) return `/artist/${artist}/album/${album}/album-tracks`;
    if (tracks === "tracks" && trackId) {
      return `/artist/${artist}/album/${album}/tracks/${trackId}`;
    }
  }
  openOnWeb(path);
  return "";
}
