import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ViewProps,
  Text,
  useWindowDimensions,
  Platform,
} from "react-native";
import Slider from "@react-native-community/slider";
import TrackPlayer, {
  PlaybackState,
  State,
  useProgress,
} from "react-native-track-player";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePlayer } from "@/state/PlayerContext";
import { Pressable } from "react-native";
import { Link, router, usePathname } from "expo-router";
import { isTrackOwned } from "@/scripts/utils";
import { useAuthContext } from "@/state/AuthContext";
import { useColors } from "@/constants/colors";

export default function Footer({ style }: ViewProps) {
  const progress = useProgress();
  const { bottom } = useSafeAreaInsets();
  const { playableTracks, activeTrack } = usePlayer() as {
    activeTrack: RNTrack | undefined;
    playableTracks: RNTrack[];
  };
  const pathname = usePathname();
  const { user } = useAuthContext();
  const { width, height } = useWindowDimensions();
  const size = width < 380 ? 30 : 40;
  const colors = useColors();
  return (
    <View
      style={[
        styles.footer,
        { backgroundColor: colors.background },
        { paddingBottom: bottom, height: 80 + bottom, position: "relative" },
        style,
      ]}
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
          width: "100%",
          height: "100%",
          // On Android, the bottom safe-area inset can be unexpectedly large
          // on some skins/emulators, which used to leave empty white space
          // between centered icons and the gesture bar. Anchoring the icon
          // rows to the bottom of the content area keeps them flush above
          // the gesture bar regardless of inset size. iOS keeps top anchoring
          // because its layout is hand-tuned with the negative marginTop
          // below.
          alignItems: Platform.OS === "ios" ? "flex-start" : "flex-end",
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            // On Android we want the icon row to size to its content so it
            // can sit at the bottom of the parent (alignItems:flex-end above).
            // On iOS, full-height + negative marginTop is the original layout.
            height: Platform.OS === "ios" ? "100%" : undefined,
            alignItems: "center",
            marginLeft: 20,
            // Hand-calibrated lift for iOS home-indicator geometry; on Android
            // we already anchor to the bottom via the parent's alignItems, so
            // no lift is needed.
            marginTop: Platform.OS === "ios" ? -20 : 0,
          }}
        >
          <Pressable
            onPress={() => {
              router.dismissTo("/");
            }}
            style={{ justifyContent: "center", alignItems: "center" }}
          >
            <Ionicons
              name={pathname === "/" ? "home" : "home-outline"}
              accessibilityLabel="Recent Releases"
              accessibilityRole="button"
              accessibilityHint="Navigates to recent releases"
              size={size}
              color={pathname === "/" ? colors.accent : colors.inactive}
            ></Ionicons>
          </Pressable>

          <Pressable
            onPress={() => {
              if (!user) {
                router.push({
                  pathname: "/emailVerificationModal",
                });
              } else {
                if (pathname === "/") {
                  router.navigate("/collections");
                } else if (pathname === "/collections") {
                  return;
                } else {
                  router.dismissTo("/collections");
                }
              }
            }}
            accessibilityLabel="Your Collection"
            accessibilityRole="button"
            accessibilityHint="Navigates to your collection page"
            style={{
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 10,
            }}
          >
            <Ionicons
              //name="heart-outline"
              name={pathname === "/collections" ? "library" : "library-outline"}
              size={size}
              color={
                pathname === "/collections" ? colors.accent : colors.inactive
              }
              style={{ marginHorizontal: 15 }}
            ></Ionicons>
          </Pressable>

          <Pressable
            onPress={() => {
              if (!user) {
                router.push({
                  pathname: "/emailVerificationModal",
                });
              } else {
                if (pathname === "/") {
                  router.navigate("/wishlist");
                } else if (pathname === "/wishlist") {
                  return;
                } else {
                  router.dismissTo("/wishlist");
                }
              }
            }}
            accessibilityLabel="Your Wishlist"
            accessibilityRole="button"
            accessibilityHint="Navigates to your wishlist page"
            style={{
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 10,
            }}
          >
            <Ionicons
              //name="heart-outline"
              name={pathname === "/wishlist" ? "heart" : "heart-outline"}
              size={size}
              color={pathname === "/wishlist" ? colors.accent : colors.inactive}
            ></Ionicons>
          </Pressable>
        </View>
        <View
          style={{
            flexDirection: "row",
            // Match the left icons' Android sizing: auto-height so the row
            // can sit at flex-end of the parent.
            height: Platform.OS === "ios" ? "100%" : undefined,
            alignItems: "center",
            marginTop: Platform.OS === "ios" ? -20 : 0,
          }}
        >
          {activeTrack && <FooterPlayButton />}
          <Link
            href={{
              pathname: "/now-playing",
              params: {
                id: activeTrack?.trackGroup.artistId,
                slug: activeTrack?.trackGroup.urlSlug,
              },
            }}
            disabled={activeTrack ? false : true}
          >
          {activeTrack && activeTrack.artwork ?
<Image
              source={
                  { uri: activeTrack.artwork }
              }
              style={styles.image}
            /> : null}
          </Link>
        </View>
      </View>
    </View>
  );
}

function FooterPlayButton() {
  const { playbackState, isPlaying } = usePlayer();
  const colors = useColors();
  const playIcon = <Ionicons name="play" size={40} />;
  const pauseIcon = <Ionicons name="pause" size={40} />;

  async function onPress(playbackState: PlaybackState | { state: undefined }) {
    try {
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
    } catch (error) {
      console.error("issue with player toggle playback botton", error);
    }
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => onPress(playbackState)}
    >
      <Ionicons
        name={
          playbackState.state === State.Buffering || isPlaying
            ? "pause-outline"
            : "play"
        }
        size={40}
        color={colors.text}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: "100%",
    // borderWidth: 1,
    // borderColor: "black",
  },
  progressBar: {
    alignSelf: "stretch",
    marginLeft: -16,
    marginRight: -20,
    padding: 0,
    marginTop: -21,
  },
  image: {
    width: 80,
    height: "100%",
    //marginTop: -20,
  },
  button: {
    // borderWidth: 1,
    // borderColor: "black",
    //marginTop: -20,
    height: "100%",
    justifyContent: "center",
    marginRight: 10,
  },
});
