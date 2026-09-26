import { queryAlbum, queryTrackGroups } from "@/queries/queries";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
  View,
  Pressable,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  useWindowDimensions} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, useRouter } from "expo-router";
import PlayPauseWrapper from "@/components/PlayPauseWrapper";
import TrackPlayer, { PlaybackState, State } from "react-native-track-player";
import { usePlayer } from "@/state/PlayerContext";
import { API_KEY } from "@/constants/api-key";
import { API_ROOT } from "@/constants/api-root";
import { audioTrackType } from "@/scripts/utils";
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import FavoriteTrackButton from "@/components/FavoriteTrackButton";
import ErrorNotification from "@/components/ErrorNotification";
import MarqueeText from "@/components/MarqueeText";

type DateTimeFormatOptions = Intl.DateTimeFormatOptions;

export default function TrackView() {
  const { slug, id, trackId } = useLocalSearchParams();

  const { data, isPending, isError, error } = useQuery(
    queryAlbum({ slug: slug, id: id }),
  );
  const router = useRouter();
  const { playableTracks, setPlayableTracks } = usePlayer();
  const [album, setAlbum] = useState<RNTrack[]>();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [showError, setShowError] = useState<boolean>(true);

  useFocusEffect(
    useCallback(() => {
      if (data) {
        const filteredTrack = data.result.tracks?.find(
          (track) => track.id === Number(trackId),
        );

        if (filteredTrack) {
          filteredTrack.trackGroup = {
            userTrackGroupPurchases: data.result.userTrackGroupPurchases,
            artistId: data.result.artistId,
            urlSlug: data.result.urlSlug,
            cover: data.result.cover,
            title: data.result.title,
            artist: data.result.artist,
            id: data.result.trackGroupId,
            releaseDate: data.result.releaseDate,
            trackGroupId: data.result.trackGroupId,
          };
          filteredTrack.artist = data.result.artist.name;
          filteredTrack.artwork = data.result.cover.sizes[600];
          filteredTrack.url = `${API_ROOT}${filteredTrack.audio.url}`;
          filteredTrack.queueIndex = 0; //Only displaying 1 track on this screen
          filteredTrack.trackGroupId = data.result.trackGroupId;
          filteredTrack.audio = {
            url: filteredTrack.audio.url,
            duration: filteredTrack.audio.duration,
          };
          filteredTrack.headers = {
            "mirlo-api-key": API_KEY,
          };
          filteredTrack.type = audioTrackType(filteredTrack.audio.url);

          setPlayableTracks([filteredTrack]);
          setAlbum([filteredTrack]);
        }
      }
    }, [data]),
  );

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

  const filteredTrack = data.result.tracks?.find(
    (track) => track.id === Number(trackId),
  );

  if (!filteredTrack) {
    router.dismissTo(`/artist/${id}/album/${slug}/album-tracks`);
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
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
      <View style={styles.container}>
        <FlatList
          style={{ width: "100%" }}
          contentContainerStyle={styles.listContainer}
          data={album}
          keyExtractor={(item, index) => `${index}-${item.id || item.title}`}
          renderItem={({ item }) =>
            data.result ? (
              <PlayPauseWrapper
                trackObject={item}
                onTrackScreen={true}
              ></PlayPauseWrapper>
            ) : null
          }
          ListHeaderComponent={() => (
            <View style={{ marginBottom: 10 }}>
              <Image
                source={{ uri: data.result?.cover?.sizes[600] }}
                style={[styles.image, { width: width }]}
                resizeMode="cover"
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginVertical: 10,
                }}
              >
                <View style={{ maxWidth: "65%" }}>
                  <Link
                    href={{
                      pathname: "/artist/[id]/album/[slug]/album-tracks",
                      params: {
                        id: data.result?.artistId,
                        slug: data.result?.urlSlug,
                      },
                    }}
                    asChild
                  >
                    <Pressable style={{ flexShrink: 1 }}>
                      <MarqueeText
                        style={{
                          color: "#BE3455",
                          marginBottom: 5,
                          fontWeight: "bold",
                        }}
                      >
                        {data.result?.title}
                      </MarqueeText>
                    </Pressable>
                  </Link>
                  <Text>
                    {t("profile.albumLink")
                      .replace(/<[^>]*>.*?<\/[^>]*>/g, "")
                      .trim() + " "}
                    <Link
                      href={{
                        pathname: "/artist/[id]/artist-page",
                        params: { id: data.result?.artistId },
                      }}
                      style={{ color: "#BE3455", fontWeight: "bold" }}
                    >
                      {data.result?.artist.name}
                    </Link>
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {filteredTrack && (
                    <FavoriteTrackButton track={filteredTrack} size={40} />
                  )}
                  <TrackPlayButton />
                </View>
              </View>
            </View>
          )}
          ListFooterComponent={() => (
            <View style={{ marginVertical: 10 }}>
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 20,
                  marginBottom: 15,
                }}
              >
                {t("trackGroupDetails.about")}
              </Text>
              <Text style={{ fontStyle: "italic", marginBottom: 20 }}>
                {formatUTCDate(data.result?.releaseDate)}
              </Text>
              <Text style={{ marginBottom: 20 }}>{data.result?.about}</Text>
            </View>
          )}
        ></FlatList>
      </View>
    </SafeAreaView>
  );
}

