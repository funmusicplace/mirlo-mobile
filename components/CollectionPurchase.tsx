import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import TrackGroupItem from "@/components/TrackGroupItem";
import Text from "@/components/ThemedText";
import WishlistCardActions from "@/components/WishlistCardActions";
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
  // Wishlist card: marks tracks and adds remove and play controls
  wishlist?: boolean;
};

// Grid card for a release, or for a single track with its release cover
export default function CollectionPurchase({
  trackGroup,
  track,
  width,
  wishlist,
}: CollectionPurchaseProps) {
  const { t } = useTranslation("translation");
  const wishlistProps = wishlist && {
    caption: track ? t("sales.track") : undefined,
    actions: <WishlistCardActions trackGroup={trackGroup} track={track} />,
  };
  if (!track) {
    return <TrackGroupItem {...trackGroup} width={width} {...wishlistProps} />;
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
      {...wishlistProps}
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
