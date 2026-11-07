import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import Button from "@/components/Button";
import DismissModalBar from "@/components/DismissModalBar";
import { openInBrowser } from "@/scripts/openInBrowser";
import { useAuthContext } from "@/state/AuthContext";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { radius, spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";

// Apps can't call DELETE /v1/users/:id, so the site asks for the confirmation
const ACCOUNT_URL = "https://mirlo.space/account";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { user, refreshLoggedInUser } = useAuthContext();
  const [openedAccountPage, setOpenedAccountPage] = useState(false);
  const colors = useColors();
  const { t } = useTranslation("translation");

  const artistCount = user?.artists?.length ?? 0;
  const albumPurchaseCount = user?.userTrackGroupPurchases?.length ?? 0;
  const trackPurchaseCount = user?.userTrackPurchases?.length ?? 0;
  const merchPurchaseCount = user?.merchPurchase?.length ?? 0;
  const subscriptionCount = user?.artistUserSubscriptions?.length ?? 0;

  const warningItems = useMemo(() => {
    const items = [t("mobileApp.deleteAccount.permanent")];

    if (artistCount > 0) {
      items.push(
        t("mobileApp.deleteAccount.artistProfiles", { count: artistCount }),
      );
    }

    if (subscriptionCount > 0) {
      items.push(
        t("mobileApp.deleteAccount.activeSubscriptions", {
          count: subscriptionCount,
        }),
      );
    }

    if (albumPurchaseCount > 0 || trackPurchaseCount > 0) {
      const totalMusicPurchases = albumPurchaseCount + trackPurchaseCount;
      items.push(
        t("mobileApp.deleteAccount.musicPurchases", {
          count: totalMusicPurchases,
        }),
      );
    }

    if (merchPurchaseCount > 0) {
      items.push(
        t("mobileApp.deleteAccount.merchPurchases", {
          count: merchPurchaseCount,
        }),
      );
    }

    items.push(t("mobileApp.deleteAccount.cannotBeUndone"));

    return items;
  }, [
    albumPurchaseCount,
    artistCount,
    merchPurchaseCount,
    subscriptionCount,
    t,
    trackPurchaseCount,
  ]);

  const openAccountPage = useCallback(async () => {
    await openInBrowser(ACCOUNT_URL);
    setOpenedAccountPage(true);
    refreshLoggedInUser();
  }, [refreshLoggedInUser]);

  // Android resolves openInBrowser as soon as the tab opens, so look again
  // when the app comes back to the foreground
  useEffect(() => {
    if (!openedAccountPage) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshLoggedInUser();
    });
    return () => subscription.remove();
  }, [openedAccountPage, refreshLoggedInUser]);

  // Deleting the account on the site ends the session here
  useEffect(() => {
    if (openedAccountPage && !user) router.dismissTo("/");
  }, [openedAccountPage, user, router]);

  // Signed out: log in first, unless the account was just deleted
  const needsLogin = !user && !openedAccountPage;
  useEffect(() => {
    if (needsLogin) router.push("/login");
  }, [needsLogin, router]);

  if (needsLogin) return null;

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <DismissModalBar />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={type.heading}>
            {t("profile.deleteAccount")}
          </Text>
          <Text style={[type.body, { color: colors.secondaryText }]}>
            {t("mobileApp.deleteAccount.intro")}
          </Text>
        </View>

        <View
          style={[
            styles.box,
            styles.warning,
            {
              backgroundColor: colors.alert,
              borderLeftColor: colors.alertBorder,
            },
          ]}
        >
          <Text style={styles.boxTitle}>
            {t("mobileApp.deleteAccount.whatHappensNext")}
          </Text>
          {warningItems.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Text aria-hidden style={type.body}>
                •
              </Text>
              <Text style={[type.body, styles.bulletText]}>{item}</Text>
            </View>
          ))}
        </View>

        {(() => {
          const musicPurchaseCount = albumPurchaseCount + trackPurchaseCount;
          const summaryRows = [
            artistCount > 0 &&
              t("mobileApp.deleteAccount.summaryArtistProfiles", {
                count: artistCount,
              }),
            subscriptionCount > 0 &&
              t("mobileApp.deleteAccount.summaryArtistSubscriptions", {
                count: subscriptionCount,
              }),
            musicPurchaseCount > 0 &&
              t("mobileApp.deleteAccount.summaryMusicPurchases", {
                count: musicPurchaseCount,
              }),
            merchPurchaseCount > 0 &&
              t("mobileApp.deleteAccount.summaryMerchPurchases", {
                count: merchPurchaseCount,
              }),
          ].filter(Boolean) as string[];

          if (summaryRows.length === 0) return null;

          return (
            <View
              style={[
                styles.box,
                styles.summary,
                { borderColor: colors.border },
              ]}
            >
              <Text style={styles.boxTitle}>
                {t("mobileApp.deleteAccount.accountSummary")}
              </Text>
              {summaryRows.map((row) => (
                <Text
                  key={row}
                  style={[type.body, { color: colors.secondaryText }]}
                >
                  {row}
                </Text>
              ))}
            </View>
          );
        })()}

        <View style={styles.actions}>
          <Button
            variant="outlined"
            title={t("confirmationDialog.cancel")}
            onPress={() => router.dismiss()}
          />
          <Button
            title={t("profile.deleteAccount")}
            onPress={openAccountPage}
            disabled={!user}
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
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  // Same box metrics as ErrorNotification, the web warning Box
  box: {
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  warning: {
    borderLeftWidth: 4,
  },
  summary: {
    borderWidth: 1,
  },
  boxTitle: {
    ...type.body,
    fontWeight: "600",
  },
  bulletRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  bulletText: {
    flex: 1,
  },
  // Adds to the content gap for the web dialog's 24 above the buttons
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
