import { ReactNode } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { router, usePathname } from "expo-router";
import {
  queryAlbum,
  queryArtist,
  queryRecommendedTrackGroups,
  queryTrackGroups,
} from "@/queries/queries";
import {
  playNextSections,
  SIMILAR_RELEASES,
  SIMILAR_TAGS,
} from "@/scripts/playNext";
import { usePlayer } from "@/state/PlayerContext";

type Release = RNTrack["trackGroup"];

// Suggestions after a release, the prompt and the Play next screen share the cache
export function usePlayNext(release?: Release) {
  const apiRoot = release?.apiRoot;
  const artistId = release ? String(release.artistId) : "";
  const recommended = useQuery(
    queryRecommendedTrackGroups({ trackGroupId: release?.id, apiRoot }),
  );
  const artist = useQuery(queryArtist({ artistSlug: artistId, apiRoot }));
  const albumQuery = queryAlbum({
    slug: release?.urlSlug ?? "",
    id: artistId,
    apiRoot,
  });
  // Only for its tags, which stay on the default instance
  const album = useQuery({
    ...albumQuery,
    enabled: albumQuery.enabled && !apiRoot,
  });
  const tagged = useQueries({
    // No requests for tags the sections won't read
    queries: (album.data?.result.tags ?? []).slice(0, SIMILAR_TAGS).map((tag) =>
      queryTrackGroups({
        tag,
        take: SIMILAR_RELEASES,
        distinctArtists: false,
      }),
    ),
  });
  return {
    sections: release
      ? playNextSections(release, {
          recommended: recommended.data?.results,
          artist: artist.data,
          tagged: tagged.map((query) => query.data?.results),
        })
      : [],
    isLoading: [recommended, artist, album, ...tagged].some(
      (query) => query.isLoading,
    ),
  };
}

// Renders its child once the queue has run out and something can follow it
export default function PlayNextPrompt({
  children,
}: {
  children: (open: () => void) => ReactNode;
}) {
  const { finished } = usePlayer();
  const pathname = usePathname();
  if (!finished || pathname === "/playNext") return null;
  return (
    <Prompt release={finished} pathname={pathname}>
      {children}
    </Prompt>
  );
}

// Its own component, so nothing is fetched until the queue ends
function Prompt({
  release,
  pathname,
  children,
}: {
  release: Release;
  pathname: string;
  children: (open: () => void) => ReactNode;
}) {
  const { sections } = usePlayNext(release);
  if (!sections.length) return null;
  return (
    <>
      {children(() => {
        // One modal at a time, so a release opened from Play next closes it alone
        if (pathname === "/now-playing") router.dismiss();
        router.navigate("/playNext");
      })}
    </>
  );
}
