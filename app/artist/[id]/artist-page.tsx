import { useQuery } from "@tanstack/react-query";
import { queryArtist } from "@/queries/queries";
import { Link, router, Stack, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  FlatList} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Markdown from "react-native-markdown-display";
import React from "react";
import { useTranslation } from "react-i18next";
import { linkifyUrls } from "@/scripts/utils";

export default function ArtistPage() {
  const { id } = useLocalSearchParams();
  const { data, isError, isPending, error } = useQuery(
    queryArtist({ artistSlug: String(id) ?? "" })
  );
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
    return (
      <View>
        <Text>Error: {error.message} </Text>
      </View>
    );
  }

  const artistInfo = data;

  const getModifiedData = (data: any) => {
    if (!data || data.length == 0) return [];

    if (data.length % 2 !== 0) {
      // add placeholder item for list
      return [...data, { id: "placeholder", isPlaceholder: true }];
    }

    return data;
  };

  const artistAlbums = artistInfo.trackGroups?.map((album) => {
    return (
      <View key={album.id} style={styles.albumItem}>
        <Image
          style={{ width: "100%", height: itemWidth }}
          source={{
            uri: album.cover.sizes[600],
          }}
        />
        <Text style={styles.albumTitle}>{album.title}</Text>
      </View>
    );
  });

  const handleEmpty = () => {
    return <Text>No Albums Present!</Text>;
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 10,
          width: "100%",
          height: 60,
          backgroundColor: "#fafafa",
        }}
      >
        <Pressable onPress={() => router.dismiss()}>
          <Ionicons
            name="chevron-back-outline"
            size={40}
            style={{ color: "#696969" }}
          ></Ionicons>
        </Pressable>
      </View>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContainer}
        horizontal={false}
        columnWrapperStyle={{
          justifyContent: "space-evenly",
        }}
        numColumns={2}
        ListEmptyComponent={handleEmpty}
        data={getModifiedData(artistInfo.trackGroups)}
        renderItem={({ item }) => {
          if (item.isPlaceholder) {
            return <View style={[styles.albumItem, { opacity: 0 }]} />;
          }

          return (
            <View style={styles.albumItem}>
              <Link
                href={{
                  pathname: "/artist/[id]/album/[slug]/album-tracks",
                  params: { id: item.artistId, slug: item.urlSlug },
                }}
              >
                <Image
                  style={{ width: "100%", height: itemWidth }}
                  source={{
                    uri: item.cover.sizes[600],
                  }}
                />
              </Link>
              <Text style={styles.albumTitle}>{item.title}</Text>
            </View>
          );
        }}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponentStyle={{ marginBottom: 20 }}
        ListHeaderComponent={() => (
          <View>
            {artistInfo.banner && (
              <Image
                style={{ width: "100%", height: 150 }}
                source={{
                  uri: artistInfo?.banner?.sizes?.[625] || "",
                }}
              />
            )}
            <View style={styles.introBanner}>
              {artistInfo.avatar && (
                <Image
                  style={styles.avatar}
                  source={{
                    uri: artistInfo?.avatar?.sizes?.[600] || "",
                  }}
                  resizeMode="cover"
                />
              )}
              <View style={{ marginHorizontal: 20, gap: 5 }}>
                <Text style={{ color: "black", fontWeight: "bold" }}>
                  {artistInfo.name}
                </Text>
                {artistInfo.location && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={"#b5b5b5"}
                    ></Ionicons>
                    <Text style={{ color: "#b5b5b5" }}>
                      {artistInfo.location}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <View
            style={{
              gap: 10,
              marginHorizontal: 20,
              marginTop: 20,
              marginBottom: 70,
            }}
          >
            <Text style={{ fontWeight: "bold" }}>
              {t("trackGroupDetails.about")}
            </Text>

            {artistInfo.bio ? (
              <Markdown>
                {linkifyUrls(
                  artistInfo.bio.replace(/([^\n])\n([^\n])/g, "$1 $2")
                )}
              </Markdown>
            ) : (
              <Text>{artistInfo.name + " is an artist on Mirlo"}</Text>
            )}
          </View>
        )}
      ></FlatList>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
const itemWidth = (width - 100) / 2;

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 25,
    width: 50,
    height: 50,
  },
  introBanner: {
    flexDirection: "row",
    margin: 20,
    alignItems: "center",
  },
  loadSpinner: {
    flex: 1,
  },
  listContainer: {
    backgroundColor: "white",
    alignItems: "stretch",
    justifyContent: "flex-start",
    minHeight: "100%",
  },
  image: {
    width: "100%",
    backgroundColor: "#f0f0f0", // placeholder color while loading
  },
  albumItem: {
    width: itemWidth,
    marginBottom: 20,
    alignItems: "center",
  },
  albumTitle: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: "300",
    textAlign: "center",
  },
});
