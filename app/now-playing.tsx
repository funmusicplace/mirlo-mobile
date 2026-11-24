import { useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import { usePlayer } from "@/state/PlayerContext";
import Player from "@/components/Player";
import { type Href, useRouter } from "expo-router";
import TrackPlayer, { useProgress } from "react-native-track-player";
import Slider from "@react-native-community/slider";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import Button from "@/components/Button";
import DismissModalBar from "@/components/DismissModalBar";
import MarqueeText from "@/components/MarqueeText";
import PlayNextPrompt from "@/components/PlayNextPrompt";
import Text from "@/components/ThemedText";
import { formatTime } from "@/components/TrackItem";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { gutter, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";
import { coverSize, textAroundTag } from "@/scripts/utils";

export default function NowPlaying() {
  const { activeTrack } = usePlayer();
  const progress = useProgress();
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const trackGroup = activeTrack?.trackGroup;
  const linkStyle = [type.small, { color: colors.accent }];
  // A link needs every id its route names, else its text stays plain
  const albumHref: Href | undefined =
    trackGroup?.artistId && trackGroup.urlSlug
      ? {
          pathname: "/artist/[id]/album/[slug]/album-tracks",
          params: {
            id: trackGroup.artistId,
            slug: trackGroup.urlSlug,
            apiRoot: trackGroup.apiRoot,
          },
        }
      : undefined;
  const artistHref: Href | undefined = trackGroup?.artistId
    ? {
        pathname: "/artist/[id]/artist-page",
        params: { id: trackGroup.artistId, apiRoot: trackGroup.apiRoot },
      }
    : undefined;
  const metaLink = (text: string | undefined, href: Href | undefined) =>
    href ? (
      <Pressable
        accessibilityRole="link"
        // Else iOS joins MarqueeText's hidden copies into the label
        accessibilityLabel={text}
        android_ripple={{ color: colors.tintX }}
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        onPress={() => {
          router.dismiss(1);
          router.navigate(href);
        }}
      >
        <MarqueeText style={linkStyle}>{text}</MarqueeText>
      </Pressable>
    ) : (
      <View style={styles.link}>
        <MarqueeText style={type.small}>{text}</MarqueeText>
      </View>
    );
  // Measured so the cover leaves room for everything under it
  const [area, setArea] = useState<{ width: number; height: number }>();
  const [rest, setRest] = useState(0);
  const side = area && coverSize(area.width - 2 * gutter, area.height, rest);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <DismissModalBar />
      <ScrollView
        contentContainerStyle={styles.content}
        onLayout={(e) => setArea(e.nativeEvent.layout)}
      >
        <Image
          source={{
            uri:
              trackGroup?.cover?.sizes[1200] ?? trackGroup?.cover?.sizes[600],
          }}
          style={{
            width: side ?? "100%",
            aspectRatio: 1,
            alignSelf: "center",
            backgroundColor: colors.tint,
          }}
          resizeMode="cover"
        />
        <View
          style={styles.rest}
          onLayout={(e) => setRest(e.nativeEvent.layout.height)}
        >
          <Slider
            style={styles.slider}
            value={progress.position}
            minimumValue={0}
            maximumValue={progress.duration}
            thumbTintColor="transparent"
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.track}
            onSlidingComplete={async (value) => await TrackPlayer.seekTo(value)}
            accessibilityLabel={t("mobileApp.accessibility.trackProgress")}
            accessibilityValue={{
              text: t("mobileApp.accessibility.trackProgressValue", {
                elapsed: formatTime(progress.position),
                total: formatTime(progress.duration),
              }),
            }}
          />
          <View style={styles.times}>
            <Text
              style={[
                type.xsmall,
                styles.time,
                { color: colors.secondaryText },
              ]}
            >
              {formatTime(progress.position)}
            </Text>
            <Text
              style={[
                type.xsmall,
                styles.time,
                { color: colors.secondaryText },
              ]}
            >
              {formatTime(progress.duration)}
            </Text>
          </View>
          <View style={styles.details}>
            <MarqueeText style={type.title} accessibilityRole="header">
              {activeTrack?.title}
            </MarqueeText>
            <View style={styles.meta}>
              <Text style={[type.small, { color: colors.secondaryText }]}>
                {textAroundTag(t("trackGroupDetails.fromAlbum")) + " "}
              </Text>
              {metaLink(
                trackGroup?.title || t("playableCover.untitled"),
                albumHref,
              )}
            </View>
            <View style={styles.meta}>
              <Text style={[type.small, { color: colors.secondaryText }]}>
                {textAroundTag(t("trackGroupDetails.byArtist")) + " "}
              </Text>
              {metaLink(activeTrack?.artist, artistHref)}
            </View>
          </View>
          <Player style={styles.controls} />
          <PlayNextPrompt>
            {(open) => (
              <Button
                variant="outlined"
                rounded
                title={t("mobileApp.playNext.title")}
                accessibilityLabel={t("mobileApp.playNext.label")}
                accessibilityHint={t("mobileApp.playNext.hint")}
                endIcon={<Ionicons name="chevron-forward" />}
                onPress={open}
                style={styles.playNext}
              />
            )}
          </PlayNextPrompt>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: gutter,
  },
  rest: {
    paddingBottom: spacing.xl,
  },
  slider: {
    alignSelf: "stretch",
    marginTop: spacing.sm,
  },
  times: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  time: {
    fontVariant: ["tabular-nums"],
  },
  details: {
    marginTop: spacing.lg,
  },
  // Each link row is a full touch target, Android drops hit slop outside the parent
  meta: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: touchTarget,
  },
  link: {
    flexShrink: 1,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  // Android shows the ripple instead
  pressed: {
    opacity: Platform.OS === "android" ? 1 : 0.6,
  },
  controls: {
    marginTop: spacing.lg,
  },
  playNext: {
    alignSelf: "center",
    marginTop: spacing.lg,
  },
});
