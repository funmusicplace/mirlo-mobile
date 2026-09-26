import { debounce } from "lodash";
import SearchHeader from "@/components/SearchHeader";
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Text,
  ScrollView,
} from "react-native";
import { useSearch } from "@/state/SearchContext";
import { useEffect, useMemo, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { queryTags } from "@/queries/queries";
import TagPill from "@/components/TagPill";
import { optionDisplay } from "@/components/SearchOptionRenderer";
import { Link } from "expo-router";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export default function SearchPage() {
  const {
    showSuggestions,
    setShowSuggestions,
    searchResults,
    setSearchValue,
    setIsSearching,
    getOptions,
    setSearchResults,
    searchValue,
    isSearching,
  } = useSearch();
  const { data: tags, isPending } = useQuery(
    queryTags({ orderBy: "count", take: 25 }),
  );
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation("translation");

  const tagPills = useMemo(() => {
    const group = tags?.results.map((tag, index) => {
      return <TagPill key={index} tagName={tag.tag} />;
    });
    return group;
  }, [tags]);
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

  if (isPending) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "white",
          paddingTop: top,
          paddingBottom: bottom,
          justifyContent: "space-between",
        }}
      >
        <SearchHeader style={{ borderBottomWidth: 1, marginBottom: 1 }} />
        <ActivityIndicator
          size="large"
          color="#BE3455"
          style={styles.loadSpinner}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
        paddingTop: top,
        paddingBottom: bottom,
      }}
    >
      <SearchHeader style={{ borderBottomWidth: 1, marginBottom: 1 }} />

      {!isSearching &&
        !showSuggestions &&
        !searchValue &&
        !searchResults.length && (
          <ScrollView style={{ marginTop: 20, marginHorizontal: 10, gap: 20 }}>
            <Text>{t("mobileApp.searchScreen.searchByPopular")}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
              {tagPills}
            </View>
            <TypeLinks />
          </ScrollView>
        )}

      {isSearching && (
        <View style={{ marginVertical: 30, flex: 1 }}>
          <ActivityIndicator
            size="large"
            color="#BE3455"
            style={styles.loadSpinner}
          />
        </View>
      )}

      {searchValue &&
        showSuggestions &&
        !isSearching &&
        searchResults.length < 1 && (
          <View
            style={{
              flex: 1,
              backgroundColor: "white",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <Text style={{ margin: 20, fontSize: 20 }}>
              Hmmm, couldn't find anything for that search... Try again!
            </Text>
          </View>
        )}

      {!isSearching && showSuggestions && searchResults.length > 0 && (
        <FlatList
          style={{
            backgroundColor: "white",
            flex: 1,
            width: "100%",
          }}
          data={searchResults}
          renderItem={({ item, index }) => optionDisplay(item, index)}
          keyExtractor={(item, index) => `${index}-${item.id || item.name}`}
        />
      )}
    </View>
  );
}

function TypeLinks() {
  const router = useRouter();
  const { t } = useTranslation("translation");
  return (
    <View
      style={{
        gap: 20,
        paddingVertical: 15,
      }}
    >
      <Link href={{ pathname: "/topSold" }} onPress={() => router.back()}>
        Popular{" >"}
      </Link>
      <Link href={{ pathname: "/mostPlayed" }} onPress={() => router.back()}>
        {t("mobileApp.searchScreen.topListened")}
        {" >"}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  loadSpinner: {
    flex: 1,
  },
});
