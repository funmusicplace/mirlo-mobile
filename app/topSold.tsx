import { ActivityIndicator, View, FlatList, Pressable } from "react-native";
import MenuButton from "@/components/MenuButton";
import { StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import TrackGroupItem from "@/components/TrackGroupItem";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useRouter } from "expo-router";
import { queryTopSold } from "@/queries/queries";
import Ionicons from "@expo/vector-icons/Ionicons";
import ErrorNotification from "@/components/ErrorNotification";
import { useState } from "react";
import { useColors } from "@/constants/colors";
import Text from "@/components/ThemedText";

export default function Index() {
  const { isPending, isError, data, error } = useQuery(queryTopSold({}));
  const { top } = useSafeAreaInsets();
  const trackGroups = data?.results;
  const router = useRouter();
  const [showError, setShowError] = useState<boolean>(true);
  const colors = useColors();

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

  return (
    <View
      style={{ flex: 1, paddingTop: top, backgroundColor: colors.background }}
    >
      <View style={[styles.container, { backgroundColor: colors.muted }]}>
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
          <Pressable onPress={() => router.dismiss()}>
            <Ionicons
              name="chevron-back-outline"
              size={40}
              style={{ color: colors.secondaryText }}
            ></Ionicons>
          </Pressable>
          <Text style={{ fontSize: 20, flex: 1, textAlign: "center" }}>
            Popular
          </Text>
          <MenuButton style={{ marginHorizontal: 10 }} />
        </View>

        <FlatList
          style={{ width: "100%" }}
          contentContainerStyle={[
            styles.listContainer,
            { backgroundColor: colors.background },
          ]}
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
  listContainer: {
    zIndex: 10,
  },
  text: {
    padding: 10,
    fontWeight: "bold",
  },
  loadSpinner: {
    flex: 1,
  },
});
