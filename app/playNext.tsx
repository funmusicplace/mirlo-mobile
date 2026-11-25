import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import DismissModalBar from "@/components/DismissModalBar";
import PlayFeaturedButton from "@/components/PlayFeaturedButton";
import { usePlayNext } from "@/components/PlayNextPrompt";
import Text from "@/components/ThemedText";
import TrackGroupItem from "@/components/TrackGroupItem";
import { playRelease } from "@/components/WishlistCardActions";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";
import { keyOf } from "@/scripts/playNext";
import { usePlayer } from "@/state/PlayerContext";

// The web rail's phone card width, so the next card peeks in
const CARD_SHARE = 0.42;
// Lines the rails up with the modal title
const INSET = spacing.lg;

export default function PlayNext() {
  const { t } = useTranslation("translation");
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  // The iPad's form sheet is narrower than the window
  const [sheetWidth, setSheetWidth] = useState<number>();
  const { finished } = usePlayer();
  // The latest finished release, kept while a suggestion plays
  const [release, setRelease] = useState(finished);
  if (finished && finished !== release) setRelease(finished);
  const { sections, isLoading } = usePlayNext(release);
  const cardWidth = Math.round((sheetWidth ?? windowWidth) * CARD_SHARE);
  const artistName = release?.artist.name;
  const titles = {
    recommended: t("mobileApp.playNext.recommendedBy", { artistName }),
    artist: t("trackGroupDetails.otherReleasesBy", { artistName }),
    similar: t("mobileApp.playNext.similarReleases"),
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
      onLayout={(e) => setSheetWidth(e.nativeEvent.layout.width)}
    >
      <DismissModalBar title={t("mobileApp.playNext.title")} />
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={colors.accent}
          style={styles.screen}
        />
      ) : sections.length ? (
        <ScrollView contentContainerStyle={styles.content}>
          {sections.map(({ key, releases }) => (
            <View key={key}>
              <Text accessibilityRole="header" style={styles.heading}>
                {titles[key]}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rail}
                // Each stop puts a card at the inset, like the web rail's snap
                snapToInterval={cardWidth + spacing.md}
                decelerationRate="fast"
              >
                {releases.map((item) => (
                  <TrackGroupItem
                    key={keyOf(item)}
                    {...item}
                    width={cardWidth}
                    showArtist={key !== "artist"}
                    inModal
                    actions={
                      <View style={styles.actions}>
                        <PlayFeaturedButton
                          albums={[item]}
                          {...playRelease(item)}
                        />
                      </View>
                    }
                  />
                ))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text
          style={[type.body, styles.empty, { color: colors.secondaryText }]}
        >
          {t("mobileApp.playNext.empty")}
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  // Web ScrollRail heading: 16 semibold, 12 above the cards
  heading: {
    ...type.body,
    fontWeight: "600",
    paddingHorizontal: INSET,
    marginBottom: spacing.md,
  },
  rail: {
    paddingHorizontal: INSET,
    gap: spacing.md,
  },
  // A full touch target tall like the wishlist actions, so Android keeps the hit slop
  actions: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: touchTarget,
  },
  empty: {
    padding: INSET,
  },
});
