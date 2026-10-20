import {
  View,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, Link, useFocusEffect } from "expo-router";
import { usePlayer } from "@/state/PlayerContext";
import {
  handleExternalPurchase,
  isTrackOwnedOrPreview,
  toRNTrack,
  trackGroupUrl,
} from "@/scripts/utils";
import { useAuthContext } from "@/state/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { queryAlbum } from "@/queries/queries";
import React, { useCallback, useState } from "react";
import TrackPlayer, { State } from "react-native-track-player";
import Ionicons from "@expo/vector-icons/Ionicons";
import PlayPauseWrapper from "@/components/PlayPauseWrapper";
import { Trans, useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import Markdown from "react-native-markdown-display";
import { linkifyUrls } from "@/scripts/utils";
import WishlistButton from "@/components/WishlistButton";
import ErrorNotification from "@/components/ErrorNotification";
import AddAlbumButton from "@/components/AddAlbumButton";
import ShareButton from "@/components/ShareButton";
import Button from "@/components/Button";
import ScreenHeader, { BackButton } from "@/components/ScreenHeader";
import SearchButton from "@/components/SearchButton";
import MenuButton from "@/components/MenuButton";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { gutter, radius, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";
import TagPill, { TagPillList } from "@/components/TagPill";

type DateTimeFormatOptions = Intl.DateTimeFormatOptions;

// API fields the global types don't declare
type LabelProfile = { id: number; name: string; urlSlug?: string };
type ArtistLabelLink = {
  labelUserId: number;
  labelUser?: { profiles?: LabelProfile[] };
};

// Same lookup as the web ArtistByLine: the label the release pays out to
function findLabel(album: AlbumProps & { paymentToUserId?: number }) {
  if (!album.paymentToUserId) return undefined;
  const links = album.artist.artistLabels as ArtistLabelLink[] | undefined;
  return links?.find((link) => link.labelUserId === album.paymentToUserId)
    ?.labelUser?.profiles?.[0];
}

function AlbumPlayButton() {
  const {
    playbackState,
    isPlaying,
    activeTrack,
    playableTracks,
    setActiveTrack,
    setShuffled,
  } = usePlayer();
  const colors = useColors();
  const { t } = useTranslation("translation");

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
  }, [isPlaying, playableTracks, setActiveTrack, playbackState, setShuffled]);

  const playing =
    playableTracks.length > 0 &&
    (isPlaying || playbackState.state === State.Buffering) &&
    activeTrack?.trackGroup?.urlSlug === playableTracks[0].trackGroup?.urlSlug;

  return (
    <Button
      rounded
      title={
        playing
          ? t("clickToPlay.pause", "Pause")
          : t("playableCover.playAlbum", "Play album")
      }
      startIcon={
        <Ionicons name={playing ? "pause-outline" : "play-outline"} size={16} />
      }
      onPress={togglePlayBack}
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

const MemoizedAlbumPlayButton = React.memo(AlbumPlayButton);

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

export default function AlbumTracks() {
  const { id, slug } = useLocalSearchParams();
  const { isPending, isError, data, error } = useQuery(
    queryAlbum({ slug: slug, id: id }),
  );
  const { setPlayableTracks } = usePlayer();
  const { user } = useAuthContext();
  const [album, setAlbum] = useState<RNTrack[]>();
  const { t } = useTranslation("translation");
  const { width } = useWindowDimensions();
  const [showError, setShowError] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const colors = useColors();

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

  const selectedAlbum = data.result;
  const label = findLabel(selectedAlbum);
  const releaseDate = formatReleaseDate(selectedAlbum.releaseDate, t);
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

  // Web credits: 14 on a 20.8 line inside a 0.9 opacity wrapper
  const creditsStyles = {
    ...markdownStyles,
    body: { ...type.small, lineHeight: 20.8, color: colors.text },
  };

  const tagPills = selectedAlbum.tags?.map((tagName, index) => (
    <TagPill key={index} tagName={tagName} />
  ));

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
        renderItem={({ item }) => (
          <PlayPauseWrapper trackObject={item} selectedAlbum={selectedAlbum} />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.gutter}>
              <Text
                accessibilityRole="header"
                style={[type.title, styles.title]}
              >
                {selectedAlbum.title}
              </Text>
              <Text style={[type.small, styles.byline]}>
                <Trans
                  t={t}
                  i18nKey="trackGroupDetails.byArtist"
                  values={{ artist: selectedAlbum.artist.name }}
                  components={{
                    artistLink: (
                      <Link
                        href={{
                          pathname: "/artist/[id]/artist-page",
                          params: { id: selectedAlbum.artistId },
                        }}
                        style={linkStyle}
                      />
                    ),
                  }}
                />
                {label ? (
                  <>
                    {" · "}
                    <Trans
                      t={t}
                      i18nKey="trackGroupDetails.onLabel"
                      defaults="on <labelLink>{{label}}</labelLink>"
                      values={{ label: label.name }}
                      components={{
                        labelLink: (
                          <Link
                            href={{
                              pathname: "/artist/[id]/artist-page",
                              params: { id: label.urlSlug ?? label.id },
                            }}
                            style={linkStyle}
                          />
                        ),
                      }}
                    />
                  </>
                ) : null}
              </Text>
              <Image
                source={{
                  uri:
                    selectedAlbum.cover?.sizes[1200] ??
                    selectedAlbum.cover?.sizes[600],
                }}
                style={{
                  width: coverSize,
                  height: coverSize,
                  backgroundColor: colors.tint,
                }}
                resizeMode="cover"
                alt={selectedAlbum.coverImageAlt || undefined}
              />
              {selectedAlbum.coverCredit ? (
                <Text style={styles.coverCredit}>
                  {t("trackGroupDetails.coverCredit", {
                    credit: selectedAlbum.coverCredit,
                    defaultValue: "Cover art: {{credit}}",
                  })}
                </Text>
              ) : null}
            </View>
            <View style={[styles.gutter, styles.actions]}>
              <ShareButton url={trackGroupUrl(selectedAlbum)} />
              <WishlistButton trackGroup={selectedAlbum} />
              <AddAlbumButton
                trackGroup={selectedAlbum}
                setModalVisible={setModalVisible}
              />
            </View>
            <View style={styles.play}>
              <MemoizedAlbumPlayButton />
            </View>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {selectedAlbum.about ? (
              <Markdown style={markdownStyles}>
                {linkifyUrls(
                  selectedAlbum.about.replace(/([^\n])\n([^\n])/g, "$1 $2"),
                )}
              </Markdown>
            ) : null}
            {releaseDate ? (
              <Text style={[type.caption, { color: colors.secondaryText }]}>
                {releaseDate}
              </Text>
            ) : null}
            {selectedAlbum.credits ? (
              <View style={styles.credits}>
                <Markdown style={creditsStyles}>
                  {selectedAlbum.credits}
                </Markdown>
              </View>
            ) : null}
            {tagPills?.length ? <TagPillList>{tagPills}</TagPillList> : null}
          </View>
        }
      />
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.scrim }]}>
          <View
            style={[styles.modalCard, { backgroundColor: colors.background }]}
          >
            <Button
              title="Purchase Info"
              endIcon={<Ionicons name="open-outline" />}
              onPress={() => handleExternalPurchase(selectedAlbum)}
            />
            <Button
              variant="outlined"
              title="Close"
              onPress={() => setModalVisible(!modalVisible)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  // A full touch target tall, so Android keeps the 30 pt buttons' hit slop
  actions: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: touchTarget,
    gap: spacing.lg,
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
  // Web caption: 12 on a 16 line at 0.75 opacity, 4 below the cover
  coverCredit: {
    ...type.xsmall,
    opacity: 0.75,
    marginTop: spacing.xs,
  },
  credits: {
    opacity: 0.9,
    marginTop: spacing.md,
  },
  footer: {
    paddingHorizontal: gutter + spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    margin: spacing.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    borderRadius: radius.md,
  },
});
