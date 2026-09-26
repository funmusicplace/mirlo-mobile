import {
  View,
  Image,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { usePlayer } from "@/state/PlayerContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import Player from "@/components/Player";
import { Link, useRouter } from "expo-router";
import TrackPlayer, { useProgress } from "react-native-track-player";
import Slider from "@react-native-community/slider";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import DismissModalBar from "@/components/DismissModalBar";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";

export default function NowPlaying() {
  const { activeTrack, shuffled } = usePlayer() as {
    activeTrack: RNTrack | undefined;
    shuffled: boolean;
  };
  const progress = useProgress();
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const colors = useColors();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <DismissModalBar />
      <ScrollView style={{ width: width }}>
        <Image
          source={{ uri: activeTrack?.trackGroup.cover.sizes[600] }}
          style={[
            styles.image,
            { width: width, height: width < 380 ? width * 0.9 : width },
            { backgroundColor: colors.muted },
          ]}
          resizeMode={width < 380 ? "stretch" : "cover"}
        />
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: width,
          }}
        >
          <Slider
            style={styles.progressBar}
            value={progress.position}
            minimumValue={0}
            maximumValue={progress.duration}
            thumbTintColor="transparent"
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            onSlidingComplete={async (value) => await TrackPlayer.seekTo(value)}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: width,
              paddingHorizontal: 5,
            }}
          >
            <Text>{formatTime(progress.position)}</Text>
            <Text>{formatTime(progress.duration)}</Text>
          </View>
        </View>
        <View
          style={{
            alignSelf: "flex-start",
            margin: 20,
            gap: 10,
            maxWidth: width * 0.9,
          }}
        >
          <Text style={{ fontWeight: "bold" }}>{activeTrack?.title}</Text>
          <View
            style={{
              display: "flex",
            }}
          >
            <View style={{ flexDirection: "row" }}>
              <Text>
                {t("trackGroupDetails.fromAlbum")
                  .replace(/<[^>]*>.*?<\/[^>]*>/g, "")
                  .trim() + " "}
              </Text>
              <Link
                href={{
                  pathname: "/artist/[id]/album/[slug]/album-tracks",
                  params: {
                    id: String(activeTrack?.trackGroup.artistId),
                    slug: String(activeTrack?.trackGroup.urlSlug),
                  },
                }}
                asChild
              >
                <Pressable
                  style={{ flexShrink: 1 }}
                  onPress={() => {
                    router.dismiss(1);
                  }}
                >
                  <Text
                    style={[
                      styles.link,
                      { maxWidth: "100%", color: colors.accent },
                    ]}
                    ellipsizeMode="tail"
                    numberOfLines={1}
                  >
                    {activeTrack?.trackGroup.title}
                  </Text>
                </Pressable>
              </Link>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text>
                {t("trackGroupDetails.byArtist")
                  .replace(/<[^>]*>.*?<\/[^>]*>/g, "")
                  .trim() + " "}
              </Text>
              <Link
                href={{
                  pathname: "/artist/[id]/artist-page",
                  params: { id: String(activeTrack?.trackGroup.artistId) },
                }}
                asChild
              >
                <Pressable
                  style={{ flexShrink: 1 }}
                  onPress={() => {
                    router.dismiss(1);
                  }}
                >
                  <Text
                    style={[styles.link, { color: colors.accent }]}
                    ellipsizeMode="tail"
                    numberOfLines={1}
                  >
                    {activeTrack?.artist}
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
        <Player
          style={{
            width: width,
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Number(seconds.toFixed(0)) % 60;

  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedSeconds =
    remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

  return `${formattedMinutes}:${formattedSeconds}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  image: {
    alignSelf: "center",
  },
  loadSpinner: {
    flex: 1,
  },
  link: {
    fontWeight: "bold",
  },
  progressBar: {
    width: "100%",
  },
});
