import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useRouter } from "expo-router";
import { HeaderButton } from "@/components/ScreenHeader";
import { useColors } from "@/constants/colors";

export default function SearchButton() {
  const router = useRouter();
  const colors = useColors();
  return (
    <HeaderButton
      accessibilityLabel="Search"
      accessibilityHint="Opens the search bar"
      onPress={() => router.push("/search")}
    >
      <FontAwesome5 name="search" size={20} color={colors.accent} solid />
    </HeaderButton>
  );
}
