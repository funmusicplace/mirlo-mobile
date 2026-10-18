import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import ScreenHeader, { BackButton } from "@/components/ScreenHeader";
import { openInBrowser } from "@/scripts/openInBrowser";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

type AboutLinkInfo = {
  label: string;
  url: string;
  icon?: "instagram" | "mastodon" | "bluesky";
};

// Linking.openURL would route mirlo.space links back into the app
function onLinkPress(url: string) {
  if (url.startsWith("https://mirlo.space")) {
    openInBrowser(url);
  } else {
    Linking.openURL(url);
  }
}

// One column of the web footer: a bold heading over underlined links
function AboutColumn({
  heading,
  links,
}: {
  heading?: string;
  links: AboutLinkInfo[];
}) {
  const colors = useColors();
  return (
    <View style={styles.column}>
      {heading ? (
        <Text style={styles.heading} accessibilityRole="header">
          {heading}
        </Text>
      ) : null}
      {links.map((link) => (
        <Pressable
          key={link.url}
          accessibilityRole="link"
          onPress={() => onLinkPress(link.url)}
          android_ripple={{ color: colors.tintX }}
          style={({ pressed }) => [
            styles.link,
            pressed && Platform.OS === "ios" && styles.pressed,
          ]}
        >
          {link.icon ? (
            <FontAwesome6
              name={link.icon}
              brand
              size={type.small.fontSize}
              color={colors.accent}
            />
          ) : null}
          <Text style={[styles.linkText, { color: colors.accent }]}>
            {link.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function About() {
  const { t } = useTranslation("translation");
  const colors = useColors();

  const aboutLinks: AboutLinkInfo[] = [
    { label: "mirlo.space", url: "https://mirlo.space" },
    { label: t("footer.about"), url: "https://docs.mirlo.space" },
    { label: t("footer.contact"), url: "mailto:hi@mirlo.space" },
  ];

  const legalLinks: AboutLinkInfo[] = [
    { label: t("footer.terms"), url: "https://mirlo.space/pages/terms" },
    { label: t("footer.privacy"), url: "https://mirlo.space/pages/privacy" },
  ];

  const connectLinks: AboutLinkInfo[] = [
    {
      label: "Instagram",
      url: "https://instagram.com/mirlo.space",
      icon: "instagram",
    },
    {
      label: "Mastodon",
      url: "https://musician.social/@mirlo",
      icon: "mastodon",
    },
    {
      label: "Bluesky",
      url: "https://bsky.app/profile/mirlo.space",
      icon: "bluesky",
    },
  ];

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <ScreenHeader left={<BackButton />} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <AboutColumn heading={t("footer.aboutHeading")} links={aboutLinks} />
          <AboutColumn
            heading={t("footer.legalHeading", "Legal")}
            links={legalLinks}
          />
        </View>
        <View style={styles.row}>
          <AboutColumn
            heading={t("footer.connectHeading")}
            links={connectLinks}
          />
          <View style={styles.column} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  // Web footer: 2rem side padding, two columns 2rem apart
  content: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    gap: spacing.xl,
  },
  row: {
    flexDirection: "row",
    gap: spacing.xxl,
  },
  column: {
    flex: 1,
  },
  heading: {
    ...type.small,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  // Web rows are 28 apart, 44 is the platform touch target
  link: {
    minHeight: touchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  linkText: {
    ...type.small,
    textDecorationLine: "underline",
  },
  pressed: {
    opacity: 0.6,
  },
});
