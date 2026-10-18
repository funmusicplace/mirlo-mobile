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

export default function PlayFeaturedButton({
  albums,
}: {
  albums: AlbumProps[];
}) {
  const { t } = useTranslation("translation");
  const colors = useColors();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { isPlaying, activeTrack, setActiveTrack, setShuffled } = usePlayer();
  const [loading, setLoading] = useState(false);
  const [mix, setMix] = useState<RNTrack[]>([]);

  const mixIsActive = mix.some((track) => track.url === activeTrack?.url);
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
            queryAlbum({ slug: album.urlSlug, id: String(album.artistId) }),
          ),
        ),
      );

      const tracks: RNTrack[] = [];
      albumDetails.forEach((outcome) => {
        if (outcome.status !== "fulfilled") return;
        const album = outcome.value.result;
        const picked = pickFeaturedTrack(
          (album.tracks ?? []).map((track) => toRNTrack(track, album)),
          user,
          album,
        );
        if (picked) tracks.push({ ...picked, queueIndex: tracks.length });
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
        showPause
          ? t("clickToPlay.pause", "Pause")
          : t("clickToPlay.play", "Play")
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
