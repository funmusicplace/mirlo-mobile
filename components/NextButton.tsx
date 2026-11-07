import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { HeaderButton } from "@/components/ScreenHeader";
import { useColors } from "@/constants/colors";
import { touchTarget } from "@/constants/spacing";
import { skipTrack } from "@/scripts/trackPlayUtils";

export default function NextButton() {
  const { t } = useTranslation("translation");
  const colors = useColors();

  const nextSong = async () => {
    try {
      await skipTrack("next");
    } catch (err) {
      console.error("issue skipping to next song", err);
    }
  };

  return (
    <HeaderButton
      size={touchTarget}
      accessibilityLabel={t("player.nextTrack")}
      onPress={nextSong}
    >
      <MaterialIcons name="skip-next" size={36} color={colors.accent} />
    </HeaderButton>
  );
}
