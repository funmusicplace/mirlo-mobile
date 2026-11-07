import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { HeaderButton } from "@/components/ScreenHeader";
import { useColors } from "@/constants/colors";

export default function SearchButton() {
  const router = useRouter();
  const { t } = useTranslation("translation");
  const colors = useColors();
  return (
    <HeaderButton
      accessibilityLabel={t("pageTitles.search")}
      accessibilityHint={t("mobileApp.accessibility.opensSearch")}
      onPress={() => router.push("/search")}
    >
      <FontAwesome5 name="search" size={20} color={colors.accent} solid />
    </HeaderButton>
  );
}