function TrackPlayButton() {
  const {
    isPlaying,
    playbackState,
    activeTrack,
    playableTracks,
    setActiveTrack,
    setShuffled,
  } = usePlayer();
  const [q, setQ] = useState<RNTrack[] | null>(null);

  async function getQ() {
    const queue = (await TrackPlayer.getQueue()) as RNTrack[];
    setQ(queue);
  }

  useEffect(() => {
    getQ();
  }, [playableTracks]);

  const togglePlayBack = async () =>
    // playBackState: PlaybackState | { state: undefined }
    {
      try {
        const queue = await TrackPlayer.getQueue();
        // Set queue if no queue currently set
        if (!queue) {
          console.log("no curr track: setting track");
          await TrackPlayer.setQueue(playableTracks);
          const current = (await TrackPlayer.getActiveTrack()) as RNTrack;
          setActiveTrack(current);
          await TrackPlayer.play();
          return;
        }

        const currentTrack = await TrackPlayer.getActiveTrack();

        const isSameAlbum =
          currentTrack?.trackGroup.urlSlug ===
            playableTracks[0].trackGroup.urlSlug &&
          playableTracks.length === queue.length
            ? true
            : false;

        // Song Change to different album
        if (!isSameAlbum) {
          try {
            setShuffled(false);
            await TrackPlayer.setQueue(playableTracks);
            const current = (await TrackPlayer.getActiveTrack()) as RNTrack;
            setActiveTrack(current);
            await TrackPlayer.play();
            return;
          } catch (err) {
            console.error("issue changing albums", err);
            return;
          }
        }

        if (
          playbackState.state === State.Paused ||
          playbackState.state === State.Ready
        ) {
          await TrackPlayer.play();
          return;
        } else if (
          playbackState.state === State.Playing ||
          playbackState.state === State.Buffering
        ) {
          await TrackPlayer.pause();
          return;
        } else {
          console.error(`playback state: ${playbackState.state} not expected`);
        }
      } catch (err) {
        console.error("issue with playback", err);
      }
    };

  return (
    <TouchableOpacity
      onPress={() => togglePlayBack()}
      disabled={playableTracks.length ? false : true}
    >
      <Ionicons
        name={
          playableTracks.length
            ? (isPlaying || playbackState.state === State.Buffering) &&
              activeTrack?.trackGroup?.urlSlug ===
                playableTracks[0].trackGroup?.urlSlug &&
              playableTracks.length === q?.length
              ? "pause-circle-outline"
              : "play-circle-outline"
            : "play-circle-outline"
        }
        size={70}
        style={{ marginHorizontal: 5 }}
        color={playableTracks.length ? "black" : "lightgrey"}
      />
    </TouchableOpacity>
  );
}

function formatUTCDate(utcDate: string | undefined) {
  const { t } = useTranslation();
  if (!utcDate) return undefined;
  const date = new Date(utcDate);

  // Account for timezone offset
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

  const options: DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  const result = localDate.toLocaleDateString("en-US", options);

  return date.getTime() > Date.now()
    ? `${t("trackGroupCard.releaseDate").trim()} ${result}`
    : t("trackGroupCard.released").substring(
        0,
        t("trackGroupCard.released").indexOf(":") + 1,
      ) + ` ${result}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "flex-start",
    justifyContent: "space-evenly",
  },
  listContainer: {
    backgroundColor: "white",
    paddingHorizontal: "5%",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    justifyContent: "space-between",
    marginVertical: 5,
  },
  listHeader: {
    alignContent: "center",
  },
  text: {
    padding: 10,
    fontWeight: "bold",
  },
  image: {
    height: 380,
    backgroundColor: "#f0f0f0", // placeholder color while loading
    alignSelf: "center",
  },
  loadSpinner: {
    flex: 1,
  },
});
