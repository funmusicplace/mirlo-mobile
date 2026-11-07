import { useQuery } from "@tanstack/react-query";
import { queryArtist } from "@/queries/queries";
import { useLocalSearchParams } from "expo-router";
import {
  View,
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Image,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Markdown from "@/components/Markdown";
import ReadMore from "@/components/ReadMore";
import React, { type ReactNode, useRef } from "react";
import { useTranslation } from "react-i18next";
import { linkifyUrls } from "@/scripts/utils";
import {
  artistLinks,
  linkLabel,
  openLink,
  tourDay,
} from "@/scripts/artistPage";
import { siteUrlFor } from "@/scripts/instances";
import { useKnownApiRoot } from "@/state/InstancesContext";
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
// Web: w-14
const DATE_BOX_WIDTH = 56;

type Section = "dates" | "about" | "links";

function LinkRow({ link }: { link: Link }) {
  const { t } = useTranslation("translation");
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => openLink(link.url)}
      android_ripple={{ color: colors.tintX }}
      style={({ pressed }) => [
        styles.linkRow,
        pressed && Platform.OS === "ios" && styles.pressed,
      ]}
    >
      <Text style={[type.body, styles.linkText, { color: colors.accent }]}>
        {linkLabel(link, t)}
      </Text>
    </Pressable>
  );
}

