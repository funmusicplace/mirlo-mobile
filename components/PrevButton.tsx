import { View, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePlayer } from "@/state/PlayerContext";
import TrackPlayer from "react-native-track-player";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";

export default function PrevButton() {
  const { setActiveTrack } = usePlayer();
  const colors = useColors();
  const prevIcon = (
    <Ionicons name="play-skip-back" size={40} color={colors.text} />
  );

  const prevSong = async () => {
    try {
      const queue = await TrackPlayer.getQueue();
      const activeTrackIndex = await TrackPlayer.getActiveTrackIndex();

      if (activeTrackIndex === 0) {
        await TrackPlayer.skip(queue.length - 1);
        await TrackPlayer.play();
      } else {
        await TrackPlayer.skipToPrevious();
        await TrackPlayer.play();
      }

      // const newTrack = (await TrackPlayer.getActiveTrack()) as RNTrack;
      // if (newTrack) {
      //   setActiveTrack(newTrack);
      // } else {
      //   throw new Error("Couldn't get previous track");
      // }
    } catch (err) {
      console.error("issue setting the song to previous track in queue");
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.button} onPress={prevSong}>
        <Text>{prevIcon}</Text>
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
