import { queryAlbum } from "@/queries/queries";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, useRouter } from "expo-router";
import PlayPauseWrapper from "@/components/PlayPauseWrapper";
import TrackPlayer, { State } from "react-native-track-player";
import { usePlayer } from "@/state/PlayerContext";
import { API_KEY } from "@/constants/api-key";
import { API_ROOT } from "@/constants/api-root";
import { audioTrackType, linkifyUrls, trackGroupUrl } from "@/scripts/utils";
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Trans, useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import Markdown from "react-native-markdown-display";
import ErrorNotification from "@/components/ErrorNotification";
import ShareButton from "@/components/ShareButton";
import Button from "@/components/Button";
import ScreenHeader, { BackButton } from "@/components/ScreenHeader";
import SearchButton from "@/components/SearchButton";
import MenuButton from "@/components/MenuButton";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { gutter, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

type DateTimeFormatOptions = Intl.DateTimeFormatOptions;

export default function TrackView() {
  const { slug, id, trackId } = useLocalSearchParams();

  const { data, isPending, isError, error } = useQuery(
    queryAlbum({ slug: slug, id: id }),
  );
  const router = useRouter();
  const { setPlayableTracks } = usePlayer();
  const [album, setAlbum] = useState<RNTrack[]>();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [showError, setShowError] = useState<boolean>(true);
  const colors = useColors();

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
      <View style={styles.screen}>
        <ActivityIndicator
          size="large"
          color={colors.accent}
          style={styles.screen}
        />
      </View>
    );
  }

  if (isError) {
    console.error(error);
    return (
      <View style={styles.screen}>
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

  const releaseDate = formatReleaseDate(data.result.releaseDate, t);
  const coverSize = width - 2 * gutter;
  const linkStyle = {
    color: colors.accent,
    textDecorationLine: "underline" as const,
  };
  const markdownStyles = {
    body: { ...type.body, color: colors.text },
    paragraph: { marginTop: 0, marginBottom: spacing.md },
    link: linkStyle,
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <ScreenHeader
        left={<BackButton />}
        right={
          <>
            <SearchButton />
            <MenuButton />
          </>
        }
      />
      <FlatList
        data={album}
        keyExtractor={(item, index) => `${index}-${item.id || item.title}`}
        renderItem={({ item }) => <PlayPauseWrapper trackObject={item} />}
        ListHeaderComponent={
          <View>
            <View style={styles.gutter}>
              <Text
                accessibilityRole="header"
                style={[type.title, styles.title]}
              >
                {filteredTrack?.title}
              </Text>
              <Text style={type.small}>
                <Trans
                  t={t}
                  i18nKey="trackGroupDetails.fromAlbum"
                  values={{ album: data.result.title }}
                  components={{
                    albumLink: (
                      <Link
                        href={{
                          pathname: "/artist/[id]/album/[slug]/album-tracks",
                          params: {
                            id: data.result.artistId,
                            slug: data.result.urlSlug,
                          },
                        }}
                        style={linkStyle}
                      />
                    ),
                  }}
                />
              </Text>
              <Text style={[type.small, styles.byline]}>
                <Trans
                  t={t}
                  i18nKey="trackGroupDetails.byArtist"
                  values={{ artist: data.result.artist.name }}
                  components={{
                    artistLink: (
                      <Link
                        href={{
                          pathname: "/artist/[id]/artist-page",
                          params: { id: data.result.artistId },
                        }}
                        style={linkStyle}
                      />
                    ),
                  }}
                />
              </Text>
              <Image
                source={{
                  uri:
                    data.result.cover?.sizes[1200] ??
                    data.result.cover?.sizes[600],
                }}
                style={{
                  width: coverSize,
                  height: coverSize,
                  backgroundColor: colors.tint,
                }}
                resizeMode="cover"
                alt={data.result.coverImageAlt || undefined}
              />
            </View>
            <View style={[styles.gutter, styles.underCover]}>
              <Text style={[type.caption, { color: colors.secondaryText }]}>
                {releaseDate}
              </Text>
              {filteredTrack && (
                <ShareButton
                  url={`${trackGroupUrl(data.result)}/tracks/${filteredTrack.id}`}
                />
              )}
            </View>
            <View style={styles.play}>
              <TrackPlayButton />
            </View>
          </View>
        }
        ListFooterComponent={
          data.result.about ? (
            <View style={styles.footer}>
              <Markdown style={markdownStyles}>
                {linkifyUrls(
                  data.result.about.replace(/([^\n])\n([^\n])/g, "$1 $2"),
                )}
              </Markdown>
            </View>
          ) : null
        }
      />
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
  const colors = useColors();
  const { t } = useTranslation();

  async function getQ() {
    const queue = (await TrackPlayer.getQueue()) as RNTrack[];
    setQ(queue);
  }

  // Starting playback swaps the queue without changing playableTracks
  useEffect(() => {
    getQ();
  }, [playableTracks, activeTrack]);

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

  const playing =
    playableTracks.length > 0 &&
    (isPlaying || playbackState.state === State.Buffering) &&
    activeTrack?.trackGroup?.urlSlug ===
      playableTracks[0].trackGroup?.urlSlug &&
    playableTracks.length === q?.length;

  return (
    <Button
      rounded
      title={
        playing
          ? t("clickToPlay.pause", "Pause")
          : t("playableCover.playTrack", "Play track")
      }
      startIcon={
        <Ionicons name={playing ? "pause-outline" : "play-outline"} size={16} />
      }
      onPress={() => togglePlayBack()}
      disabled={!playableTracks.length}
      style={[
        styles.playButton,
        {
          borderColor: playableTracks.length ? colors.button : colors.disabled,
        },
      ]}
    />
  );
}

function formatReleaseDate(utcDate: string | undefined, t: TFunction) {
  if (!utcDate) return undefined;
  const date = new Date(utcDate);
  const upcoming = date.getTime() > Date.now();

  // Account for timezone offset
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

  // The web leaves the year off upcoming releases
  const options: DateTimeFormatOptions = upcoming
    ? { month: "long", day: "numeric" }
    : { month: "long", day: "numeric", year: "numeric" };
  const result = localDate.toLocaleDateString("en-US", options);

  return t(
    upcoming
      ? "trackGroupDetails.futureRelease"
      : "trackGroupDetails.pastRelease",
    { date: result },
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  gutter: {
    paddingHorizontal: gutter,
  },
  title: {
    paddingTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  byline: {
    marginBottom: spacing.md,
  },
  // A full touch target tall, so Android keeps the share button's hit slop
  underCover: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: touchTarget,
    gap: spacing.sm,
  },
  // Padding keeps the button's hit slop inside the wrapper
  play: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: gutter + spacing.xl,
  },
  // Web ClickToPlayTracks: 70% wide with a 1 px border, 42 tall
  playButton: {
    width: "70%",
    borderWidth: 1,
  },
  footer: {
    paddingHorizontal: gutter + spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
