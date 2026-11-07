import { StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { usePlayer } from "@/state/PlayerContext";
import TrackPlayer, { RepeatMode } from "react-native-track-player";
import { useTranslation } from "react-i18next";
import Text from "@/components/ThemedText";
import { HeaderButton } from "@/components/ScreenHeader";
import { useColors } from "@/constants/colors";
import { spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

const MODE_KEYS = {
  none: "mobileApp.accessibility.repeatOff",
  queue: "player.loopingQueue",
  track: "player.loopingTrack",
} as const;

export default function LoopButton() {
  const { looping, setLooping } = usePlayer();
  const { t } = useTranslation("translation");
  const colors = useColors();

  const onPress = async () => {
    try {
      if (looping === "none") {
        setLooping("queue");
        await TrackPlayer.setRepeatMode(RepeatMode.Queue);
      } else if (looping === "queue") {
        setLooping("track");
        await TrackPlayer.setRepeatMode(RepeatMode.Track);
      } else {
        setLooping("none");
        await TrackPlayer.setRepeatMode(RepeatMode.Off);
      }
    } catch (err) {
      console.error("Issue setting loop mode");
    }
  };

  return (
    <HeaderButton
      size={touchTarget}
      accessibilityLabel={t("player.loopMusic")}
      accessibilityState={{ selected: looping !== "none" }}
      accessibilityValue={{ text: t(MODE_KEYS[looping]) }}
      onPress={onPress}
    >
      <Feather
        name="repeat"
        size={22}
        color={looping === "none" ? colors.inactive : colors.accent}
      />
      {looping === "track" && (
        <Text style={[type.xsmall, styles.indicator, { color: colors.accent }]}>
          {1}
        </Text>
      )}
    </HeaderButton>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    fontWeight: "700",
  },
});
