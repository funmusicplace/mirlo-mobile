import { useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as api from "../queries/fetch/fetchWrapper";
import Button from "@/components/Button";
import DismissModalBar from "@/components/DismissModalBar";
import FilterGroup from "@/components/FilterGroup";
import Text from "@/components/ThemedText";
import Turnstile from "@/components/Turnstile";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { radius, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";
import { useAuthContext } from "@/state/AuthContext";

type Reason = "copyrightViolation" | "inappropriateContent";

// Web FlagContent
export default function ReportAlbumModal() {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation("translation");
  const { trackGroupId } = useLocalSearchParams();
  const { user } = useAuthContext();
  const [reason, setReason] = useState<Reason>("copyrightViolation");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [token, setToken] = useState<string | null>(null);
  // Remounting the widget gets a new token, each one passes the check once
  const [attempt, setAttempt] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);

  const reasons: { value: Reason; label: string }[] = [
    { value: "copyrightViolation", label: t("artist.copyrightViolation") },
    { value: "inappropriateContent", label: t("artist.inappropriateContent") },
  ];
  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      color: colors.inputText,
    },
  ];

  const report = async () => {
    setSending(true);
    setFailed(false);
    try {
      await api.post("/v1/flag", {
        reason,
        email: email.trim(),
        description: description.trim(),
        cfTurnstile: token,
        trackGroupId: Number(trackGroupId),
      });
      setSent(true);
    } catch (err) {
      console.error("Issue reporting album", err);
      setFailed(true);
      setToken(null);
      setAttempt((count) => count + 1);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <DismissModalBar title={t("artist.flagContent")} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {sent ? (
          <Text accessibilityRole="alert" style={type.body}>
            {t("artist.reportContentSuccess")}
          </Text>
        ) : (
          <>
            <Text style={type.body}>
              {t("artist.reportContentDescription")}
            </Text>
            <View style={styles.field}>
              <Text style={styles.label}>
                {t("artist.whyAreYouFlaggingIt")}
              </Text>
              <FilterGroup
                legend={t("artist.whyAreYouFlaggingIt")}
                options={reasons}
                value={reason}
                onChange={setReason}
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                accessibilityLabel={t("artist.whyAreYouFlaggingIt")}
                multiline
                style={[inputStyle, styles.multiline]}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t("artist.howContact")}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                accessibilityLabel={t("artist.howContact")}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                style={inputStyle}
              />
            </View>
            <Turnstile key={attempt} onToken={setToken} />
          </>
        )}
        <Button
          title={sent ? t("common.close") : t("artist.submit")}
          onPress={sent ? () => router.dismiss() : report}
          disabled={!sent && !(description.trim() && email.trim() && token)}
          loading={sending}
          fullWidth
        />
        {failed ? (
          <Text
            accessibilityRole="alert"
            style={[type.small, { color: colors.danger }]}
          >
            {t("artist.reportContentError")}
          </Text>
        ) : null}
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
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  label: type.formLabel,
  input: {
    fontSize: type.body.fontSize,
    minHeight: touchTarget,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  multiline: {
    minHeight: touchTarget * 2,
    textAlignVertical: "top",
  },
});
