import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { HeaderButton } from "@/components/ScreenHeader";
import { useColors } from "@/constants/colors";
import { touchTarget } from "@/constants/spacing";
import { skipTrack } from "@/scripts/trackPlayUtils";

export default function PrevButton() {
  const colors = useColors();

  const prevSong = async () => {
    try {
      await skipTrack("previous");
    } catch (err) {
      console.error("issue setting the song to previous track in queue", err);
    }
  };

  return (
    <HeaderButton
      size={touchTarget}
      accessibilityLabel="Previous track"
      onPress={prevSong}
    >
      <MaterialIcons name="skip-previous" size={36} color={colors.accent} />
    </HeaderButton>
  );
}
