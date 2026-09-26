import LoginForm from "@/components/LoginForm";
import { View, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useColors } from "@/constants/colors";

export default function Login() {
  const colors = useColors();
  return (
    <SafeAreaView style={[styles.form, { backgroundColor: colors.background }]}>
      <View
        style={{
          flex: 1,
          backgroundColor: "#BE3455",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 10,
            width: "100%",
            height: 60,
            backgroundColor: colors.background,
          }}
        >
          <Pressable
            onPress={() => {
              if (router.canDismiss()) {
                router.dismiss();
              } else {
                router.dismissTo("/");
              }
            }}
          >
            <Ionicons
              name="chevron-back-outline"
              size={40}
              style={{ color: colors.inactive }}
            ></Ionicons>
          </Pressable>
        </View>
        <LoginForm />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
    justifyContent: "flex-start",
  },
});
