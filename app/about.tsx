import { Linking, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import DismissModalBar from "@/components/DismissModalBar";
import { openInBrowser } from "@/scripts/openInBrowser";

type AboutLinkInfo = {
  label: string;
  url: string;
};

// Linking.openURL would route mirlo.space links back into the app
function onLinkPress(url: string) {
  if (url.startsWith("https://mirlo.space")) {
    openInBrowser(url);
  } else {
    Linking.openURL(url);
  }
}

function AboutLink({ label, url }: AboutLinkInfo) {
  return (
    <Pressable style={styles.link} onPress={() => onLinkPress(url)}>
      <Text style={{ fontSize: 20 }}>{label}</Text>
      <Ionicons name="open-outline" size={20} />
    </Pressable>
  );
}

export default function About() {
  const { t } = useTranslation("translation");

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
    <SafeAreaView style={styles.container}>
      <DismissModalBar />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.heading}>{t("footer.aboutHeading")}</Text>
        {aboutLinks.map((link) => (
          <AboutLink key={link.url} label={link.label} url={link.url} />
        ))}
        <Text style={styles.subheading}>{t("footer.connectHeading")}</Text>
        {connectLinks.map((link) => (
          <AboutLink key={link.url} label={link.label} url={link.url} />
        ))}
        {legalLinks.map((link) => (
          <AboutLink key={link.url} label={link.label} url={link.url} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  content: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    padding: 30,
    gap: 20,
  },
  heading: {
    fontSize: 25,
    fontWeight: "bold",
  },
  subheading: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    backgroundColor: "#edebeb",
    flexDirection: "row",
    width: "100%",
    padding: 10,
    alignItems: "center",
    gap: 10,
  },
});
