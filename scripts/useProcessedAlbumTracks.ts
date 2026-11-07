// hooks/useProcessedAlbumTracks.ts
// NOTE: This hook is currently unused in the app and is slated for removal.
import { useMemo } from "react";
import { isEqual } from "lodash";
import { audioHeaders, audioUrl, isTrackOwnedOrPreview } from "@/scripts/utils";
import { useAuthContext } from "@/state/AuthContext";

export function useProcessedAlbumTracks(
  data: { result: AlbumProps } | undefined,
) {
  const { user } = useAuthContext();

  return useMemo(() => {
    if (!data || !data.result.tracks)
      return { allTracks: [], playableTracks: [] };

    const allTracks: RNTrack[] = [];
    const playableTracks: RNTrack[] = [];
    let playableIndex = 0;

    for (const track of data.result.tracks) {
      const newTrack: RNTrack = {
        title: track.title,
        artist: data.result.artist.name,
        artwork: data.result.cover.sizes[600],
        url: audioUrl(track, data.result),
        id: data.result.id,
        trackArtists: track.trackArtists,
        queueIndex: track.order,
        trackGroupId: data.result.trackGroupId,
        trackGroup: {
          userTrackGroupPurchases: data.result.userTrackGroupPurchases,
          artistId: data.result.artistId,
          urlSlug: data.result.urlSlug,
          cover: data.result.cover,
          title: data.result.title,
          artist: data.result.artist,
        },
        audio: {
          url: track.audio.url,
          duration: track.audio.duration,
        },
        isPreview: track.isPreview,
        order: track.order,
        headers: audioHeaders(data.result),
      };

      allTracks.push(newTrack);

      if (isTrackOwnedOrPreview(newTrack, user, data.result)) {
        newTrack.queueIndex = playableIndex;
        playableIndex++;
        playableTracks.push(newTrack);
      }
    }

    return { allTracks, playableTracks };
  }, [data, user]);
}
