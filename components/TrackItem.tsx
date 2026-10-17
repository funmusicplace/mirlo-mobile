import { useAuthContext } from "@/state/AuthContext";
import { View, StyleSheet } from "react-native";
import { isTrackOwnedOrPreview } from "@/scripts/utils";
import FavoriteTrackButton from "./FavoriteTrackButton";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";

function formatTime(seconds: number) {
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
  onTrackScreen: boolean;
};

export const TrackItem = ({
  track,
  album,
  thisSongSelected,
  onTrackScreen,
}: TrackItemComponentProps) => {
  const { user } = useAuthContext();
  const colors = useColors();

  const canPlayTrack = isTrackOwnedOrPreview(track, user, album);

  let contributors = "";

  if (track.trackArtists) {
    for (let i = 0; i < track.trackArtists.length; i++) {
      if (i === track.trackArtists.length - 1) {
        contributors += track.trackArtists[i].artistName;
      } else {
        contributors += track.trackArtists[i].artistName + ", ";
      }
    }
  }
  return (
    <View style={styles.listItem}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          width: "70%",
        }}
      >
        {track && (
          <Text
            style={{
              color: canPlayTrack ? colors.secondaryText : colors.inactive,
              fontSize: 16,
              width: 30,
              marginLeft: 5,
              fontWeight: canPlayTrack
                ? thisSongSelected
                  ? "bold"
                  : "normal"
                : "normal",
            }}
          >
            {track.order}.
          </Text>
        )}
        <View style={{ maxWidth: "90%" }}>
          <Text
            style={{
              color: canPlayTrack ? colors.secondaryText : colors.inactive,
              fontSize: 16,
              paddingRight: 5,
              fontWeight: canPlayTrack
                ? thisSongSelected
                  ? "bold"
                  : "normal"
                : "normal",
            }}
            ellipsizeMode="tail"
            numberOfLines={1}
          >
            {track.title}
          </Text>
          {track.trackArtists &&
          contributors &&
          track.trackArtists.length &&
          track.trackArtists[0].artistName !== track.artist ? (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ color: colors.secondaryText }}
            >
              {contributors}
            </Text>
          ) : null}
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          width: "20%",
        }}
      >
        {!onTrackScreen && <FavoriteTrackButton track={track} size={15} />}
        <Text
          style={{
            color: canPlayTrack ? colors.secondaryText : colors.inactive,
            fontSize: 15,
            marginRight: 10,
            fontWeight: canPlayTrack
              ? thisSongSelected
                ? "bold"
                : "normal"
              : "normal",
          }}
        >
          {track.audio.duration ? formatTime(track.audio.duration) : 0}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    justifyContent: "space-between",
    marginVertical: 5,
  },
});
