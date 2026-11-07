import { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import FavoriteTrackButton from "@/components/FavoriteTrackButton";
import PlayFeaturedButton from "@/components/PlayFeaturedButton";
import WishlistButton from "@/components/WishlistButton";
import { spacing, touchTarget } from "@/constants/spacing";
import { playableTracks } from "@/scripts/utils";

type PlayProps = Pick<
  ComponentProps<typeof PlayFeaturedButton>,
  "pick" | "isCurrent"
>;

// A release plays whole and a track alone
const playRelease = (trackGroup: AlbumProps): PlayProps => ({
  pick: playableTracks,
  isCurrent: ({ trackGroup: current }) =>
    current?.urlSlug === trackGroup.urlSlug &&
    current?.artistId === trackGroup.artistId,
});

const playTrack = (track: RNTrack): PlayProps => ({
  pick: (tracks, user, album) =>
    playableTracks(tracks, user, album).filter(({ id }) => id === track.id),
  isCurrent: ({ id }) => id === track.id,
});

// Remove and play controls under a wishlist card
export default function WishlistCardActions({
  trackGroup,
  track,
}: {
  trackGroup: AlbumProps;
  track?: RNTrack;
}) {
  return (
    <View style={styles.row}>
      {track ? (
        <FavoriteTrackButton track={track} />
      ) : (
        <WishlistButton trackGroup={trackGroup} />
      )}
      <PlayFeaturedButton
        albums={[trackGroup]}
        {...(track ? playTrack(track) : playRelease(trackGroup))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // A full touch target tall, so Android keeps the buttons' hit slop
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: touchTarget,
    gap: spacing.lg,
  },
});
