import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  Modal} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useLocalSearchParams,
  useRouter,
  Link,
  useFocusEffect,
} from "expo-router";
import { usePlayer } from "@/state/PlayerContext";
import {
  handleExternalPurchase,
  isTrackOwnedOrPreview,
  toRNTrack,
} from "@/scripts/utils";
import { useAuthContext } from "@/state/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { queryAlbum } from "@/queries/queries";
import React, { useCallback, useState } from "react";
import TrackPlayer, { State } from "react-native-track-player";
import Ionicons from "@expo/vector-icons/Ionicons";
import PlayPauseWrapper from "@/components/PlayPauseWrapper";
import { useTranslation } from "react-i18next";
import Markdown from "react-native-markdown-display";
import { linkifyUrls } from "@/scripts/utils";
import WishlistButton from "@/components/WishlistButton";
import ErrorNotification from "@/components/ErrorNotification";
import AddAlbumButton from "@/components/AddAlbumButton";
import { mirloRed } from "@/constants/mirlo-red";

type DateTimeFormatOptions = Intl.DateTimeFormatOptions;

function AlbumPlayButton() {
  const {
    playbackState,
    isPlaying,
    activeTrack,
    playableTracks,
    setActiveTrack,
    setShuffled,
  } = usePlayer();

  const togglePlayBack = useCallback(async () => {
    try {
      const queue = await TrackPlayer.getQueue();

      // Set queue if no queue currently set or if the queue is empty
      if (!queue || queue.length === 0) {
        await TrackPlayer.setQueue(playableTracks);
        const current = (await TrackPlayer.getActiveTrack()) as RNTrack;
        setActiveTrack(current);
        await TrackPlayer.play();
        return;
      }

      const currentTrack = await TrackPlayer.getActiveTrack();

      // Check if the current album in the player is the same as the album for playableTracks
      const isSameAlbum =
        currentTrack?.trackGroup?.urlSlug ===
          playableTracks[0]?.trackGroup?.urlSlug &&
        playableTracks.length === queue.length; // More robust check

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

      // If it's the same album, toggle play/pause
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
  }, [isPlaying, playableTracks, setActiveTrack]);

  return (
    <TouchableOpacity
      onPress={togglePlayBack}
      disabled={playableTracks.length ? false : true}
    >
      <Ionicons
        name={
          playableTracks.length
            ? (isPlaying || playbackState.state == State.Buffering) &&
              activeTrack?.trackGroup?.urlSlug ===
                playableTracks[0].trackGroup?.urlSlug // && playableTracks.length === q?.length
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

const MemoizedAlbumPlayButton = React.memo(AlbumPlayButton);

function formatUTCDate(utcDate: string | undefined) {
  const { t } = useTranslation("translation");
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
    ? `${t("trackGroupCard.releaseDate")} ${result}`
    : t("trackGroupCard.released").substring(
        0,
        t("trackGroupCard.released").indexOf(":") + 1,
      ) + ` ${result}`;
}

export default function AlbumTracks() {
  const { id, slug } = useLocalSearchParams();
  const { isPending, isError, data, error } = useQuery(
    queryAlbum({ slug: slug, id: id }),
  );
  const router = useRouter();
  const { setPlayableTracks } = usePlayer();
  const { user } = useAuthContext();
  const [album, setAlbum] = useState<RNTrack[]>();
  const { t } = useTranslation("translation");
  const { width } = useWindowDimensions();
  const [showError, setShowError] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      const tracksToPlay: RNTrack[] = [];
      const allTracks: RNTrack[] = [];
      let playableIndex = 0;

      if (data && data.result.tracks) {
        data.result.tracks.forEach((track) => {
          const newTrack: RNTrack = toRNTrack(track, data.result);

          allTracks.push(newTrack);

          if (isTrackOwnedOrPreview(newTrack, user, data.result)) {
            newTrack.queueIndex = playableIndex;
            playableIndex++;
            tracksToPlay.push(newTrack);
          }
        });
      }
      setAlbum(allTracks);
      setPlayableTracks(tracksToPlay);
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

  const selectedAlbum = data.result;

  const tagPills = selectedAlbum.tags?.map((tagName, index) => {
    return (
      <Link
        key={index}
        href={{
          pathname: "/tags/[tag]",
          params: { tag: tagName },
        }}
        style={{
          backgroundColor: "#f0f0f0",
          borderWidth: 1,
          borderColor: "#e3e1e1",
          padding: 10,
          paddingHorizontal: 15,
          borderRadius: 18,
          marginRight: 10,
          marginVertical: 5,
        }}
      >
        {tagName}
      </Link>
    );
  });

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
            selectedAlbum ? (
              <PlayPauseWrapper
                trackObject={item}
                selectedAlbum={selectedAlbum}
                onTrackScreen={false}
              ></PlayPauseWrapper>
            ) : null
          }
          ListHeaderComponent={() => (
            <View style={{ marginBottom: 10 }}>
              <Image
                source={{ uri: selectedAlbum?.cover?.sizes[600] }}
                style={[
                  styles.image,
                  { width: width, height: width < 380 ? width * 0.9 : width },
                ]}
                resizeMode={width < 380 ? "stretch" : "cover"}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginVertical: 10,
                }}
              >
                <View style={{ maxWidth: "55%", marginRight: 10 }}>
                  <Text
                    style={{
                      color: "black",
                      marginBottom: 5,
                      fontWeight: "bold",
                    }}
                    ellipsizeMode="tail"
                    numberOfLines={1}
                  >
                    {selectedAlbum?.title}
                  </Text>
                  <Text>
                    {/* const result = str.replace(/<[^>]*>/g, '').trim(); */}
                    {t("trackGroupDetails.byArtist")
                      .replace(/<[^>]*>.*?<\/[^>]*>/g, "")
                      .trim() + " "}
                    <Link
                      href={{
                        pathname: "/artist/[id]/artist-page",
                        params: { id: selectedAlbum?.artistId },
                      }}
                      style={{ color: "#BE3455", fontWeight: "bold" }}
                    >
                      {selectedAlbum?.artist.name}
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
                  <AddAlbumButton
                    trackGroup={selectedAlbum}
                    size={40}
                    setModalVisible={setModalVisible}
                  />
                  <WishlistButton
                    trackGroup={selectedAlbum}
                    size={40}
                    style={{ marginLeft: 10 }}
                  />
                  <MemoizedAlbumPlayButton />
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
                {formatUTCDate(selectedAlbum?.releaseDate)}
              </Text>

              {selectedAlbum?.about ? (
                <View style={{ marginBottom: 20 }}>
                  <Markdown>
                    {linkifyUrls(
                      selectedAlbum.about.replace(/([^\n])\n([^\n])/g, "$1 $2"),
                    )}
                  </Markdown>
                </View>
              ) : null}

              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {selectedAlbum.tags && tagPills}
              </View>
            </View>
          )}
        ></FlatList>
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="none"
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <View style={styles.modalView}>
              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: mirloRed,
                  padding: 10,
                  borderRadius: 10,
                }}
                onPress={() => handleExternalPurchase(selectedAlbum)}
              >
                <Text style={{ color: "white", fontSize: 18 }}>
                  Purchase Info{" "}
                </Text>
                <Ionicons name="open-outline" color="white" size={18} />
              </Pressable>
              <Pressable
                style={{ marginTop: 30 }}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Text style={{ color: "#666", fontSize: 16 }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
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
    gap: 3,
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
    marginBottom: 10,
    backgroundColor: "#f0f0f0", // placeholder color while loading
    alignSelf: "center",
  },
  loadSpinner: {
    flex: 1,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    paddingBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
