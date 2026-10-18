import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useAuthContext } from "@/state/AuthContext";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { queryUserCollection } from "@/queries/queries";
import { ReactNode, useEffect, useRef, useState } from "react";
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
import { isTrackGroupPurchase, isTrackPurchase } from "@/types/typeguards";
import ErrorNotification from "@/components/ErrorNotification";
import { Trans, useTranslation } from "react-i18next";
import { useColors } from "@/constants/colors";
import { gutter, spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";
import Text from "@/components/ThemedText";

export default function Collections() {
  const { user } = useAuthContext();
  const userId = user?.id;
  const { top } = useSafeAreaInsets();
  const colors = useColors();
  const { isPending, isError, data, error } = useQuery(
    queryUserCollection(userId),
  );
  const [showError, setShowError] = useState<boolean>(true);
  const purchases = data?.results;
  const { t } = useTranslation("translation");
  const columnWidth = useGridColumnWidth();
  const listRef = useRef<FlatList<CollectionItem>>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user]);

  const items = (purchases ?? []).flatMap<CollectionItem>((item) => {
    if (isTrackGroupPurchase(item) && item.trackGroup) {
      return [
        { key: `album-${item.trackGroupId}`, trackGroup: item.trackGroup },
      ];
    } else if (isTrackPurchase(item) && item.track) {
      return [
        {
          key: `track-${item.trackId}`,
          trackGroup: item.track.trackGroup,
          track: item.track,
        },
      ];
    }
    return [];
  });

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
            {t("profile.yourCollection")}
          </Text>
        }
        ListEmptyComponent={
          <CollectionEmpty>
            {/* The string carries the web's link tags, mobile shows them as text */}
            <Trans
              t={t}
              i18nKey="profile.collectionEmpty"
              components={{
                releases: <Text />,
                tags: <Text />,
                artists: <Text />,
              }}
            />
          </CollectionEmpty>
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
