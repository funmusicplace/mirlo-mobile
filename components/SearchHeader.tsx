import { StyleSheet, View, ViewProps } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import SearchBar from "./searchBar";
import { HeaderButton } from "@/components/ScreenHeader";
import Text from "@/components/ThemedText";
import { useSearch } from "@/state/SearchContext";
import { useColors } from "@/constants/colors";
import { spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

export default function SearchHeader({ style }: ViewProps) {
  const router = useRouter();
  const { setSearchValue, setSearchResults } = useSearch();
  const { t } = useTranslation("translation");
  const colors = useColors();
  return (
    <View style={[styles.header, style]}>
      <View style={styles.titleRow}>
        <Text
          accessibilityRole="header"
          style={[type.heading, styles.title, { color: colors.coverChipText }]}
        >
          {t("headerSearch.searchMusic")}
        </Text>
        <HeaderButton
          size={touchTarget}
          accessibilityLabel="Close"
          // Light ripple on the dark overlay
          android_ripple={{
            color: colors.coverChipBorder,
            borderless: true,
            radius: touchTarget / 2,
          }}
          onPress={() => {
            setSearchValue("");
            setSearchResults([]);
            router.dismiss(1);
          }}
        >
          <FontAwesome5 name="times" size={20} color={colors.coverChipText} />
        </HeaderButton>
      </View>
      <SearchBar />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    flexShrink: 1,
  },
});
