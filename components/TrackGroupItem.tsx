import { ReactNode } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { Href, router } from "expo-router";
import { useTranslation } from "react-i18next";
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
  apiRoot,
  width,
  href,
  showArtist = true,
  caption,
  actions,
}: AlbumProps & {
  width?: number;
  href?: Href;
  showArtist?: boolean;
  // Kind of item under the title
  caption?: string;
  // Controls under the card, outside the link so they stay separate for screen readers
  actions?: ReactNode;
}) {
  const colors = useColors();
  const isDark = useColorScheme() === "dark";
  const { t } = useTranslation("translation");
  const displayTitle = title || t("playableCover.untitled");
  return (
    <View style={[styles.card, { width }]}>
      <Pressable
        onPress={() =>
          router.navigate(
            href ?? {
              pathname: "/artist/[id]/album/[slug]/album-tracks",
              params: { id: artistId, slug: urlSlug, apiRoot },
            },
          )
        }
        accessibilityRole="link"
        accessibilityLabel={[displayTitle, showArtist && artist.name, caption]
          .filter(Boolean)
          .join(", ")}
        // Foreground so the ripple draws over the cover
        android_ripple={{ color: colors.tintX, foreground: true }}
        style={({ pressed }) => pressed && styles.pressed}
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
          {displayTitle}
        </Text>
        {caption ? (
          <Text
            style={[styles.meta, { color: colors.secondaryText }]}
            numberOfLines={1}
          >
            {caption}
          </Text>
        ) : null}
        {showArtist && (
          <Text
            style={[styles.meta, { color: colors.accent }]}
            numberOfLines={1}
          >
            {artist.name}
          </Text>
        )}
      </Pressable>
      {actions}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    // Controls sit at the bottom, level across a row of cards of different heights
    justifyContent: "space-between",
  },
  cover: {
    width: "100%",
    aspectRatio: 1,
  },
  title: {
    ...type.cardTitle,
    paddingTop: spacing.sm,
  },
  meta: {
    ...type.cardMeta,
    marginTop: spacing.xs,
  },
  // Android shows the ripple instead
  pressed: {
    opacity: Platform.OS === "android" ? 1 : 0.6,
  },
});
