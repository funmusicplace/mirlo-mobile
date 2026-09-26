import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useAuthContext } from "@/state/AuthContext";
import { Link, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { queryUserCollection } from "@/queries/queries";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MenuButton from "@/components/MenuButton";
import SearchButton from "@/components/SearchButton";
import CollectionPurchase from "@/components/CollectionPurchase";
import { isTrackGroupPurchase, isTrackPurchase } from "@/types/typeguards";
import ErrorNotification from "@/components/ErrorNotification";
import { useTranslation } from "react-i18next";
import { useColors } from "@/constants/colors";
import Text from "@/components/ThemedText";

export default function Collections() {
  const { user } = useAuthContext();
  const userId = user?.id;
  const { top } = useSafeAreaInsets();
  const colors = useColors();
  const { isPending, isError, data, error } = useQuery(
    queryUserCollection(userId),
  );
  const [showError, setShowError] = useState<boolean>(true);
  const purchases = data?.results;
  const { t } = useTranslation("translation");

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user]);

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

  if (!purchases) {
    return <Text>No purchases found</Text>;
  }

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
          data={purchases}
          keyExtractor={(item) =>
            `${isTrackGroupPurchase(item) ? item.trackGroupId : item.trackId}`
          }
          ListHeaderComponent={
            <View
              style={{ flexDirection: "row", justifyContent: "flex-start" }}
            >
              <Text style={styles.listText}>{t("profile.yourCollection")}</Text>
            </View>
          }
          renderItem={({ item }) => {
            if (isTrackGroupPurchase(item) && item.trackGroup) {
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
            } else if (isTrackPurchase(item)) {
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
  listContainer: {},
  text: {
    padding: 10,
    fontWeight: "bold",
  },
  loadSpinner: {
    flex: 1,
  },
  listText: {
    padding: 10,
    fontWeight: "bold",
    fontSize: 20,
  },
});
