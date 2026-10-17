import {
  Text,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ViewProps,
} from "react-native";
import { usePlayer } from "@/state/PlayerContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import NextButton from "./NextButton";
import PrevButton from "./PrevButton";
import LoopButton from "./LoopButton";
import ShuffleButton from "./ShuffleButton";
import { Link } from "expo-router";
import TrackPlayer, {
  State,
  PlaybackState,
  useProgress,
} from "react-native-track-player";
import Slider from "@react-native-community/slider";
import { useColors } from "@/constants/colors";

type PlayerStyleProps = {
  bottomDistance: number;
};

type PlayButtonProps = {
  buttonColor?: string;
};

export default function Player({ style }: ViewProps) {
  return (
    //<View style={style}>
    <View style={[styles.buttonsContainer, style]}>
      <ShuffleButton />
      <PrevButton />
      <PlayerPlayButton buttonColor="black" />
      <NextButton />
      <LoopButton />
    </View>
    //</View>
  );
}

function PlayerPlayButton({ buttonColor }: PlayButtonProps) {
  const { playbackState, isPlaying } = usePlayer();
  const colors = useColors();
  const playIcon = <Ionicons name="play" size={40} />;
  const pauseIcon = <Ionicons name="pause" size={40} />;

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
    <TouchableOpacity
      style={styles.button}
      onPress={() => onPress(playbackState)}
    >
      <Ionicons
        name={
          playbackState.state === State.Buffering || isPlaying
            ? "pause-circle-outline"
            : "play-circle-outline"
        }
        size={75}
        color={colors.text}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  progressBar: {
    alignSelf: "stretch",
    marginLeft: 5,
    marginRight: 5,
  },
  container: {
    width: "90%",
    position: "absolute",
    padding: 5,
    paddingHorizontal: 10,
    bottom: 100,
    backgroundColor: "#ededed",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 0 3 5 rgb(0, 0, 0, .5)",
    borderRadius: 10,
    zIndex: 10,
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginHorizontal: 5,
  },
  playPauseButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
});
