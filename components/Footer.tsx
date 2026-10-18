import { useRef, useState } from "react";
import {
  GestureResponderEvent,
  Image,
  Platform,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
  ViewProps,
  useWindowDimensions,
} from "react-native";
import TrackPlayer, {
  PlaybackState,
  State,
  useProgress,
} from "react-native-track-player";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link, router, usePathname } from "expo-router";
import { usePlayer } from "@/state/PlayerContext";
import { useAuthContext } from "@/state/AuthContext";
import { useColors } from "@/constants/colors";
import { skipTrack } from "@/scripts/trackPlayUtils";
import { gutter, radius } from "@/constants/spacing";

const HIT_SIZE = 44;
const SEEK_STEP_SECONDS = 10;
const ART_MIN_WINDOW_WIDTH = 360;

const NAV_ITEMS = [
  {
    route: "/",
    icon: "home",
    label: "Recent Releases",
    hint: "Navigates to recent releases",
  },
  {
    route: "/collections",
    icon: "library",
    label: "Your Collection",
    hint: "Navigates to your collection page",
  },
  {
    route: "/wishlist",
    icon: "heart",
    label: "Your Wishlist",
    hint: "Navigates to your wishlist page",
  },
] as const;

export default function Footer({ style }: ViewProps) {
  const insets = useSafeAreaInsets();
  const { activeTrack } = usePlayer();
  const pathname = usePathname();
  // Now playing shows these controls full size
  const showPlayer = !!activeTrack && pathname !== "/now-playing";
  const { user } = useAuthContext();
  const { width } = useWindowDimensions();
  const colors = useColors();

  function navigate(route: (typeof NAV_ITEMS)[number]["route"]) {
    if (route === "/") {
      router.dismissTo("/");
    } else if (!user) {
      router.push({ pathname: "/emailVerificationModal" });
    } else if (pathname === "/") {
      router.navigate(route);
    } else if (pathname !== route) {
      router.dismissTo(route);
    }
  }

  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: colors.playerBackground,
          borderTopColor: colors.playerShadow,
          paddingBottom: insets.bottom,
        },
        style,
      ]}
    >
      {showPlayer && <ProgressBar />}
      <View style={styles.row}>
        <View style={styles.group}>
          {NAV_ITEMS.map(({ route, icon, label, hint }) => {
            const active = pathname === route;
            return (
              <FooterButton
                key={route}
                onPress={() => navigate(route)}
                accessibilityLabel={label}
                accessibilityHint={hint}
                accessibilityState={{ selected: active }}
              >
                <Ionicons
                  name={active ? icon : `${icon}-outline`}
                  size={26}
                  color={active ? colors.accent : colors.inactive}
                />
              </FooterButton>
            );
          })}
        </View>
        {showPlayer && activeTrack && (
          <View style={styles.group}>
            {width >= ART_MIN_WINDOW_WIDTH && activeTrack.artwork ? (
              <Link
                href={{
                  pathname: "/now-playing",
                  params: {
                    id: activeTrack.trackGroup.artistId,
                    slug: activeTrack.trackGroup.urlSlug,
                  },
                }}
                asChild
              >
                <FooterButton
                  // Link asChild injects role="link"
                  role="button"
                  accessibilityLabel="Now playing"
                >
                  <Image
                    source={{ uri: activeTrack.artwork }}
                    resizeMode="cover"
                    style={styles.art}
                  />
                </FooterButton>
              </Link>
            ) : null}
            <SkipButton direction="previous" />
            <FooterPlayButton />
            <SkipButton direction="next" />
          </View>
        )}
      </View>
    </View>
  );
}

function FooterButton(props: Omit<PressableProps, "style">) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{
        color: colors.border,
        borderless: true,
        radius: HIT_SIZE / 2,
      }}
      {...props}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    />
  );
}

