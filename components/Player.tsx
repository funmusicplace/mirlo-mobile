import { Platform, Pressable, StyleSheet, View, ViewProps } from "react-native";
import { usePlayer } from "@/state/PlayerContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import NextButton from "./NextButton";
import PrevButton from "./PrevButton";
import LoopButton from "./LoopButton";
import ShuffleButton from "./ShuffleButton";
import TrackPlayer, { State, PlaybackState } from "react-native-track-player";
import { useColors } from "@/constants/colors";
import { radius } from "@/constants/spacing";

// The footer play circle (40) scaled for the full screen
const PLAY_SIZE = 64;

export default function Player({ style }: ViewProps) {
  return (
    <View style={[styles.controls, style]}>
      <ShuffleButton />
      <PrevButton />
      <PlayerPlayButton />
      <NextButton />
      <LoopButton />
    </View>
  );
}

function PlayerPlayButton() {
  const { playbackState, isPlaying } = usePlayer();
  const colors = useColors();
  const playing = playbackState.state === State.Buffering || isPlaying;

  async function onPress(playbackState: PlaybackState | { state: undefined }) {
    try {
      if (
        playbackState.state === State.Paused ||
        playbackState.state === State.Ready
      ) {
        await TrackPlayer.play();
      } else if (
        playbackState.state === State.Playing ||
        playbackState.state === State.Buffering
      ) {
        await TrackPlayer.pause();
      } else {
        //console.log(playbackState.state);
      }
    } catch (error) {
      console.error("issue with player toggle playback botton", error);
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={playing ? "Pause" : "Play"}
      android_ripple={{
        color: colors.tintX,
        borderless: true,
        radius: PLAY_SIZE / 2,
      }}
      onPress={() => onPress(playbackState)}
      style={({ pressed }) => [
        styles.play,
        { borderColor: colors.accent },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={playing ? "pause-outline" : "play-outline"}
        size={28}
        color={colors.accent}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  play: {
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Android shows the ripple instead
  pressed: {
    opacity: Platform.OS === "android" ? 1 : 0.6,
  },
});
