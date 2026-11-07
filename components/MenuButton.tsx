import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Svg, { Rect } from "react-native-svg";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { HeaderButton } from "@/components/ScreenHeader";
import { useAuthContext } from "@/state/AuthContext";
import { useColors } from "@/constants/colors";

export default function MenuButton() {
  const router = useRouter();
  const { t } = useTranslation("translation");
  const colors = useColors();
  const { user } = useAuthContext();
  return (
    <HeaderButton
      onPress={() => {
        router.push("/menu");
      }}
      accessibilityLabel={t("headerMenu.menu")}
      accessibilityHint={t("mobileApp.accessibility.opensMenu")}
    >
      {user ? (
        // The web's signed-in menu glyph
        <Svg width={16} height={14} viewBox="0 0 16 14" fill={colors.accent}>
          <Rect y={0} width={16} height={3} rx={1.5} />
          <Rect y={5} width={16} height={3} rx={1.5} />
          <Rect y={10} width={16} height={3} rx={1.5} />
        </Svg>
      ) : (
        <FontAwesome5 name="user-alt" size={16} color={colors.accent} solid />
      )}
    </HeaderButton>
  );
}
