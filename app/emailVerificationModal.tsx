import * as api from "../queries/fetch/fetchWrapper";
import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import DismissModalBar from "@/components/DismissModalBar";
import { useTranslation } from "react-i18next";
import ErrorNotification from "@/components/ErrorNotification";
import Button from "@/components/Button";
import Text from "@/components/ThemedText";
import { storeTokens } from "@/queries/authQueries";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { radius, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

type VerifyEmailInputs = {
  email: string;
};
type verifyCodeInputs = {
  code: string;
};

export default function EmailVerificationModal() {
  const {
    control: controlEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<VerifyEmailInputs>({
    defaultValues: {
      email: "",
    },
  });
  const {
    control: controlCode,
    handleSubmit: handleSubmitCode,
    reset: resetCode,
    formState: { errors: codeErrors },
  } = useForm<verifyCodeInputs>({
    defaultValues: {
      code: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForVerification, setWaitingForVerification] = useState(false);
  const [email, setEmail] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t: tVerify } = useTranslation("translation", {
    keyPrefix: "trackGroupCard",
  });
  const { t } = useTranslation("translation", { keyPrefix: "logIn" });

  const [showError, setShowError] = useState(true);
  const colors = useColors();
  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      color: colors.inputText,
    },
  ];
  const errorStyle = [type.small, { color: colors.danger }];
  const [codeError, setCodeError] = useState<Error | null>(null);
  const [emailError, setEmailError] = useState<Error | null>(null);

  const verifyEmail = useCallback(
    async (emailInput: VerifyEmailInputs) => {
      try {
        setIsLoading(true);
        await api.post("/auth/verify-email", emailInput);
        setEmail(emailInput.email);
        setWaitingForVerification(true);

        resetCode();
      } catch (err) {
        console.error("issue verifying email");
        setEmailError(err as Error);
        setShowError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [resetCode],
  );

  const verifyCode = useCallback(
    async (code: verifyCodeInputs) => {
      try {
        setIsLoading(true);
        if (email) {
          const response = await api.post<
            { email: string; code: string },
            { userId: string }
          >("/auth/verify-email", { ...code, email });
          if (response.userId) {
            queryClient.invalidateQueries({
              predicate: (query) => query.queryKey.includes("auth"),
            });
            await storeTokens();
            router.dismiss();
          }
        }
      } catch (err) {
        console.log(err);
        console.error("issue verifying code", err);
        setCodeError(err as Error);
        setShowError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [email, queryClient, router],
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <DismissModalBar title={t("logIn")} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
      >
        {!waitingForVerification ? (
          <>
            {emailError && (
              <ErrorNotification
                visible={showError}
                onDismiss={() => setShowError(false)}
                error={emailError}
              />
            )}
            <Button
              variant="outlined"
              accessibilityRole="link"
              title="Login or Sign Up to View!"
              onPress={() => {
                // Close this sheet first so sign-in returns to the screen below
                router.dismiss();
                router.push("/login");
              }}
              fullWidth
            />
            <View style={styles.divider}>
              <View style={[styles.rule, { backgroundColor: colors.border }]} />
              <Text style={type.body}>OR</Text>
              <View style={[styles.rule, { backgroundColor: colors.border }]} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t("email")}</Text>
              <Controller
                key="email-controller"
                control={controlEmail}
                rules={{
                  required: true,
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    key="email-input"
                    style={inputStyle}
                    accessibilityLabel={t("email")}
                    autoCapitalize="none"
                    inputMode="email"
                    autoComplete="email"
                    placeholderTextColor={colors.inputPlaceholder}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
                name="email"
              />
              {emailErrors.email && (
                <Text accessibilityRole="alert" style={errorStyle}>
                  Email is required {emailErrors.email.message}
                </Text>
              )}
            </View>
            <Button
              title={tVerify("verifyEmail")}
              onPress={handleSubmitEmail(verifyEmail)}
              loading={isLoading}
              fullWidth
            />
          </>
        ) : (
          <>
            {codeError && (
              <ErrorNotification
                visible={showError}
                onDismiss={() => setShowError(false)}
                error={codeError}
              />
            )}
            <Text style={styles.instructions}>{tVerify("checkEmail")}</Text>
            <View style={styles.field}>
              <Text style={styles.label}>{tVerify("verificationCode")}</Text>
              <Controller
                key="code-controller"
                control={controlCode}
                rules={{ required: true }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    key="verification-code-input"
                    style={inputStyle}
                    accessibilityLabel={tVerify("verificationCode")}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    placeholderTextColor={colors.inputPlaceholder}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
                name="code"
              />
              {codeErrors.code && (
                <Text accessibilityRole="alert" style={errorStyle}>
                  Verification Code is required
                </Text>
              )}
            </View>
            <Button
              title={tVerify("verifyEmailCode")}
              onPress={handleSubmitCode(verifyCode)}
              loading={isLoading}
              fullWidth
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Field metrics mirror LoginForm
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  // Web "or" divider: 1rem around each rule
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
  },
  rule: {
    flex: 1,
    height: 1,
  },
  instructions: {
    ...type.body,
    marginBottom: spacing.sm,
  },
  field: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  label: {
    ...type.formLabel,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: type.body.fontSize,
    marginBottom: spacing.xs,
  },
});
