import { useQuery } from "@tanstack/react-query";
import { queryArtist } from "@/queries/queries";
import { useLocalSearchParams } from "expo-router";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Image,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Markdown from "@/components/Markdown";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { linkifyUrls } from "@/scripts/utils";
import Text from "@/components/ThemedText";
import Button from "@/components/Button";
import ShareButton from "@/components/ShareButton";
import ScreenHeader, { BackButton } from "@/components/ScreenHeader";
import SearchButton from "@/components/SearchButton";
import MenuButton from "@/components/MenuButton";
import TrackGroupItem, {
  useGridColumnWidth,
} from "@/components/TrackGroupItem";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { gutter, radius, spacing, touchTarget } from "@/constants/spacing";
import { markdownHeadings, type } from "@/constants/typography";

const BANNER_HEIGHT = 100;
const AVATAR_SIZE = 56;
// Web tab underline
const TAB_RULE = spacing.xs;

export default function ArtistPage() {
  const { id } = useLocalSearchParams();
  const { data, isError, isPending, error } = useQuery(
    queryArtist({ artistSlug: String(id) ?? "" }),
  );
  const { t } = useTranslation("translation");
  const colors = useColors();
  const columnWidth = useGridColumnWidth();
  const listRef = useRef<FlatList<AlbumProps>>(null);
  const contentHeight = useRef(0);
  const aboutHeight = useRef(0);

  if (isPending) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator
          size="large"
          color={colors.accent}
          style={styles.screen}
        />
      </View>
    );
  }

  if (isError) {
    return (
      <View>
        <Text>Error: {error.message} </Text>
      </View>
    );
  }

  const artistInfo = data;
  // The API sends the banner as background now
  const banner =
    (artistInfo as Artist & { background?: Artist["banner"] }).background ??
    artistInfo.banner;
  const bannerUri = banner?.sizes?.[1200] ?? banner?.sizes?.[625];

  // The about section is the list footer, so its top is the content end minus its height
  const scrollToAbout = () =>
    listRef.current?.scrollToOffset({
      offset: Math.max(contentHeight.current - aboutHeight.current, 0),
    });

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <ScreenHeader
        left={<BackButton />}
        right={
          <>
            <SearchButton />
            <MenuButton />
          </>
        }
      />
      <FlatList
        ref={listRef}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        data={artistInfo.trackGroups}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TrackGroupItem {...item} width={columnWidth} showArtist={false} />
        )}
        onContentSizeChange={(_, height) => {
          contentHeight.current = height;
        }}
        ListEmptyComponent={
          <Text
            style={[type.body, styles.empty, { color: colors.secondaryText }]}
          >
            No Albums Present!
          </Text>
        }
        ListHeaderComponent={
          <View>
            {bannerUri ? (
              <Image
                source={{ uri: bannerUri }}
                style={[styles.banner, { backgroundColor: colors.tint }]}
                resizeMode="cover"
              />
            ) : null}
            <View style={styles.identity}>
              {artistInfo.avatar ? (
                <Image
                  style={[styles.avatar, { backgroundColor: colors.tint }]}
                  source={{
                    uri: artistInfo.avatar.sizes?.[600] || "",
                  }}
                  resizeMode="cover"
                />
              ) : null}
              <View style={styles.identityText}>
                <Text accessibilityRole="header" style={styles.name}>
                  {artistInfo.name}
                </Text>
                {artistInfo.location ? (
                  <View style={styles.location}>
                    <Ionicons
                      name="location-outline"
                      size={type.small.fontSize}
                      color={colors.secondaryText}
                    />
                    <Text style={[type.small, { color: colors.secondaryText }]}>
                      {artistInfo.location}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View style={[styles.strip, { borderColor: colors.tintX }]}>
              <Button
                variant="transparent"
                size="compact"
                rounded
                title={t("artist.about")}
                textStyle={[styles.stripLabel, { color: colors.text }]}
                onPress={scrollToAbout}
              />
              {artistInfo.urlSlug ? (
                <ShareButton
                  url={`https://mirlo.space/${artistInfo.urlSlug}`}
                />
              ) : null}
            </View>
            <View style={[styles.tab, { borderBottomColor: colors.accent }]}>
              <Text
                accessibilityRole="header"
                style={[type.large, { color: colors.accent }]}
              >
                {t("artist.releases")}
              </Text>
            </View>
          </View>
        }
        ListFooterComponent={
          <View
            style={styles.about}
            onLayout={(event) => {
              aboutHeight.current = event.nativeEvent.layout.height;
            }}
          >
            <Text accessibilityRole="header" style={type.heading}>
              {t("artist.about")}
            </Text>
            {artistInfo.bio ? (
              <Markdown
                style={{
                  ...markdownHeadings,
                  body: { ...type.body, color: colors.text },
                  paragraph: { marginTop: 0, marginBottom: spacing.md },
                  link: {
                    color: colors.accent,
                    textDecorationLine: "underline",
                  },
                }}
              >
                {linkifyUrls(
                  artistInfo.bio.replace(/([^\n])\n([^\n])/g, "$1 $2"),
                )}
              </Markdown>
            ) : (
              <Text style={type.body}>
                {artistInfo.name + " is an artist on Mirlo"}
              </Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  columns: {
    gap: spacing.md,
    paddingHorizontal: gutter,
  },
  empty: {
    paddingHorizontal: gutter,
    paddingTop: spacing.lg,
  },
  banner: {
    width: "100%",
    height: BANNER_HEIGHT,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: gutter,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.pill,
  },
  identityText: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...type.large,
    fontWeight: "600",
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  // A full touch target tall, so Android keeps the share button's hit slop
  strip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
    minHeight: touchTarget,
    paddingHorizontal: gutter,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stripLabel: {
    fontWeight: "400",
    textTransform: "uppercase",
  },
  // Web tab: 26.4 from the label top to the rule, kept with the 22.4 line
  tab: {
    alignSelf: "flex-start",
    marginLeft: gutter,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: TAB_RULE,
  },
  // Padding keeps the whole section inside the measured footer height
  about: {
    paddingHorizontal: gutter,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
});
