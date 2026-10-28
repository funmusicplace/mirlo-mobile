import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Button from "@/components/Button";
import ErrorNotification from "@/components/ErrorNotification";
import ScreenHeader, { BackButton } from "@/components/ScreenHeader";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";
import { openInBrowser } from "@/scripts/openInBrowser";
import { useAuthContext } from "@/state/AuthContext";

// --mi-container-small, the web login column
const COLUMN_WIDTH = 300;

export default function Login() {
  const colors = useColors();
  const { height } = useWindowDimensions();
  const router = useRouter();
  const { t } = useTranslation("translation", { keyPrefix: "logIn" });
  const { signIn, signingIn, signInError } = useAuthContext();
  const [showError, setShowError] = useState<boolean>(true);
  // The web login page pads its column by 10vh
  const paddingTop = height * 0.1;

  const handleLogIn = async () => {
    setShowError(true);
    if (!(await signIn())) return;
    if (router.canDismiss()) {
      router.dismiss();
    } else {
      router.dismissTo("/");
    }
  };

  const handleBrowserOpen = async () => {
    await openInBrowser("https://mirlo.space/signup");
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <ScreenHeader left={<BackButton />} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop }]}>
        <View style={styles.column}>
          <Text style={styles.title} accessibilityRole="header">
            {t("logIn")}
          </Text>
          <Text style={[styles.description, { color: colors.secondaryText }]}>
            {t(
              "description",
              "You'll log in on mirlo.space, then return to the app.",
            )}
          </Text>
          {signInError && (
            <ErrorNotification
              visible={showError}
              onDismiss={() => setShowError(false)}
              error={signInError}
            />
          )}

          <Button
            title={t("logInWithMirlo", "Log in with Mirlo")}
            onPress={handleLogIn}
            loading={signingIn}
            fullWidth
          />

          <Button
            variant="link"
            accessibilityRole="link"
            title={t("signUp")}
            onPress={handleBrowserOpen}
            style={styles.signUp}
          />
        </View>
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
  },
  column: {
    width: "100%",
    maxWidth: COLUMN_WIDTH,
    alignSelf: "center",
    // Keeps the sign up link hit slop inside the column
    paddingBottom: spacing.xl,
  },
  title: type.pageTitle,
  description: {
    ...type.body,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  signUp: {
    alignSelf: "flex-start",
    marginTop: spacing.xxl,
  },
});
