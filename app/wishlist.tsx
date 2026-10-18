import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useAuthContext } from "@/state/AuthContext";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { queryWishlist } from "@/queries/queries";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MenuButton from "@/components/MenuButton";
import SearchButton from "@/components/SearchButton";
import ScreenHeader, { HeaderButton } from "@/components/ScreenHeader";
import MirloLogo, { LOGO_SIZE } from "@/components/MirloLogo";
import { useGridColumnWidth } from "@/components/TrackGroupItem";
import CollectionPurchase, {
  CollectionEmpty,
  CollectionItem,
} from "@/components/CollectionPurchase";
import { useTranslation } from "react-i18next";
import ErrorNotification from "@/components/ErrorNotification";
import { useColors } from "@/constants/colors";
import { gutter, spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";
import Text from "@/components/ThemedText";

type WishlistItem = CollectionItem & { createdAt: Date };

export default function Wishlist() {
  const { user } = useAuthContext();
  const userId = user?.id;
  const { top } = useSafeAreaInsets();
  const { isPending, isError, data, error } = useQuery(queryWishlist(userId));
  const { t } = useTranslation();
  const [showError, setShowError] = useState<boolean>(true);
  const colors = useColors();
  const columnWidth = useGridColumnWidth();
  const listRef = useRef<FlatList<WishlistItem>>(null);
  const wishlist = data?.results;
  const trackFavorites = user?.trackFavorites;

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user]);

  // Releases and favorited tracks in one grid, newest first like the web
  const items = useMemo(() => {
    const releases: WishlistItem[] = (wishlist ?? [])
      .filter((item) => item.trackGroup)
      .map((item) => ({
        key: `album-${item.trackGroupId}`,
        createdAt: item.createdAt,
        trackGroup: item.trackGroup,
      }));
    const tracks: WishlistItem[] = (trackFavorites ?? []).map((item) => ({
      key: `track-${item.trackId}`,
      createdAt: item.createdAt,
      trackGroup: item.track.trackGroup,
      track: item.track,
    }));
    return [...releases, ...tracks].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [wishlist, trackFavorites]);

  let content: ReactNode;
  // The query is disabled while signed out, so it stays pending
  if (isPending && userId) {
    content = (
      <ActivityIndicator
        size="large"
        color={colors.accent}
        style={styles.loadSpinner}
      />
    );
  } else if (isError) {
    console.error(error);
    content = (
      <ErrorNotification
        visible={showError}
        onDismiss={() => setShowError(false)}
        error={error}
      />
    );
  } else {
    content = (
      <FlatList
        ref={listRef}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={{ paddingHorizontal: gutter }}
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <CollectionPurchase
            trackGroup={item.trackGroup}
            track={item.track}
            width={columnWidth}
          />
        )}
        ListHeaderComponent={
          <Text accessibilityRole="header" style={styles.title}>
            {t("profile.yourWishlist")}
          </Text>
        }
        ListEmptyComponent={
          <CollectionEmpty>{t("profile.wishlistEmpty")}</CollectionEmpty>
        }
      />
    );
  }

  return (
    <View
      style={{ flex: 1, paddingTop: top, backgroundColor: colors.background }}
    >
      <ScreenHeader
        left={
          <HeaderButton
            size={LOGO_SIZE}
            accessibilityLabel="Mirlo"
            accessibilityHint="Scrolls to the top"
            onPress={() =>
              listRef.current?.scrollToOffset({ offset: 0, animated: true })
            }
          >
            <MirloLogo />
          </HeaderButton>
        }
        right={
          <>
            <SearchButton />
            <MenuButton />
          </>
        }
      />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  loadSpinner: {
    flex: 1,
  },
  // Web profile h1: margin 0.7rem 0
  title: {
    ...type.pageTitle,
    marginVertical: spacing.md,
  },
});
