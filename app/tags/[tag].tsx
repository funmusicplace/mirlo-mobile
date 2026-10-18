import {
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Text as RNText,
} from "react-native";
import MenuButton from "@/components/MenuButton";
import SearchButton from "@/components/SearchButton";
import { useLocalSearchParams } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trans, useTranslation } from "react-i18next";
import * as api from "../../queries/fetch/fetchWrapper";
import TrackGroupItem, {
  useGridColumnWidth,
} from "@/components/TrackGroupItem";
import ScreenHeader, {
  BackButton,
  SectionHeader,
} from "@/components/ScreenHeader";
import ErrorNotification from "@/components/ErrorNotification";
import { useState } from "react";
import { useColors } from "@/constants/colors";
import { type } from "@/constants/typography";
import { gutter, spacing } from "@/constants/spacing";
import Text from "@/components/ThemedText";

const PAGE_SIZE = 20;
export default function TagsView() {
  const { tag } = useLocalSearchParams();
  const { t } = useTranslation("translation");

  const [showError, setShowError] = useState<boolean>(true);
  const colors = useColors();
  const columnWidth = useGridColumnWidth();

  const {
    isPending,
    isError,
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<{ results: AlbumProps[] }>({
    queryKey: ["infiniteTrackGroups", tag],
    queryFn: ({ pageParam = 0 }) => {
      const params = new URLSearchParams();
      params.append("skip", String(pageParam));
      params.append("take", String(PAGE_SIZE));
      params.append("tag", String(tag));

      return api.get(`/v1/trackGroups?${params}`, {});
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.results.length === PAGE_SIZE
        ? allPages.length * PAGE_SIZE
        : null;
    },
  });
  const { top } = useSafeAreaInsets();
  const trackGroups = data?.pages.flatMap((page) => page.results) || [];
  if (isPending) {
    return (
      <View style={{ flex: 1 }}>
        <ActivityIndicator
          size="large"
          color={colors.accent}
          style={styles.loadSpinner}
        />
      </View>
    );
  }

  if (isError) {
    console.error(error);
    return (
      <View style={{ flex: 1 }}>
        <ErrorNotification
          visible={showError}
          onDismiss={() => setShowError(false)}
          error={error}
        />
      </View>
    );
  }

  const renderLoadingFooter = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={{ marginVertical: spacing.xxl }}>
        <ActivityIndicator
          size="large"
          color={colors.accent}
          style={styles.loadSpinner}
        />
      </View>
    );
  };

  return (
    <View
      style={{ flex: 1, paddingTop: top, backgroundColor: colors.background }}
    >
      <ScreenHeader
        left={<BackButton />}
        right={
          <>
            <SearchButton />
            <MenuButton />
          </>
        }
      />
      <FlatList
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={{ paddingHorizontal: gutter }}
        data={trackGroups}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          <TrackGroupItem {...item} width={columnWidth} />
        )}
        onEndReached={() => !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.0}
        ListHeaderComponent={
          <>
            <Text accessibilityRole="header" style={styles.title}>
              {t("releases.explore")}
            </Text>
            <SectionHeader>
              <Trans
                t={t}
                i18nKey="releases.releasesForTag"
                values={{ tag: String(tag) }}
                // RN Text inherits the label color, ThemedText resets it
                components={{ tag: <RNText style={styles.tag} /> }}
              />
            </SectionHeader>
          </>
        }
        ListFooterComponent={renderLoadingFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    ...type.pageTitle,
    marginVertical: spacing.xxl,
  },
  tag: {
    fontWeight: "bold",
  },
  loadSpinner: {
    flex: 1,
  },
});
