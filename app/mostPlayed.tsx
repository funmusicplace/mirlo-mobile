import {
  ActivityIndicator,
  Text,
  View,
  FlatList,
  Pressable,
} from "react-native";
import MenuButton from "@/components/MenuButton";
import { StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import TrackGroupItem from "@/components/TrackGroupItem";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useRouter } from "expo-router";
import { queryMostPlayed } from "@/queries/queries";
import Ionicons from "@expo/vector-icons/Ionicons";
import ErrorNotification from "@/components/ErrorNotification";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Index() {
  const { isPending, isError, data, error } = useQuery(queryMostPlayed({}));
  const { top } = useSafeAreaInsets();
  const trackGroups = data?.results;
  const router = useRouter();
  const [showError, setShowError] = useState<boolean>(true);
  const { t } = useTranslation("translation");

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
          <Pressable onPress={() => router.dismiss()}>
            <Ionicons
              name="chevron-back-outline"
              size={40}
              style={{ color: "#696969" }}
            ></Ionicons>
          </Pressable>
          <Text style={{ fontSize: 20, flex: 1, textAlign: "center" }}>
            {t("mobileApp.searchScreen.topListened")}
          </Text>
          <MenuButton style={{ marginHorizontal: 10 }} />
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
  text: {
    padding: 10,
    fontWeight: "bold",
  },
  loadSpinner: {
    flex: 1,
  },
});
