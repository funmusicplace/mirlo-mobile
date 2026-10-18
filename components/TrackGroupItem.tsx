import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { Href, router } from "expo-router";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { gutter, spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";

const logoLight = require("@/assets/images/mirlo-logo-logoOnly-light.png");
const logoDark = require("@/assets/images/mirlo-logo-logoOnly-dark.png");

// Two columns, the web's 3% gap rounds to spacing.md
export function useGridColumnWidth() {
  const { width } = useWindowDimensions();
  return (width - 2 * gutter - spacing.md) / 2;
}

export default function TrackGroupItem({
  cover,
  title,
  artist,
  artistId,
  urlSlug,
  width,
  href,
  showArtist = true,
}: AlbumProps & { width?: number; href?: Href; showArtist?: boolean }) {
  const colors = useColors();
  const isDark = useColorScheme() === "dark";
  return (
    <Pressable
      onPress={() =>
        router.navigate(
          href ?? {
            pathname: "/artist/[id]/album/[slug]/album-tracks",
            params: { id: artistId, slug: urlSlug },
          },
        )
      }
      accessibilityRole="link"
      accessibilityLabel={showArtist ? `${title}, ${artist.name}` : title}
      // Foreground so the ripple draws over the cover
      android_ripple={{ color: colors.tintX, foreground: true }}
      style={({ pressed }) => [
        styles.card,
        { width },
        pressed && styles.pressed,
      ]}
    >
      <Image
        source={
          cover?.sizes
            ? { uri: cover.sizes[600] }
            : isDark
              ? logoDark
              : logoLight
        }
        style={[styles.cover, { backgroundColor: colors.tint }]}
      />
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {showArtist && (
        <Text
          style={[styles.artist, { color: colors.accent }]}
          numberOfLines={1}
        >
          {artist.name}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  cover: {
    width: "100%",
    aspectRatio: 1,
  },
  title: {
    ...type.cardTitle,
    paddingTop: spacing.sm,
  },
  artist: {
    ...type.cardMeta,
    marginTop: spacing.xs,
  },
  // Android shows the ripple instead
  pressed: {
    opacity: Platform.OS === "android" ? 1 : 0.6,
  },
});
