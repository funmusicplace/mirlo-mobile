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
  deletedAt,
  width,
  href,
  showArtist = true,
  caption,
  actions,
  inModal,
}: AlbumProps & {
  width?: number;
  href?: Href;
  showArtist?: boolean;
  // Kind of item under the title
  caption?: string;
  // Controls under the card, outside the link so they stay separate for screen readers
  actions?: ReactNode;
  // Closes the modal before opening the release, as now playing does
  inModal?: boolean;
}) {
  const colors = useColors();
  const isDark = useColorScheme() === "dark";
  const { t } = useTranslation("translation");
  const displayTitle = title || t("playableCover.untitled");
  // Like the website, a deleted release is plain text with no link or controls
  const deleted = !!deletedAt;
  const kind = deleted ? t("playableCover.deletedByArtist") : caption;
  const label = [displayTitle, showArtist && artist.name, kind]
    .filter(Boolean)
    .join(", ");
  const details = (
    <>
      {deleted ? (
        <View style={[styles.cover, { backgroundColor: colors.tint }]} />
      ) : (
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
      )}
      <Text
        style={[styles.title, deleted && { color: colors.secondaryText }]}
        numberOfLines={1}
      >
        {displayTitle}
      </Text>
      {kind ? (
        <Text
          style={[styles.meta, { color: colors.secondaryText }]}
          // The deleted text is the only reason the card does nothing
          numberOfLines={deleted ? undefined : 1}
        >
          {kind}
        </Text>
      ) : null}
      {showArtist && (
        <Text
          style={[
            styles.meta,
            { color: deleted ? colors.secondaryText : colors.accent },
          ]}
          numberOfLines={1}
        >
          {artist.name}
        </Text>
      )}
    </>
  );
  return (
    <View style={[styles.card, { width }]}>
      {deleted ? (
        <View accessible accessibilityLabel={label}>
          {details}
        </View>
      ) : (
        <Pressable
          onPress={() => {
            if (inModal) router.dismiss();
            router.navigate(
              href ?? {
                pathname: "/artist/[id]/album/[slug]/album-tracks",
                params: { id: artistId, slug: urlSlug, apiRoot },
              },
            );
          }}
          accessibilityRole="link"
          accessibilityLabel={label}
          // Foreground so the ripple draws over the cover
          android_ripple={{ color: colors.tintX, foreground: true }}
          style={({ pressed }) => pressed && styles.pressed}
        >
          {details}
        </Pressable>
      )}
      {deleted ? null : actions}
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
    // A bundled image's pixel height would beat the aspect ratio
    height: "auto",
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