function ProgressBar() {
  const { position, duration } = useProgress();
  const colors = useColors();
  const width = useRef(0);
  const originX = useRef(0);
  // releasedAt is the polled position when the finger lifted, null while dragging
  const [scrub, setScrub] = useState<{
    seconds: number;
    releasedAt: number | null;
  } | null>(null);

  // Hold the seek target until useProgress polls a new position
  if (scrub && scrub.releasedAt !== null && scrub.releasedAt !== position) {
    setScrub(null);
  }

  const shown = scrub ? scrub.seconds : position;
  const fraction = duration > 0 ? Math.min(shown / duration, 1) : 0;
  const max = Math.round(duration);

  // locationX shifts with the view under the finger, pageX does not
  const secondsAt = (e: GestureResponderEvent) =>
    Math.min(
      Math.max((e.nativeEvent.pageX - originX.current) / width.current, 0),
      1,
    ) * duration;

  function seek(seconds: number) {
    setScrub({ seconds, releasedAt: position });
    TrackPlayer.seekTo(seconds).catch((error) => {
      setScrub(null);
      console.error("issue seeking", error);
    });
  }

  return (
    <View
      style={styles.seekArea}
      onLayout={(e) => {
        width.current = e.nativeEvent.layout.width;
      }}
      onStartShouldSetResponder={() => duration > 0 && width.current > 0}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => {
        originX.current = e.nativeEvent.pageX - e.nativeEvent.locationX;
        setScrub({ seconds: secondsAt(e), releasedAt: null });
      }}
      onResponderMove={(e) =>
        setScrub({ seconds: secondsAt(e), releasedAt: null })
      }
      onResponderRelease={(e) => seek(secondsAt(e))}
      onResponderTerminate={() => setScrub(null)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Track progress"
      // A zero range reads as "NaN" in VoiceOver
      accessibilityValue={
        max > 0
          ? { min: 0, max, now: Math.round(fraction * duration) }
          : undefined
      }
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        if (duration <= 0) return;
        const step =
          e.nativeEvent.actionName === "increment"
            ? SEEK_STEP_SECONDS
            : -SEEK_STEP_SECONDS;
        seek(Math.min(Math.max(shown + step, 0), duration));
      }}
    >
      <View
        style={[
          styles.progress,
          { width: `${fraction * 100}%`, backgroundColor: colors.accent },
        ]}
      />
    </View>
  );
}

function SkipButton({ direction }: { direction: "previous" | "next" }) {
  const colors = useColors();
  const next = direction === "next";

  async function onPress() {
    try {
      await skipTrack(direction);
    } catch (error) {
      console.error(`issue skipping to the ${direction} track`, error);
    }
  }

  return (
    <FooterButton
      accessibilityLabel={next ? "Next track" : "Previous track"}
      onPress={onPress}
    >
      <MaterialIcons
        name={next ? "skip-next" : "skip-previous"}
        size={22}
        color={colors.accent}
      />
    </FooterButton>
  );
}

function FooterPlayButton() {
  const { playbackState, isPlaying } = usePlayer();
  const colors = useColors();
  const playing = playbackState.state === State.Buffering || isPlaying;

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
    <FooterButton
      accessibilityLabel={playing ? "Pause" : "Play"}
      onPress={() => onPress(playbackState)}
    >
      <View style={[styles.playCircle, { borderColor: colors.accent }]}>
        <Ionicons
          name={playing ? "pause-outline" : "play-outline"}
          size={18}
          color={colors.accent}
        />
      </View>
    </FooterButton>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: "100%",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  seekArea: {
    height: 24,
  },
  progress: {
    height: 6.4,
  },
  row: {
    minHeight: 56,
    paddingHorizontal: gutter,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  group: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    width: HIT_SIZE,
    height: HIT_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  // Android shows the ripple instead
  pressed: {
    opacity: Platform.OS === "android" ? 1 : 0.6,
  },
  art: {
    width: 40,
    height: 40,
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
