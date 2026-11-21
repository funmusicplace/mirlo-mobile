import { useEmailPurchaseLinkMutation } from "@/queries/queries";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePlayer } from "@/state/PlayerContext";
import { useColors } from "@/constants/colors";
import { useAuthContext } from "@/state/AuthContext";
import { useTranslation } from "react-i18next";
import Button from "@/components/Button";
import DismissModalBar from "@/components/DismissModalBar";
import Text from "@/components/ThemedText";
import { screenEdges } from "@/constants/safe-area";
import { spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";

export default function MaxPlaysReached() {
  const colors = useColors();
  const { t } = useTranslation("translation");
  const { activeTrack } = usePlayer();
  const { user } = useAuthContext();
  const purchaseEmail = useEmailPurchaseLinkMutation();
  const isEmailSent = purchaseEmail.isSuccess;

  function sendPurchaseEmail() {
    if (activeTrack && user) {
      purchaseEmail.mutate({
        trackGroupId: activeTrack.trackGroup.id,
        email: user.email,
      });
    } else {
      console.log("Missing active track or user email");
    }
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <DismissModalBar
        title={t("mobileApp.maxPlaysReached.title", {
          title: activeTrack?.title ?? "",
        })}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          {activeTrack?.allowIndividualSale
            ? t("mobileApp.maxPlaysReached.buyThisTrackTo")
            : t("mobileApp.maxPlaysReached.buyThisAlbumTo")}
        </Text>
        <View style={styles.list}>
          {[
            t("mobileApp.emailPurchaseInfoModal.support", {
              artist: activeTrack?.artist ?? "",
            }),
            t("mobileApp.emailPurchaseInfoModal.unlimitedStreaming"),
            t("mobileApp.emailPurchaseInfoModal.highQualityDownloads"),
          ].map((text) => (
            <Text key={text} style={type.body}>
              • {text}
            </Text>
          ))}
        </View>

        {!user && (
          <Text style={styles.callout}>
            {t("mobileApp.emailPurchaseInfoModal.logInOrSignUp")}
          </Text>
        )}

        {user && (
          <Button
            title={
              isEmailSent
                ? t("mobileApp.emailPurchaseInfoModal.emailSent")
                : t("mobileApp.emailPurchaseInfoModal.emailPurchaseInfo")
            }
            startIcon={
              isEmailSent ? <Ionicons name="checkmark-sharp" /> : undefined
            }
            onPress={() => {
              sendPurchaseEmail();
            }}
            disabled={isEmailSent}
            loading={purchaseEmail.isPending}
            fullWidth
            style={styles.action}
          />
        )}
        {purchaseEmail.isError && (
          <Text
            accessibilityRole="alert"
            style={[type.body, styles.error, { color: colors.danger }]}
          >
            {t("trackGroupCard.error")}
          </Text>
        )}
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
  },
  intro: {
    ...type.body,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.xs,
  },
  callout: {
    ...type.body,
    fontWeight: "600",
    marginTop: spacing.xl,
  },
  action: {
    marginTop: spacing.xl,
  },
  error: {
    marginTop: spacing.md,
  },
});
