import {
  ActivityIndicator,
  View,
  FlatList,
  RefreshControl,
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
import MirloLogo, { LOGO_SIZE } from "@/components/MirloLogo";
import { useEffect, useRef, useState } from "react";
import { useAppIsReadyContext } from "@/state/AppReadyContext";
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
  const {
    isPending,
    isError,
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
  } = useInfiniteQuery<{ results: AlbumProps[] }>({
    queryKey: ["infiniteTrackGroups"],
    queryFn: ({ pageParam = 0 }) => {
      const params = new URLSearchParams();
      params.append("skip", String(pageParam));
      params.append("take", String(PAGE_SIZE));
      params.append("distinctArtists", "true");
      params.append("isReleased", "released");

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
  const [showError, setShowError] = useState<boolean>(true);
  const listRef = useRef<FlatList<AlbumProps>>(null);
  const columnWidth = useGridColumnWidth();

  useEffect(() => {
    if (data || API_ROOT === "http://localhost:3000") {
      const timer = setTimeout(() => {
        setIsDataLoaded(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data]);

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
        left={
          <HeaderButton
            size={LOGO_SIZE}
            accessibilityLabel="Mirlo"
            accessibilityHint="Scrolls to the top"
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
      <FlatList
        ref={listRef}
        // Native counterpart of the web's Refresh button on this list
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.background}
          />
        }
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={{ paddingHorizontal: gutter }}
        data={trackGroups}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          <TrackGroupItem {...item} width={columnWidth} />
        )}
        onEndReached={() => {
          if (!hasNextPage || isFetchingNextPage) {
            return;
          }
          fetchNextPage();
        }}
        onEndReachedThreshold={0.0}
        ListHeaderComponent={
          <>
            <Text style={styles.explore} accessibilityRole="header">
              {t("home.exploreMusic", "Explore music")}
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
