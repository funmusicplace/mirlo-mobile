import { ActivityIndicator, View, FlatList, Text } from "react-native";
import MenuButton from "@/components/MenuButton";
import SearchButton from "@/components/SearchButton";
import { StyleSheet } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import TrackGroupItem from "@/components/TrackGroupItem";
import PlayFeaturedButton from "@/components/PlayFeaturedButton";
import { useEffect, useState } from "react";
import { useAppIsReadyContext } from "@/state/AppReadyContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as api from "../queries/fetch/fetchWrapper";
import { Link } from "expo-router";
import { API_ROOT } from "@/constants/api-root";
import ErrorNotification from "@/components/ErrorNotification";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 20;

export default function Index() {
  const { t } = useTranslation("translation");
  const { setIsDataLoaded } = useAppIsReadyContext();
  const {
    isPending,
    isError,
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
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
          color="#BE3455"
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
    if (!isFetching && !isFetchingNextPage) return null;

    return (
      <View style={{ marginVertical: 30 }}>
        <ActivityIndicator
          size="large"
          color="#BE3455"
          style={styles.loadSpinner}
        />
      </View>
    );
  };
  return (
    <View style={{ flex: 1, paddingTop: top, backgroundColor: "white" }}>
      <View style={styles.container}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 10,
            width: "100%",
            height: 60,
            borderBottomWidth: 3,
            borderBottomColor: "#e8e9eb",
            backgroundColor: "white",
          }}
        >
          <SearchButton />
          <MenuButton />
        </View>
        <FlatList
          style={{ width: "100%" }}
          contentContainerStyle={styles.listContainer}
          data={trackGroups}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => (
            <Link
              href={{
                pathname: "/artist/[id]/album/[slug]/album-tracks",
                params: { id: item.artistId, slug: item.urlSlug },
              }}
            >
              <TrackGroupItem
                id={item.id}
                cover={item.cover}
                title={item.title}
                artist={item.artist}
                artistId={item.artistId}
                urlSlug={item.urlSlug}
                userTrackGroupPurchases={item.userTrackGroupPurchases}
                releaseDate={item.releaseDate}
                tracks={item.tracks}
                trackGroupId={item.trackGroupId}
              ></TrackGroupItem>
            </Link>
          )}
          onEndReached={() => {
            if (!hasNextPage || isFetchingNextPage) {
              return;
            }
            fetchNextPage();
          }}
          onEndReachedThreshold={0.0}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>
                {t("releases.recentReleases")}
              </Text>
              <PlayFeaturedButton albums={trackGroups.slice(0, PAGE_SIZE)} />
            </View>
          }
          ListFooterComponent={renderLoadingFooter}
        ></FlatList>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  listContainer: {
    backgroundColor: "#FFF",
    zIndex: 10,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "white",
  },
  listHeaderTitle: {
    fontWeight: "bold",
    fontSize: 20,
    color: "black",
  },
  text: {
    padding: 10,
    fontWeight: "bold",
  },
  loadSpinner: {
    flex: 1,
  },
});
