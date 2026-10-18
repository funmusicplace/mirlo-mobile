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

// Web Box with a tint-x border, shown when a grid has nothing in it
export function CollectionEmpty({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.empty, { borderColor: colors.tintX }]}>
      <Text style={type.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
