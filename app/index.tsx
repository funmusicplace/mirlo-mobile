import {
  ActivityIndicator,
  AppState,
  View,
  FlatList,
  RefreshControl,
  ScrollView,
} from "react-native";
import MenuButton from "@/components/MenuButton";
import SearchButton from "@/components/SearchButton";
import { StyleSheet } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import TrackGroupItem, {
  useGridColumnWidth,
} from "@/components/TrackGroupItem";
import PlayFeaturedButton from "@/components/PlayFeaturedButton";
import ScreenHeader, {
  HeaderButton,
  SectionHeader,
} from "@/components/ScreenHeader";
import MirloLogo, { LOGO_LABEL, LOGO_SIZE } from "@/components/MirloLogo";
import { useEffect, useRef, useState } from "react";
import { useAppIsReadyContext } from "@/state/AppReadyContext";
import { useInstances } from "@/state/InstancesContext";
import { dedupeReleases, mergeReleases } from "@/scripts/instances";
import { useNextPage } from "@/scripts/useNextPage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as api from "../queries/fetch/fetchWrapper";
import { API_ROOT } from "@/constants/api-root";
import ErrorNotification from "@/components/ErrorNotification";
import { useTranslation } from "react-i18next";
import { useColors } from "@/constants/colors";
import { gutter, spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";
import Text from "@/components/ThemedText";

const PAGE_SIZE = 20;

export default function Index() {
  const { t } = useTranslation("translation");
  const { setIsDataLoaded } = useAppIsReadyContext();
  const colors = useColors();
  const { instances, loaded } = useInstances();
  const {
    isPending,
    isLoadingError,
    isFetched,
    isFetching,
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    refetch,
  } = useInfiniteQuery({
    // A new source starts the feed over
    queryKey: ["infiniteTrackGroups", instances],
    queryFn: async ({ pageParam: skips }) => {
      const pages = await Promise.allSettled(
        instances.map(async ({ apiRoot }, index) => {
          const params = new URLSearchParams();
          params.append("skip", String(skips[index]));
          params.append("take", String(PAGE_SIZE));
          params.append("distinctArtists", "false");
          // Pre-orders would sort first, the site's home leaves them out too
          params.append("isReleased", "released");
          const { results } = await api.getMany<AlbumProps>(
            `/v1/trackGroups?${params}`,
            { apiRoot },
          );
          // Only releases from another instance carry its apiRoot
          return apiRoot === API_ROOT
            ? results
            : results.map((album) => ({ ...album, apiRoot }));
        }),
      );
      return mergeReleases(pages, skips, PAGE_SIZE);
    },
    initialPageParam: instances.map(() => 0),
    getNextPageParam: (lastPage) => lastPage.next,
    enabled: loaded,
  });
  const { top } = useSafeAreaInsets();
  const trackGroups = data ? dedupeReleases(data.pages) : [];
  const [dismissed, setDismissed] = useState<Error | null>(null);
  // A retry sends the failed query back to pending and clears its error, so the
  // box keeps the last one until the sources change
  const sources = JSON.stringify(instances);
  const [lastError, setLastError] = useState<{
    error: Error;
    sources: string;
  }>();
  if (lastError && lastError.sources !== sources) setLastError(undefined);
  if (isLoadingError && lastError?.error !== error) {
    setLastError({ error, sources });
  }
  const shownError = isLoadingError
    ? error
    : isPending && isFetched
      ? lastError?.error
      : undefined;
  // Each failure is a new error, so a failed retry shows a dismissed box again
  const boxVisible = shownError !== undefined && shownError !== dismissed;
  const listRef = useRef<FlatList<AlbumProps>>(null);
  const columnWidth = useGridColumnWidth();

  // An error ends the splash too, or it would hide the error box
  useEffect(() => {
    if (data || isLoadingError || API_ROOT === "http://localhost:3000") {
      const timer = setTimeout(() => {
        setIsDataLoaded(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data, isLoadingError]);

  // Only a failed first load retries on return, a loaded feed stays put
  useEffect(() => {
    if (!isLoadingError) return;
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener("change", (state) => {
      // iOS overlays like Control Center go inactive -> active
      if (previous === "background" && state === "active") refetch();
      previous = state;
    });
    return () => subscription.remove();
  }, [isLoadingError, refetch]);

  const nextPage = useNextPage({
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  });

  if (isPending && !shownError) {
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

  const screenStyle = {
    flex: 1,
    paddingTop: top,
    backgroundColor: colors.background,
  };
  const header = (
    <ScreenHeader
      left={
        <HeaderButton
          size={LOGO_SIZE}
          accessibilityLabel={LOGO_LABEL}
          accessibilityHint={t("mobileApp.accessibility.scrollsToTop")}
          onPress={() =>
            listRef.current?.scrollToOffset({ offset: 0, animated: true })
          }
        >
          <MirloLogo />
        </HeaderButton>
      }
      right={
        <>
          <SearchButton />
          <MenuButton />
        </>
      }
    />
  );

  // Native counterpart of the web's Refresh button on this list
  // A retry from the error screen is pending, and the box shows it itself
  const refreshControl = (
    <RefreshControl
      refreshing={isFetching && !isFetchingNextPage && !boxVisible}
      onRefresh={refetch}
      tintColor={colors.accent}
      colors={[colors.accent]}
      progressBackgroundColor={colors.background}
    />
  );

  if (shownError) {
    if (error) console.error(error);
    return (
      <View style={screenStyle}>
        {header}
        <ScrollView
          refreshControl={refreshControl}
          // iOS only pulls from content, and the box can be dismissed
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <ErrorNotification
            visible={boxVisible}
            onDismiss={() => setDismissed(shownError)}
            error={shownError}
            onRetry={refetch}
            retrying={isFetching}
          />
        </ScrollView>
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
    <View style={screenStyle}>
      {header}
      <FlatList
        ref={listRef}
        refreshControl={refreshControl}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={{ paddingHorizontal: gutter }}
        data={trackGroups}
        keyExtractor={(item) => `${item.apiRoot ?? ""}-${item.id}`}
        renderItem={({ item }) => (
          <TrackGroupItem {...item} width={columnWidth} />
        )}
        {...nextPage}
        onEndReachedThreshold={0.0}
        ListHeaderComponent={
          <>
            <Text style={styles.explore} accessibilityRole="header">
              {t("home.exploreMusic")}
            </Text>
            <SectionHeader
              right={
                <PlayFeaturedButton albums={trackGroups.slice(0, PAGE_SIZE)} />
              }
            >
              {t("releases.recentReleases")}
            </SectionHeader>
          </>
        }
        ListFooterComponent={renderLoadingFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Web SplashTitle as the section h2, 32 above the next label
  explore: {
    ...type.display,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  loadSpinner: {
    flex: 1,
  },
});
