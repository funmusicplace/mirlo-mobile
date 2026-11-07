import { OAUTH_REDIRECT_URI } from "@/constants/oauth";
import { MirloFetchError } from "@/queries/fetch/MirloFetchError";
import { queryClient } from "@/queries/QueryClientWrapper";
import { queryArtist } from "@/queries/queries";
import { openOnWeb } from "@/scripts/openInBrowser";
import { Dimensions, PixelRatio, Platform } from "react-native";

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

export type RelaunchLink = { href: string; repeated: boolean };

// A cold start resolves the initial URL before RootLayout first mounts
let rootMounted = false;
let launchPath: string | undefined;
let launchConfig: string | undefined;
let pendingLink: RelaunchLink | undefined;
let openRelaunchLink: ((link: RelaunchLink) => void) | undefined;

// Font size and display changes recreate the activity, which repeats the
// launch path. Orientation, theme and language never do, so they stay out
function currentConfig() {
  const { width, height, scale } = Dimensions.get("screen");
  return [
    Math.min(width, height),
    Math.max(width, height),
    scale,
    PixelRatio.getFontScale(),
  ].join("|");
}

// A repeated path is the recreated activity's own intent unless nothing in
// the configuration changed, in which case the listener opened the link again.
// Called once navigation is ready, when the new metrics have arrived
export function shouldOpenRelaunchLink({ repeated }: RelaunchLink) {
  const config = currentConfig();
  const unchanged = config === launchConfig;
  launchConfig = config;
  return !repeated || unchanged;
}

// RootLayout opens the route that a remount couldn't show
export function subscribeToRelaunchLink(open: (link: RelaunchLink) => void) {
  rootMounted = true;
  openRelaunchLink = open;
  if (pendingLink) open(pendingLink);
  pendingLink = undefined;
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
  // link remounts the app, and expo-router restores the old screen. RootLayout
  // opens the link instead, once it knows the path isn't a recreated activity's
  if (initial && Platform.OS === "android") {
    const repeated = path === launchPath;
    launchPath = path;
    if (!rootMounted) {
      launchConfig = currentConfig();
    } else {
      const href = await mapSystemPath(path, initial);
      if (!href.startsWith("/")) return href;
      const link = { href, repeated };
      if (openRelaunchLink) openRelaunchLink(link);
      else pendingLink = link;
      return "";
    }
  }
  return mapSystemPath(path, initial);
}

async function mapSystemPath(path: string, initial: boolean): Promise<string> {
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
