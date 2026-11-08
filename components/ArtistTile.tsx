import { chunk } from "lodash";
import { Image, Platform, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";

// Web min-h-10 for the name block under the image
const NAME_MIN_HEIGHT = 40;
// Web ArtistFallbackComposite
const COVER_GAP = 2;

// Web ArtistSquare: the avatar, else the background, else up to four covers
export default function ArtistTile({
  artist,
  width,
  apiRoot,
}: {
  artist: Artist;
  width: number;
  apiRoot?: string;
}) {
  const colors = useColors();
  const uri = artist.avatar?.sizes?.[300] ?? artist.background?.sizes?.[625];
  const covers = (artist.trackGroups ?? [])
    .slice(0, 4)
    .map((trackGroup) => trackGroup.cover?.sizes?.[300])
    .filter((cover): cover is string => !!cover);
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/artist/[id]/artist-page",
          params: { id: artist.urlSlug ?? artist.id, apiRoot },
        })
      }
      accessibilityRole="link"
      accessibilityLabel={artist.name}
      // Foreground so the ripple draws over the image
      android_ripple={{ color: colors.tintX, foreground: true }}
      style={({ pressed }) => [
        styles.tile,
        { width },
        pressed && styles.pressed,
      ]}
    >
      {uri ? (
        <Image
          aria-hidden
          source={{ uri }}
          resizeMode="contain"
          style={[styles.square, { backgroundColor: colors.tint }]}
        />
      ) : (
        // One cover fills the square, two sit side by side, three or four make two rows
        <View
          aria-hidden
          style={[
            styles.square,
            styles.covers,
            { backgroundColor: colors.tint },
          ]}
        >
          {chunk(covers, 2).map((row) => (
            <View key={row[0]} style={styles.coverRow}>
              {row.map((cover) => (
                <Image
                  key={cover}
                  source={{ uri: cover }}
                  resizeMode="cover"
                  style={styles.cover}
                />
              ))}
              {covers.length === 3 && row.length === 1 ? (
                <View style={styles.cover} />
              ) : null}
            </View>
          ))}
        </View>
      )}
      <Text numberOfLines={1} style={[styles.name, { color: colors.accent }]}>
        {artist.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    marginBottom: spacing.lg,
  },
  square: {
    width: "100%",
    aspectRatio: 1,
  },
  covers: {
    gap: COVER_GAP,
  },
  coverRow: {
    flex: 1,
    flexDirection: "row",
    gap: COVER_GAP,
  },
  cover: {
    flex: 1,
  },
  name: {
    ...type.cardMeta,
    paddingTop: spacing.sm,
    minHeight: NAME_MIN_HEIGHT,
  },
  // Android shows the ripple instead
  pressed: {
    opacity: Platform.OS === "android" ? 1 : 0.6,
  },
});
