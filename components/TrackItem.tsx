import { useAuthContext } from "@/state/AuthContext";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { isTrackOwnedOrPreview } from "@/scripts/utils";
import FavoriteTrackButton from "./FavoriteTrackButton";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { gutter, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

// Web track row index box
const INDEX_WIDTH = 28;

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Number(seconds.toFixed(0)) % 60;

  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedSeconds =
    remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

  return `${formattedMinutes}:${formattedSeconds}`;
}

type TrackItemComponentProps = {
  track: RNTrack;
  album?: AlbumProps;
  thisSongSelected: boolean;
  onPress?: () => void;
};

export const TrackItem = ({
  track,
  album,
  thisSongSelected,
  onPress,
}: TrackItemComponentProps) => {
  const { user } = useAuthContext();
  const colors = useColors();

  const canPlayTrack = isTrackOwnedOrPreview(track, user, album);
  const active = canPlayTrack && thisSongSelected;

  // Artists sometimes leave a name blank and type it into the role field
  const names = (track.trackArtists ?? [])
    .map((artist) => artist.artistName?.trim())
    .filter(Boolean);
  const contributors = names.join(", ");
  return (
    // The favorite sits beside the row button so screen readers reach it
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        disabled={!canPlayTrack}
        accessibilityRole="button"
        accessibilityLabel={[
          `${track.order}. ${track.title}`,
          contributors,
          track.audio?.duration ? formatTime(track.audio.duration) : "",
        ]
          .filter(Boolean)
          .join(", ")}
        accessibilityState={{ selected: active, disabled: !canPlayTrack }}
        android_ripple={{ color: colors.tintX }}
        style={({ pressed }) => [
          styles.main,
          !canPlayTrack && styles.unplayable,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[type.small, styles.index]}>{track.order}</Text>
        <View style={styles.titles}>
          <Text
            style={[
              type.small,
              active && { color: colors.accent, fontWeight: "600" },
            ]}
          >
            {track.title}
          </Text>
          {contributors && names[0] !== track.artist ? (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[type.xsmall, { color: colors.secondaryText }]}
            >
              {contributors}
            </Text>
          ) : null}
        </View>
        <Text style={[type.xsmall, styles.duration]}>
          {track.audio.duration ? formatTime(track.audio.duration) : 0}
        </Text>
      </Pressable>
      <FavoriteTrackButton track={track} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: touchTarget,
    // Holds the favorite's hit slop, Android drops touches outside the parent
    paddingHorizontal: gutter,
    gap: spacing.sm,
  },
  main: {
    flex: 1,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  index: {
    width: INDEX_WIDTH,
    textAlign: "center",
  },
  titles: {
    flex: 1,
  },
  duration: {
    fontWeight: "700",
  },
  // Web dims rows that can't play
  unplayable: {
    opacity: 0.6,
  },
  // Android shows the ripple instead
  pressed: {
    opacity: Platform.OS === "android" ? 1 : 0.6,
  },
});
