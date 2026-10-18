import {
  Linking,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Button from "@/components/Button";
import ScreenHeader, { BackButton } from "@/components/ScreenHeader";
import { openInBrowser } from "@/scripts/openInBrowser";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

type AboutLinkInfo = {
  label: string;
  url: string;
};

// Hit slop the link Button adds above and below its 24 pt line
const LINK_SLOP = (touchTarget - type.body.lineHeight) / 2;

// Linking.openURL would route mirlo.space links back into the app
function onLinkPress(url: string) {
  if (url.startsWith("https://mirlo.space")) {
    openInBrowser(url);
  } else {
    Linking.openURL(url);
  }
}

type AboutLinksProps = {
  links: AboutLinkInfo[];
  style?: StyleProp<ViewStyle>;
};

function AboutLinks({ links, style }: AboutLinksProps) {
  return (
    <View style={[styles.links, style]}>
      {links.map((link) => (
        <Button
          key={link.url}
          variant="link"
          accessibilityRole="link"
          title={link.label}
          onPress={() => onLinkPress(link.url)}
          style={styles.link}
        />
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

  const connectLinks: AboutLinkInfo[] = [
    { label: "Instagram", url: "https://instagram.com/mirlo.space" },
    { label: "Mastodon", url: "https://musician.social/@mirlo" },
    { label: "Bluesky", url: "https://bsky.app/profile/mirlo.space" },
  ];

  const legalLinks: AboutLinkInfo[] = [
    { label: t("footer.terms"), url: "https://mirlo.space/pages/terms" },
    { label: t("footer.privacy"), url: "https://mirlo.space/pages/privacy" },
  ];

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <ScreenHeader left={<BackButton />} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[type.display, styles.title]} accessibilityRole="header">
          {t("footer.aboutHeading")}
        </Text>
        <AboutLinks links={aboutLinks} />
        <Text style={[type.heading, styles.heading]} accessibilityRole="header">
          {t("footer.connectHeading")}
        </Text>
        <AboutLinks links={connectLinks} />
        <AboutLinks links={legalLinks} style={styles.group} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  title: {
    marginBottom: spacing.sm,
  },
  heading: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  group: {
    marginTop: spacing.lg,
  },
  // Android drops touches outside the parent, so the slop stays inside
  links: {
    paddingVertical: LINK_SLOP,
    gap: LINK_SLOP * 2,
  },
  link: {
    alignSelf: "flex-start",
  },
});
