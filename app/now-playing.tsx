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
import { useRouter } from "expo-router";
import TrackPlayer, { useProgress } from "react-native-track-player";
import Slider from "@react-native-community/slider";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import DismissModalBar from "@/components/DismissModalBar";
import MarqueeText from "@/components/MarqueeText";
import Text from "@/components/ThemedText";
import { formatTime } from "@/components/TrackItem";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { gutter, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

export default function NowPlaying() {
  const { activeTrack } = usePlayer();
  const progress = useProgress();
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const trackGroup = activeTrack?.trackGroup;
  const linkStyle = [type.small, { color: colors.accent }];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <DismissModalBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={{
            uri: trackGroup?.cover.sizes[1200] ?? trackGroup?.cover.sizes[600],
          }}
          style={{
            width: "100%",
            aspectRatio: 1,
            backgroundColor: colors.tint,
          }}
          resizeMode="cover"
        />
        <Slider
          style={styles.slider}
          value={progress.position}
          minimumValue={0}
          maximumValue={progress.duration}
          thumbTintColor="transparent"
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.tintX}
          onSlidingComplete={async (value) => await TrackPlayer.seekTo(value)}
          accessibilityLabel="Track progress"
        />
        <View style={styles.times}>
          <Text
            style={[type.xsmall, styles.time, { color: colors.secondaryText }]}
          >
            {formatTime(progress.position)}
          </Text>
          <Text
            style={[type.xsmall, styles.time, { color: colors.secondaryText }]}
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
              {t("trackGroupDetails.fromAlbum")
                .replace(/<[^>]*>.*?<\/[^>]*>/g, "")
                .trim() + " "}
            </Text>
            <Pressable
              accessibilityRole="link"
              android_ripple={{ color: colors.tintX }}
              style={({ pressed }) => [styles.link, pressed && styles.pressed]}
              onPress={() => {
                router.dismiss(1);
                router.navigate({
                  pathname: "/artist/[id]/album/[slug]/album-tracks",
                  params: {
                    id: String(trackGroup?.artistId),
                    slug: String(trackGroup?.urlSlug),
                  },
                });
              }}
            >
              <MarqueeText style={linkStyle}>{trackGroup?.title}</MarqueeText>
            </Pressable>
          </View>
          <View style={styles.meta}>
            <Text style={[type.small, { color: colors.secondaryText }]}>
              {t("trackGroupDetails.byArtist")
                .replace(/<[^>]*>.*?<\/[^>]*>/g, "")
                .trim() + " "}
            </Text>
            <Pressable
              accessibilityRole="link"
              android_ripple={{ color: colors.tintX }}
              style={({ pressed }) => [styles.link, pressed && styles.pressed]}
              onPress={() => {
                router.dismiss(1);
                router.navigate({
                  pathname: "/artist/[id]/artist-page",
                  params: { id: String(trackGroup?.artistId) },
                });
              }}
            >
              <MarqueeText style={linkStyle}>{activeTrack?.artist}</MarqueeText>
            </Pressable>
          </View>
        </View>
        <Player style={styles.controls} />
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
});
