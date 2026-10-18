import { useAuthContext } from "@/state/AuthContext";
import * as api from "../queries/fetch/fetchWrapper";
import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  Pressable,
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mirloRed } from "@/constants/mirlo-red";
import { useRouter } from "expo-router";
import DismissModalBar from "@/components/DismissModalBar";
import { useTranslation } from "react-i18next";
import ErrorNotification from "@/components/ErrorNotification";
import { storeTokens } from "@/queries/authQueries";
import { useColors } from "@/constants/colors";

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
  const inputColors = {
    backgroundColor: colors.inputBackground,
    color: colors.inputText,
  };
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
      } finally {
        setIsLoading(false);
      }
    },
    [email, queryClient, router],
  );

  return !waitingForVerification ? (
    <SafeAreaView style={styles.container}>
      <DismissModalBar />
      {emailError && (
        <ErrorNotification
          visible={showError}
          onDismiss={() => setShowError(false)}
          error={emailError}
        />
      )}
      <View style={{ alignItems: "center", paddingTop: 20, flex: 1 }}>
        <Pressable onPress={() => router.push("/login")}>
          <Text
            style={{
              fontSize: 20,
              color: "white",
              margin: 10,
              textAlign: "center",
              textDecorationLine: "underline",
            }}
          >
            Login or Sign Up to View!
          </Text>
        </Pressable>
        <Text
          style={{
            fontWeight: "bold",
            color: "white",
            fontSize: 20,
            marginVertical: 20,
          }}
        >
          OR
        </Text>
        <Text style={styles.formLabel}>{t("email")}</Text>
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
              style={[styles.inputStyle, inputColors]}
              autoCapitalize="none"
              inputMode="email"
              //{...(Platform.OS === "android" && { autoComplete: "email" })}
              //{...(Platform.OS === "ios" && {
              //  textContentType: "emailAddress",
              //})}
              autoComplete="email"
              //keyboardType="email-address"
              placeholderTextColor={colors.inputPlaceholder}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
          name="email"
        />
        {emailErrors.email && (
          <Text style={{ color: "white" }}>
            Email is required {emailErrors.email.message}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.button]}
          disabled={isLoading}
          onPress={handleSubmitEmail(verifyEmail)}
        >
          <Text style={styles.text}>{tVerify("verifyEmail")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  ) : (
    <SafeAreaView style={styles.container}>
      <DismissModalBar />
      {codeError && (
        <ErrorNotification
          visible={showError}
          onDismiss={() => setShowError(false)}
          error={codeError}
        />
      )}
      <View style={{ paddingTop: 20, alignItems: "center" }}>
        <Text style={{ color: "white", fontSize: 20, marginBottom: 20 }}>
          {tVerify("checkEmail")}
        </Text>
        <Text style={styles.formLabel}>{tVerify("verificationCode")}</Text>
        <Controller
          key="code-controller"
          control={controlCode}
          rules={{ required: true }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              key="verification-code-input"
              style={[styles.inputStyle, inputColors]}
              placeholderTextColor={colors.inputPlaceholder}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
          name="code"
        />
        {codeErrors.code && (
          <Text style={{ color: "white" }}>Verification Code is required</Text>
        )}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmitCode(verifyCode)}
          disabled={isLoading}
        >
          <Text style={styles.text}>{tVerify("verifyEmailCode")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: mirloRed,
    alignItems: "center",
    justifyContent: "flex-start",
    height: 50,
    flex: 1,
  },

  formLabel: {
    fontSize: 20,
    color: "#fff",
  },
  inputStyle: {
    marginTop: 5,
    width: 300,
    height: 40,
    paddingHorizontal: 10,
  },
  formText: {
    alignItems: "center",
    justifyContent: "center",
    color: "#aaa",
    fontSize: 20,
  },
  text: {
    color: "#000",
    fontSize: 20,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    backgroundColor: "#FFF",
    padding: 5,
    paddingHorizontal: 10,
    width: 300,
  },
});
