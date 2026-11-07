import { ActivityIndicator, StyleSheet, View } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import TrackPlayer from "react-native-track-player";
import { usePlayer } from "@/state/PlayerContext";
import { useAuthContext } from "@/state/AuthContext";
import { queryAlbum } from "@/queries/queries";
import { pickFeaturedTrack, toRNTrack } from "@/scripts/utils";
import { useColors } from "@/constants/colors";
import { radius } from "@/constants/spacing";
import { HeaderButton } from "@/components/ScreenHeader";

type PickTracks = (
  tracks: RNTrack[],
  user: LoggedInUser | null | undefined,
  album: AlbumProps,
) => RNTrack[];

const pickFeatured: PickTracks = (tracks, user, album) => {
  const picked = pickFeaturedTrack(tracks, user, album);
  return picked ? [picked] : [];
};

// Queues what `pick` takes from each album, the featured track by default
export default function PlayFeaturedButton({
  albums,
  pick = pickFeatured,
  isCurrent,
}: {
  albums: AlbumProps[];
  pick?: PickTracks;
  // Also shows pause for a track that this button didn't queue itself
  isCurrent?: (track: RNTrack) => boolean;
}) {
  const { t } = useTranslation("translation");
  const colors = useColors();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { isPlaying, activeTrack, setActiveTrack, setShuffled } = usePlayer();
  const [loading, setLoading] = useState(false);
  const [mix, setMix] = useState<RNTrack[]>([]);

  const mixIsActive =
    !!activeTrack &&
    (mix.some((track) => track.url === activeTrack.url) ||
      !!isCurrent?.(activeTrack));
  const showPause = isPlaying && mixIsActive;

  const onPress = async () => {
    try {
      if (mixIsActive) {
        await (isPlaying ? TrackPlayer.pause() : TrackPlayer.play());
        return;
      }

      setLoading(true);
      const albumDetails = await Promise.allSettled(
        albums.map((album) =>
          queryClient.fetchQuery(
            queryAlbum({
              slug: album.urlSlug,
              id: String(album.artistId),
              apiRoot: album.apiRoot,
            }),
          ),
        ),
      );

      const tracks: RNTrack[] = [];
      albumDetails.forEach((outcome) => {
        if (outcome.status !== "fulfilled") return;
        const album = outcome.value.result;
        const found = (album.tracks ?? []).map((track) =>
          toRNTrack(track, album),
        );
        pick(found, user, album).forEach((picked) =>
          tracks.push({ ...picked, queueIndex: tracks.length }),
        );
      });
      if (!tracks.length) return;

      setShuffled(false);
      // RNTrack.type doesn't match TrackType
      await TrackPlayer.setQueue(tracks as any);
      setActiveTrack(tracks[0]);
      await TrackPlayer.play();
      setMix(tracks);
    } catch (err) {
      console.error("issue playing featured tracks", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <HeaderButton
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={
        showPause ? t("clickToPlay.pause") : t("clickToPlay.play")
      }
    >
      <View style={[styles.circle, { backgroundColor: colors.button }]}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.buttonText} />
        ) : (
          <FontAwesome5
            name={showPause ? "pause" : "play"}
            size={12}
            color={colors.buttonText}
            solid
          />
        )}
      </View>
    </HeaderButton>
  );
}

const styles = StyleSheet.create({
  circle: {
    flex: 1,
    alignSelf: "stretch",
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
