import { Image, View, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePlayer } from "@/state/PlayerContext";
import TrackPlayer, { PlaybackState, State } from "react-native-track-player";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
export default function NextButton() {
  const { setActiveTrack, playbackState, activeTrack } = usePlayer();
  const colors = useColors();
  const nextIcon = (
    <Ionicons name="play-skip-forward" size={40} color={colors.text} />
  );

  const nextSong = async () => {
    try {
      const queue = await TrackPlayer.getQueue();
      const trackIndex = await TrackPlayer.getActiveTrackIndex();
      const queueLength = queue.length;

      if (trackIndex === queueLength - 1) {
        await TrackPlayer.skip(0)
        await TrackPlayer.play();
      } else {
        await TrackPlayer.skipToNext();
        const cur = await TrackPlayer.getActiveTrack();
        console.log(cur?.title);
        await TrackPlayer.play();
      }

      // const newTrack = (await TrackPlayer.getActiveTrack()) as RNTrack;
      // if (newTrack) {
      //   setActiveTrack(newTrack);
      // } else {
      //   throw new Error("Couldn't get next Track");
      // }
    } catch (err) {
      console.error("issue skipping to next song", err);
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.button} onPress={nextSong}>
        <Text>{nextIcon}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginRight: 10,
  },
});
