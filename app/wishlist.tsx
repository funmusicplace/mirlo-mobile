import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useAuthContext } from "@/state/AuthContext";
import { Link, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { queryWishlist } from "@/queries/queries";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MenuButton from "@/components/MenuButton";
import SearchButton from "@/components/SearchButton";
import CollectionPurchase from "@/components/CollectionPurchase";
import { isFavoritedTrack, isWishlisted } from "@/types/typeguards";
import { useTranslation } from "react-i18next";
import ErrorNotification from "@/components/ErrorNotification";
import { useColors } from "@/constants/colors";
import Text from "@/components/ThemedText";

export default function Collections() {
  const { user } = useAuthContext();
  const userId = user?.id;
  const { top } = useSafeAreaInsets();
  const { isPending, isError, data, error } = useQuery(queryWishlist(userId));
  const { t } = useTranslation();
  const [showError, setShowError] = useState<boolean>(true);
  const colors = useColors();
  const [list, setList] = useState<
    (
      | {
          userId: number;
          trackGroupId: number;
          trackGroup: AlbumProps;
          createdAt: Date;
        }
      | { userId: number; trackId: number; track: RNTrack; createdAt: Date }
      | string
    )[]
  >([]);
  const wishlist = data?.results;
  const trackFavorites = user?.trackFavorites;

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user]);

  useEffect(() => {
    wishlist?.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    trackFavorites?.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    setList([
      t("profile.yourWishlist"),
      ...(wishlist ?? []),
      t("profile.favoritedTracks"),
      ...(trackFavorites ?? []),
    ]);
  }, [wishlist, trackFavorites, t]);

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

  if (!wishlist && !trackFavorites) {
    return <Text>No wishlist found</Text>;
  }
  // console.log(wishlist);
  // console.log(trackFavorites);
  return (
    <View
      style={{ flex: 1, paddingTop: top, backgroundColor: colors.background }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 10,
            width: "100%",
            height: 60,
            borderBottomWidth: 3,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <SearchButton />
          <MenuButton />
        </View>
        <FlatList
          style={{ width: "100%" }}
          contentContainerStyle={[
            styles.listContainer,
            { backgroundColor: colors.background },
          ]}
          data={list}
          //keyExtractor={(item, index) => `${item.trackGroupId}-${index}`}
          renderItem={({ item }) => {
            if (isWishlisted(item)) {
              return (
                <Link
                  href={{
                    pathname: "/artist/[id]/album/[slug]/album-tracks",
                    params: {
                      id: item.trackGroup.artistId,
                      slug: item.trackGroup.urlSlug,
                    },
                  }}
                >
                  <CollectionPurchase trackGroup={item.trackGroup} />
                </Link>
              );
            } else if (isFavoritedTrack(item)) {
              return (
                <Link
                  href={{
                    pathname: "/artist/[id]/album/[slug]/tracks/[trackId]",
                    params: {
                      id: item.track.trackGroup.artistId,
                      slug: item.track.trackGroup.urlSlug,
                      trackId: item.trackId,
                    },
                  }}
                >
                  <CollectionPurchase
                    trackGroup={item.track.trackGroup}
                    track={item.track}
                  />
                </Link>
              );
            } else if (typeof item === "string") {
              return (
                <View
                  style={{ flexDirection: "row", justifyContent: "flex-start" }}
                >
                  <Text style={styles.listText}>{item}</Text>
                </View>
              );
            }
            return null;
          }}
        ></FlatList>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  listContainer: {
    paddingBottom: 10,
  },
  text: {
    padding: 10,
    fontWeight: "bold",
  },
  listText: {
    padding: 10,
    fontWeight: "bold",
    fontSize: 20,
  },
  loadSpinner: {
    flex: 1,
  },
});
