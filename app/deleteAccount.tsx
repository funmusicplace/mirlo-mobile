import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

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

  const artistCount = user?.artists?.length ?? 0;
  const albumPurchaseCount = user?.userTrackGroupPurchases?.length ?? 0;
  const trackPurchaseCount = user?.userTrackPurchases?.length ?? 0;
  const merchPurchaseCount = user?.merchPurchase?.length ?? 0;
  const subscriptionCount = user?.artistUserSubscriptions?.length ?? 0;

  const warningItems = useMemo(() => {
    const items = [
      "This permanently deletes your Mirlo account and logs you out of the app.",
    ];

    if (artistCount > 0) {
      items.push(
        `This account has ${artistCount} artist ${artistCount === 1 ? "profile" : "profiles"}.`,
      );
    }

    if (subscriptionCount > 0) {
      items.push(
        `This account has ${subscriptionCount} active artist ${subscriptionCount === 1 ? "subscription" : "subscriptions"}.`,
      );
    }

    if (albumPurchaseCount > 0 || trackPurchaseCount > 0) {
      const totalMusicPurchases = albumPurchaseCount + trackPurchaseCount;
      items.push(
        `This account has ${totalMusicPurchases} music ${totalMusicPurchases === 1 ? "purchase" : "purchases"}.`,
      );
    }

    if (merchPurchaseCount > 0) {
      items.push(
        `This account has ${merchPurchaseCount} merch ${merchPurchaseCount === 1 ? "purchase" : "purchases"}.`,
      );
    }

    items.push("This action cannot be undone.");

    return items;
  }, [
    albumPurchaseCount,
    artistCount,
    merchPurchaseCount,
    subscriptionCount,
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

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <DismissModalBar />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={type.heading}>
            Delete account
          </Text>
          <Text style={[type.body, { color: colors.secondaryText }]}>
            Review the impact below. You'll finish on mirlo.space, which asks
            you to confirm before it deletes the account.
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
          <Text style={styles.boxTitle}>What happens next</Text>
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
            artistCount > 0 && `Artist profiles: ${artistCount}`,
            subscriptionCount > 0 &&
              `Artist subscriptions: ${subscriptionCount}`,
            musicPurchaseCount > 0 && `Music purchases: ${musicPurchaseCount}`,
            merchPurchaseCount > 0 && `Merch purchases: ${merchPurchaseCount}`,
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
              <Text style={styles.boxTitle}>Account summary</Text>
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
            title="Cancel"
            onPress={() => router.dismiss()}
          />
          <Button
            title="Delete account"
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
