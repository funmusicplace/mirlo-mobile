import { StyleSheet, TextInput, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useLoginMutation } from "@/queries/authQueries";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { openInBrowser } from "@/scripts/openInBrowser";
import ErrorNotification from "./ErrorNotification";
import Button from "./Button";
import Text from "./ThemedText";
import { useColors } from "@/constants/colors";
import { radius, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

type LoginInputs = {
  email: string;
  password: string;
};

// --mi-container-small, the web login column
const COLUMN_WIDTH = 300;

export default function LoginForm() {
  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<LoginInputs>({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const router = useRouter();
  const [loginError, setLoginError] = useState<Error | null>(null);
  const { t } = useTranslation("translation", { keyPrefix: "logIn" });
  const [showError, setShowError] = useState<boolean>(true);

  const { mutate: login, isPending } = useLoginMutation();
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

  const handleBrowserOpen = async () => {
    await openInBrowser("https://mirlo.space/signup");
  };

  const onSubmit = async (data: LoginInputs) => {
    // The keyboard's Go key bypasses the button's loading guard
    if (isPending) return;
    login(data, {
      onSuccess() {
        console.log("logged in successfully");
        if (router.canDismiss()) {
          router.dismiss();
        } else {
          router.dismissTo("/");
        }
      },
      onError(e) {
        console.error("e", e.message);
        console.error(e);
        setLoginError(e);
        setShowError(true);
      },
    });
  };
  const submit = handleSubmit(onSubmit);

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {t("logIn")}
      </Text>
      <View style={styles.field}>
        <Text style={styles.label}>{t("email")}</Text>
        <Controller
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, onChange, onBlur, value } }) => (
            <TextInput
              ref={ref}
              style={inputStyle}
              accessibilityLabel={t("email")}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => setFocus("password")}
              placeholderTextColor={colors.inputPlaceholder}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
          name="email"
        />
        {errors.email && <Text style={errorStyle}>Email is required</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t("password")}</Text>
        <Controller
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, onChange, onBlur, value } }) => (
            <TextInput
              ref={ref}
              style={inputStyle}
              accessibilityLabel={t("password")}
              returnKeyType="go"
              onSubmitEditing={submit}
              placeholderTextColor={colors.inputPlaceholder}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry
            />
          )}
          name="password"
        />
        {errors.password && (
          <Text style={errorStyle}>Password is required</Text>
        )}
      </View>
      {loginError && (
        <ErrorNotification
          visible={showError}
          onDismiss={() => setShowError(false)}
          error={loginError}
        />
      )}

      <Button
        title={t("logIn")}
        onPress={submit}
        loading={isPending}
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
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: COLUMN_WIDTH,
    alignSelf: "center",
    // Keeps the sign up link hit slop inside the column
    paddingBottom: spacing.xl,
  },
  title: type.pageTitle,
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
  signUp: {
    alignSelf: "flex-start",
    marginTop: spacing.xxl,
  },
});
