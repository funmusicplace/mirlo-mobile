import { openInBrowser } from "@/scripts/openInBrowser";

export function audioTrackType(url: string): "default" | "hls" | "dash" {
  if (url.endsWith(".m3u8")) return "hls";
  if (url.endsWith(".mpd")) return "dash";
  return "default";
}

export const isTrackOwnedOrPreview = (
  track: RNTrack,
  user?: LoggedInUser | null,
  trackGroup?: AlbumProps,
): boolean => {
  if (track.isPreview) {
    return true;
  }
  if (
    trackGroup?.releaseDate &&
    new Date(trackGroup.releaseDate) > new Date()
  ) {
    return false;
  }
  if (!user) {
    return false;
  }
  const lookInTrackGroup = trackGroup ?? track.trackGroup;
  const ownsTrack = lookInTrackGroup.artistId === user.id;
  const boughtTrack = !!lookInTrackGroup.userTrackGroupPurchases?.find(
    (utgp) => utgp.userId === user.id,
  );
  return ownsTrack || boughtTrack;
};

export const isTrackOwned = (
  track: RNTrack,
  trackGroup?: AlbumProps,
  user?: LoggedInUser | null,
) => {
  if (!user) {
    return false;
  }
  if (!track) {
    return false;
  }
  const lookInTrackGroup = trackGroup ?? track.trackGroup;

  // Checks if you are the owner/artist of the track
  const ownsTrack = lookInTrackGroup.artistId === user.id;
  // Checks if you bought the track individually
  const boughtTrack = !!user.userTrackPurchases?.find(
    (utgp) => utgp.trackId === track.id,
  );
  // Checks if you bought the album that the track belongs to
  const boughtTrackGroup = !!lookInTrackGroup.userTrackGroupPurchases?.find(
    (utgp) => utgp.userId === user.id,
  );
  return ownsTrack || boughtTrack || boughtTrackGroup;
};

export const linkifyUrls = (text: string) => {
  // Simple regex to find URLs that aren't already in markdown format
  const urlRegex = /(?<!\]\()https?:\/\/[^\s\)]+(?!\))/g;

  return text.replace(urlRegex, (url) => {
    // Convert plain URLs to markdown format
    return `[${url}](${url})`;
  });
};

export const handleExternalPurchase = (trackGroup: AlbumProps) => {
  const purchaseUrl = `https://mirlo.space/${trackGroup.artist.urlSlug}/release/${trackGroup.urlSlug}`;
  openInBrowser(purchaseUrl);
};
