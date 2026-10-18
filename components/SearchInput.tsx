import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useTranslation } from "react-i18next";
import { useSearch } from "@/state/SearchContext";
import { useColors } from "@/constants/colors";
import { radius, spacing, touchTarget } from "@/constants/spacing";

// Web search input: 1.05rem text, 47 px tall with its border
const FONT_SIZE = 16.8;
const HEIGHT = 47;
const ICON_SIZE = 16;

export default function SearchInput() {
  const {
    searchValue,
    setSearchValue,
    setSearchResults,
    setShowSuggestions,
    isSearching,
  } = useSearch();
  const { t } = useTranslation("translation");
  const colors = useColors();

  const clear = () => {
    setSearchValue("");
    setSearchResults([]);
    setShowSuggestions(false);
  };

  return (
    <View>
      <TextInput
        value={searchValue}
        onChangeText={setSearchValue}
        placeholder={t("headerSearch.search")}
        placeholderTextColor={colors.inputPlaceholder}
        accessibilityLabel={t("headerSearch.searchMusic")}
        autoFocus
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.accent,
            color: colors.inputText,
          },
        ]}
      />
      <View pointerEvents="none" style={styles.searchIcon}>
        <FontAwesome5 name="search" size={ICON_SIZE} color={colors.inputText} />
      </View>
      {isSearching ? (
        <ActivityIndicator color={colors.accent} style={styles.trailing} />
      ) : searchValue ? (
        <Pressable
          onPress={clear}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          android_ripple={{
            color: colors.tintX,
            borderless: true,
            radius: touchTarget / 2,
          }}
          style={({ pressed }) => [styles.trailing, pressed && styles.pressed]}
        >
          <FontAwesome5 name="times" size={ICON_SIZE} color={colors.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: HEIGHT,
    fontSize: FONT_SIZE,
    paddingVertical: spacing.sm + spacing.xxs,
    // Room for the icons, web pl-10 and pr-10
    paddingHorizontal: spacing.xxl + spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  searchIcon: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: spacing.md + spacing.xxs,
    justifyContent: "center",
  },
  trailing: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  // Android shows the ripple instead
  pressed: {
    opacity: Platform.OS === "android" ? 1 : 0.6,
  },
});
