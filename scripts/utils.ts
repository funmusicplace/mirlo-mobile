import { openInBrowser } from "@/scripts/openInBrowser";
import { API_ROOT } from "@/constants/api-root";
import { API_KEY } from "@/constants/api-key";

export function audioTrackType(url: string): "default" | "hls" | "dash" {
  if (url.endsWith(".m3u8")) return "hls";
  if (url.endsWith(".mpd")) return "dash";
  return "default";
}

export function toRNTrack(track: RNTrack, album: AlbumProps): RNTrack {
  return {
    title: track.title,
    artist: album.artist.name,
    artwork: album.cover.sizes[600],
    url: `${API_ROOT}${track.audio.url}`,
    allowIndividualSale: track.allowIndividualSale,
    id: track.id,
    trackArtists: track.trackArtists,
    queueIndex: track.order,
    trackGroupId: album.trackGroupId,
    trackGroup: {
      userTrackGroupPurchases: album.userTrackGroupPurchases,
      artistId: album.artistId,
      urlSlug: album.urlSlug,
      cover: album.cover,
      title: album.title,
      artist: album.artist,
      id: album.id,
      releaseDate: album.releaseDate,
      trackGroupId: album.trackGroupId,
    },
    audio: {
      url: track.audio.url,
      duration: track.audio.duration,
    },
    isPreview: track.isPreview,
    isFeatured: track.isFeatured,
    order: track.order,
    headers: {
      "mirlo-api-key": API_KEY,
    },
    type: audioTrackType(track.audio.url),
  };
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

export function pickFeaturedTrack(
  tracks: RNTrack[],
  user: LoggedInUser | null | undefined,
  album: AlbumProps,
): RNTrack | undefined {
  const playable = tracks
    .filter((track) => isTrackOwnedOrPreview(track, user, album))
    .sort((a, b) => a.order - b.order);

  return playable.find((track) => track.isFeatured) ?? playable[0];
}

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
