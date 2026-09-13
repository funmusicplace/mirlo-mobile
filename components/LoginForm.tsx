import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  Pressable,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useLoginMutation } from "@/queries/authQueries";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { openInBrowser } from "@/scripts/openInBrowser";
import ErrorNotification from "./ErrorNotification";

type LoginInputs = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const {
    control,
    handleSubmit,
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

  const { mutate: login } = useLoginMutation();

  const handleBrowserOpen = async () => {
    await openInBrowser("https://mirlo.space/signup");
  };

  const onSubmit = async (data: LoginInputs) => {
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

  return (
    <View style={styles.container}>
      <Text
        style={{
          color: "white",
          fontWeight: "bold",
          fontSize: 20,
          marginTop: 20,
        }}
      >
        {t("logIn")}
      </Text>
      <View>
        <Text style={styles.formLabel}>{t("email")}</Text>
        <Controller
          control={control}
          rules={{ required: true }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.inputStyle}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              placeholderTextColor="#555"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
          name="email"
        />
        {errors.email && <Text>Email is required</Text>}

        <Text style={styles.formLabel}>{t("password")}</Text>
        <Controller
          control={control}
          rules={{ required: true }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.inputStyle}
              placeholderTextColor="#555"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry
            />
          )}
          name="password"
        />
        {errors.password && (
          <Text style={{ color: "white" }}>Password is required.</Text>
        )}
        {loginError && (
          <ErrorNotification
            visible={showError}
            onDismiss={() => setShowError(false)}
            error={loginError}
          />
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.text}>{t("logIn")}</Text>
        </TouchableOpacity>

        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
            marginTop: 30,
          }}
        >
          <Pressable onPress={handleBrowserOpen}>
            <Text style={{ color: "white", textDecorationLine: "underline" }}>
              {t("signUp")}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "flex-start",
    height: 50,
    flex: 1,
  },

  formLabel: {
    marginTop: 20,
    fontSize: 20,
    color: "#fff",
  },
  inputStyle: {
    marginTop: 5,
    width: 300,
    height: 40,
    paddingHorizontal: 10,
    backgroundColor: "white",
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
    paddingVertical: 5,
  },
});
