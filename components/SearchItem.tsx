import { Platform, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Text from "@/components/ThemedText";
import { Result, useSearch } from "@/state/SearchContext";
import { useColors } from "@/constants/colors";
import { spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

// Web px-3.5 on result rows, headings and the empty message
export const RESULT_INSET = spacing.md + spacing.xxs;

type SearchItemProps = {
  result: Result;
  index: number;
};

export default function SearchItem({ result }: SearchItemProps) {
  const router = useRouter();
  const { setSearchResults, setShowSuggestions } = useSearch();
  const colors = useColors();
  // Releases and tracks read "Artist · Title", like the web
  const parts = [result.artistName, result.name]
    .map((part) => part?.trim())
    .filter(Boolean);
  return (
    <Pressable
      onPress={() => {
        setSearchResults([]);
        setShowSuggestions(false);
        router.back();
        router.navigate(constructUrl(result));
      }}
      accessibilityRole="link"
      accessibilityLabel={parts.join(", ")}
      android_ripple={{ color: colors.tintX }}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.tint },
        pressed && styles.pressed,
      ]}
    >
      <Text numberOfLines={1} style={styles.label}>
        {parts.join(" · ")}
      </Text>
    </Pressable>
  );
}

export function SearchGroupHeading({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text
      accessibilityRole="header"
      style={[styles.heading, { color: colors.secondaryText }]}
    >
      {title}
    </Text>
  );
}

const constructUrl = (r: any) => {
  if (!r) {
    return "/";
  }

  if (r.isTrack) {
    return `/artist/${r.artistId}/album/${r.trackGroupId}/tracks/${r.id}` as const;
  } else if (r.isTrackGroup) {
    return `/artist/${r.artistId}/album/${r.trackGroupId}/album-tracks` as const; // as const tells typescript this is a literal string pattern
  } else if (r.isArtist) {
    return `/artist/${r.artistId}/artist-page` as const;
  } else {
    return `/tags/${r.name}` as const;
  }
};

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget,
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: RESULT_INSET,
  },
  // Web 0.95rem on a 24 line
  label: {
    ...type.body,
    fontSize: 15.2,
  },
  heading: {
    ...type.xsmall,
    fontWeight: "600",
    textTransform: "uppercase",
    // Web tracking-wider, 0.05em
    letterSpacing: type.xsmall.fontSize * 0.05,
    paddingTop: spacing.sm,
    paddingHorizontal: RESULT_INSET,
    paddingBottom: spacing.xs,
  },
  // Android shows the ripple instead
  pressed: {
    opacity: Platform.OS === "android" ? 1 : 0.6,
  },
});
