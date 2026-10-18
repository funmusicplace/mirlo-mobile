import { debounce } from "lodash";
import SearchHeader from "@/components/SearchHeader";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  SectionList,
  Platform,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Result, useSearch } from "@/state/SearchContext";
import { useEffect, useMemo, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { queryTags } from "@/queries/queries";
import TagPill, { TagPillList } from "@/components/TagPill";
import { optionDisplay } from "@/components/SearchOptionRenderer";
import { RESULT_INSET, SearchGroupHeading } from "@/components/SearchItem";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { useColors } from "@/constants/colors";
import { radius, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";
import Text from "@/components/ThemedText";

// Result groups in the web's order
const GROUPS = [
  ["isTag", "headerSearch.tags"],
  ["isArtist", "headerSearch.artists"],
  // Local headerSearch.albums still reads "Albums", the web heading is "Releases"
  ["isTrackGroup", "artist.releases"],
  ["isTrack", "headerSearch.tracks"],
] as const;

type GroupedResult = Result &
  Partial<Record<(typeof GROUPS)[number][0], boolean>>;

export default function SearchPage() {
  const {
    showSuggestions,
    setShowSuggestions,
    searchResults,
    setIsSearching,
    getOptions,
    setSearchResults,
    searchValue,
    isSearching,
  } = useSearch();
  const { data: tags, isPending } = useQuery(
    queryTags({ orderBy: "count", take: 25 }),
  );
  const { top } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const router = useRouter();
  const { t } = useTranslation("translation");
  const colors = useColors();

  const tagPills = useMemo(() => {
    const group = tags?.results.map((tag, index) => {
      return (
        <TagPill
          key={index}
          tagName={tag.tag}
          variant="cover"
          onPress={() => router.back()}
        />
      );
    });
    return group;
  }, [tags, router]);
  const searchCallbackRef = useRef(
    debounce(async (searchString) => {
      if (searchString && searchString.length > 1) {
        setShowSuggestions(true);
        setIsSearching(true);
        const results = await getOptions(searchString);

        setSearchResults(results ?? []);
        setIsSearching(false);
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 500),
  ).current;

  useEffect(() => {
    searchCallbackRef(searchValue);
  }, [searchValue]);

  const sections = useMemo(
    () =>
      GROUPS.map(([flag, title]) => ({
        title: t(title),
        data: searchResults.filter((result) => (result as GroupedResult)[flag]),
      })).filter((section) => section.data.length > 0),
    [searchResults, t],
  );

  const showDiscovery =
    !isSearching && !showSuggestions && !searchValue && !searchResults.length;
  const showNoResults =
    !!searchValue &&
    showSuggestions &&
    !isSearching &&
    searchResults.length < 1;
  const showResults =
    !isSearching && showSuggestions && searchResults.length > 0;

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.overlay,
          // Web dialog starts 10vh down
          paddingTop: Math.max(top, height * 0.1),
        },
      ]}
    >
      {/* The overlay is dark in both themes */}
      <StatusBar style="light" />
      <SearchHeader />

      {showDiscovery && (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.discovery}
        >
          <Text
            accessibilityRole="header"
            style={[type.label, { color: colors.coverChipText }]}
          >
            {t("mobileApp.searchScreen.searchByPopular")}
          </Text>
          {isPending ? (
            <ActivityIndicator
              size="large"
              color={colors.accent}
              style={styles.tagsSpinner}
            />
          ) : (
            <TagPillList>{tagPills}</TagPillList>
          )}
          <TypeLink label="Popular" pathname="/topSold" />
          <TypeLink
            label={t("mobileApp.searchScreen.topListened")}
            pathname="/mostPlayed"
          />
        </ScrollView>
      )}

      {showNoResults && (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              type.small,
              styles.noResults,
              { color: colors.secondaryText },
            ]}
          >
            {t("headerSearch.noResults")}
          </Text>
        </View>
      )}

      {showResults && (
        <SectionList
          style={[
            styles.card,
            styles.results,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
          contentContainerStyle={styles.resultsContent}
          sections={sections}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderSectionHeader={({ section }) => (
            <SearchGroupHeading title={section.title} />
          )}
          renderItem={({ item, index }) => optionDisplay(item, index)}
          keyExtractor={(item, index) => `${index}-${item.id || item.name}`}
        />
      )}
    </View>
  );
}

function TypeLink({
  label,
  pathname,
}: {
  label: string;
  pathname: "/topSold" | "/mostPlayed";
}) {
  const router = useRouter();
  const colors = useColors();
  return (
    <Pressable
      onPress={() => {
        router.back();
        router.navigate(pathname);
      }}
      accessibilityRole="link"
      android_ripple={{ color: colors.coverChipBorder }}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      <Text
        style={[type.body, styles.underline, { color: colors.coverChipText }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Web dialog: 90vw wide, 12 px between its parts
  screen: {
    flex: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.lg + spacing.xs,
    paddingBottom: spacing.lg,
  },
  discovery: {
    paddingTop: spacing.sm,
  },
  tagsSpinner: {
    marginVertical: spacing.lg,
  },
  link: {
    alignSelf: "flex-start",
    minHeight: touchTarget,
    justifyContent: "center",
  },
  underline: {
    textDecorationLine: "underline",
  },
  // The border separates the card from the overlay in dark mode
  card: {
    borderRadius: radius.sm,
    borderWidth: 1,
    overflow: "hidden",
  },
  // Sized to its rows until it reaches the bottom of the overlay
  results: {
    flexGrow: 0,
  },
  resultsContent: {
    paddingVertical: spacing.xs,
  },
  noResults: {
    textAlign: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: RESULT_INSET,
  },
  // Android shows the ripple instead
  pressed: {
    opacity: Platform.OS === "android" ? 1 : 0.6,
  },
});
