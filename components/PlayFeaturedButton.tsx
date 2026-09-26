import { ActivityIndicator, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import TrackPlayer from "react-native-track-player";
import { usePlayer } from "@/state/PlayerContext";
import { useAuthContext } from "@/state/AuthContext";
import { queryAlbum } from "@/queries/queries";
import { pickFeaturedTrack, toRNTrack } from "@/scripts/utils";
import { mirloRed } from "@/constants/mirlo-red";

export default function PlayFeaturedButton({
  albums,
}: {
  albums: AlbumProps[];
}) {
  const { t } = useTranslation("translation");
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
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={
        showPause ? t("clickToPlay.pause") : t("clickToPlay.play")
      }
    >
      {loading ? (
        <ActivityIndicator color={mirloRed} />
      ) : (
        <Ionicons
          name={showPause ? "pause-circle" : "play-circle"}
          size={44}
          color={mirloRed}
        />
      )}
    </TouchableOpacity>
  );
}
