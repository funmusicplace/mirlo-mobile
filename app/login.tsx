import LoginForm from "@/components/LoginForm";
import { ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader, { BackButton } from "@/components/ScreenHeader";
import { useColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";

export default function Login() {
  const colors = useColors();
  const { height } = useWindowDimensions();
  // The web login page pads its column by 10vh
  const paddingTop = height * 0.1;

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <ScreenHeader left={<BackButton />} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingTop }]}
      >
        <LoginForm />
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
});