function TourDateRow({ tourDate }: { tourDate: TourDate }) {
  const { t, i18n } = useTranslation("translation");
  const colors = useColors();
  const day = tourDay(tourDate.date);
  const longDate = day.toLocaleDateString(i18n.language, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const ticketsUrl = tourDate.ticketsUrl?.trim();
  const action = ticketsUrl
    ? t(
        new Date(tourDate.date) < new Date()
          ? "artist.eventPage"
          : "artist.buyTickets",
      )
    : undefined;
  // One element per row, or a screen reader reads the box and the lines apart
  const label = [tourDate.location, longDate, action]
    .filter(Boolean)
    .join(", ");
  const content = (
    <>
      <View style={[styles.dateBox, { borderColor: colors.border }]}>
        <Text
          style={[
            type.xsmall,
            styles.dateMonth,
            { color: colors.secondaryText },
          ]}
        >
          {day.toLocaleDateString(i18n.language, { month: "short" })}
        </Text>
        <Text style={styles.dateDay}>{day.getDate()}</Text>
      </View>
      <View style={styles.dateText}>
        <Text style={[type.small, styles.dateLocation]}>
          {tourDate.location}
        </Text>
        <Text style={[type.xsmall, { color: colors.secondaryText }]}>
          {longDate}
        </Text>
        {action ? (
          <Text
            style={[type.small, styles.dateAction, { color: colors.accent }]}
          >
            {action}
          </Text>
        ) : null}
      </View>
    </>
  );

  return ticketsUrl ? (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => openLink(ticketsUrl)}
      android_ripple={{ color: colors.tintX }}
      style={({ pressed }) => [
        styles.dateRow,
        pressed && Platform.OS === "ios" && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  ) : (
    <View accessible accessibilityLabel={label} style={styles.dateRow}>
      {content}
    </View>
  );
}

export default function ArtistPage() {
  const params = useLocalSearchParams<{ id: string; apiRoot?: string }>();
  const { id } = params;
  const { apiRoot, ready, unknown } = useKnownApiRoot(params.apiRoot);
  const artistQuery = queryArtist({ artistSlug: String(id) ?? "", apiRoot });
  const { data, isError, isPending, error } = useQuery({
    ...artistQuery,
    enabled: ready && artistQuery.enabled,
  });
  const { t } = useTranslation("translation");
  const colors = useColors();
  const columnWidth = useGridColumnWidth();
  const listRef = useRef<FlatList<AlbumProps>>(null);
  const listHeight = useRef(0);
  const contentHeight = useRef(0);
  const footerHeight = useRef(0);
  const sectionTops = useRef<Partial<Record<Section, number>>>({});

  if (unknown) {
    return (
      <View>
        <Text>{t("sources.unknownSource")}</Text>
      </View>
    );
  }

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
        <Text>
          {t("mobileApp.artistPage.error", { message: error.message })}
        </Text>
      </View>
    );
  }

  const artistInfo = data;
  const about = artistInfo.bio || artistInfo.shortDescription;
  // The API sends the banner as background now
  const banner =
    (artistInfo as Artist & { background?: Artist["banner"] }).background ??
    artistInfo.banner;
  const bannerUri = banner?.sizes?.[1200] ?? banner?.sizes?.[625];
  const announcement = artistInfo.announcementText?.trim();
  const tourDates = artistInfo.tourDates ?? [];
  const links = artistLinks(artistInfo);

  // The sections are the list footer, so the first starts at the content end
  // minus the footer. A short last section would aim past the end, so clamp
  const scrollToSection = (name: Section) => {
    const top =
      contentHeight.current -
      footerHeight.current +
      (sectionTops.current[name] ?? 0) -
      spacing.lg;
    listRef.current?.scrollToOffset({
      offset: Math.min(
        Math.max(top, 0),
        Math.max(contentHeight.current - listHeight.current, 0),
      ),
    });
  };
  const stripButton = (name: Section, label: string) => (
    <Button
      variant="transparent"
      size="compact"
      rounded
      title={label}
      textStyle={[styles.stripLabel, { color: colors.text }]}
      onPress={() => scrollToSection(name)}
    />
  );
  const section = (name: Section, title: string, children: ReactNode) => (
    <View
      style={styles.section}
      onLayout={(event) => {
        sectionTops.current[name] = event.nativeEvent.layout.y;
      }}
    >
      <Text accessibilityRole="header" style={type.heading}>
        {title}
      </Text>
      {children}
    </View>
  );

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
          <TrackGroupItem
            {...item}
            apiRoot={apiRoot}
            width={columnWidth}
            showArtist={false}
          />
        )}
        onLayout={(event) => {
          listHeight.current = event.nativeEvent.layout.height;
        }}
        onContentSizeChange={(_, height) => {
          contentHeight.current = height;
        }}
        ListEmptyComponent={
          <Text
            style={[type.body, styles.empty, { color: colors.secondaryText }]}
          >
            {t("mobileApp.artistPage.noAlbums")}
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
            {announcement ? (
              <View
                style={[
                  styles.announcement,
                  { backgroundColor: colors.button },
                ]}
              >
                <ReadMore
                  color={colors.buttonText}
                  moreKey="mobileApp.artistPage.readMore"
                  lessKey="mobileApp.artistPage.showLess"
                >
                  <Markdown
                    style={{
                      body: {
                        ...type.body,
                        color: colors.buttonText,
                        // Keeps the last paragraph's margin out of ReadMore's measure
                        marginBottom: -spacing.md,
                      },
                      paragraph: { marginTop: 0, marginBottom: spacing.md },
                      link: {
                        color: colors.buttonText,
                        textDecorationLine: "underline",
                      },
                    }}
                  >
                    {linkifyUrls(announcement)}
                  </Markdown>
                </ReadMore>
              </View>
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
                      aria-hidden
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
              {tourDates.length
                ? stripButton("dates", t("artist.dates"))
                : null}
              {about ? stripButton("about", t("artist.about")) : null}
              {links.length
                ? stripButton("links", t("manageArtist.links"))
                : null}
              {artistInfo.urlSlug ? (
                <ShareButton
                  url={`${siteUrlFor(apiRoot)}/${artistInfo.urlSlug}`}
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
          tourDates.length || about || links.length ? (
            <View
              style={styles.footer}
              onLayout={(event) => {
                footerHeight.current = event.nativeEvent.layout.height;
              }}
            >
              {tourDates.length
                ? section(
                    "dates",
                    t("artist.tourDatesModalTitle"),
                    <View>
                      {tourDates.map((tourDate) => (
                        <TourDateRow key={tourDate.id} tourDate={tourDate} />
                      ))}
                    </View>,
                  )
                : null}
              {about
                ? section(
                    "about",
                    t("artist.about"),
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
                      {linkifyUrls(about.replace(/([^\n])\n([^\n])/g, "$1 $2"))}
                    </Markdown>,
                  )
                : null}
              {links.length
                ? section(
                    "links",
                    t("manageArtist.links"),
                    <View>
                      {links.map((link, index) => (
                        <LinkRow key={`${index}-${link.url}`} link={link} />
                      ))}
                    </View>,
                  )
                : null}
            </View>
          ) : null
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
    flexWrap: "wrap",
    alignItems: "center",
    // Else a single line sits at the top of the minimum height
    alignContent: "center",
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
  announcement: {
    padding: spacing.lg,
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
  // Padding keeps the sections inside the measured footer height
  footer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xxl,
  },
  section: {
    paddingHorizontal: gutter,
    gap: spacing.sm,
  },
  linkRow: {
    minHeight: touchTarget,
    justifyContent: "center",
  },
  linkText: {
    textDecorationLine: "underline",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    minHeight: touchTarget,
    paddingVertical: spacing.sm,
  },
  dateBox: {
    minWidth: DATE_BOX_WIDTH,
    alignItems: "center",
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  dateMonth: {
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dateDay: {
    ...type.heading,
    fontWeight: "600",
  },
  dateText: {
    flex: 1,
  },
  dateLocation: {
    fontWeight: "500",
  },
  dateAction: {
    marginTop: spacing.xs,
    textDecorationLine: "underline",
  },
  pressed: {
    opacity: 0.6,
  },
});
