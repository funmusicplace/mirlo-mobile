import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import TrackGroupItem from "@/components/TrackGroupItem";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { radius, spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";

export type CollectionItem = {
  key: string;
  trackGroup: AlbumProps;
  track?: RNTrack;
};

type CollectionPurchaseProps = Omit<CollectionItem, "key"> & {
  width: number;
};

// Grid card for a release, or for a single track with its release cover
export default function CollectionPurchase({
  trackGroup,
  track,
  width,
}: CollectionPurchaseProps) {
  if (!track) {
    return <TrackGroupItem {...trackGroup} width={width} />;
  }
  return (
    <TrackGroupItem
      {...trackGroup}
      title={track.title}
      width={width}
      href={{
        pathname: "/artist/[id]/album/[slug]/tracks/[trackId]",
        params: {
          id: trackGroup.artistId,
          slug: trackGroup.urlSlug,
          trackId: track.id,
        },
      }}
    />
  );
}

// Web Box for an empty grid, bordered where the web page adds a border
export function CollectionEmpty({
  children,
  bordered,
}: {
  children: ReactNode;
  bordered?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.empty,
        bordered && [styles.bordered, { borderColor: colors.tintX }],
      ]}
    >
      <Text style={type.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bordered: {
    borderWidth: 1,
  },
});
