import DismissModalBar from "@/components/DismissModalBar";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as api from "../queries/fetch/fetchWrapper";
import { useState } from "react";
import { useAuthContext } from "@/state/AuthContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import Button from "@/components/Button";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";

export default function EmailPurchaseInfoModal() {
  const colors = useColors();
  const { trackGroupId, artist, trackGroupTitle } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);

  function sendPurchaseEmail() {
    try {
      if (user) {
        api.post(
          `/v1/trackGroups/${trackGroupId}/emailPurchaseLink?email=${user?.email}`,
          {},
        );
        setIsEmailSent(true);
      } else {
        console.log("missing user");
      }
    } catch (err) {
      console.error("issue emailing purchase info", err);
    }
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <DismissModalBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>Buy {trackGroupTitle} to:</Text>
        <View style={styles.list}>
          {[
            `Support ${artist}`,
            "Get unlimited streaming",
            "Get high quality downloads",
          ].map((text) => (
            <Text key={text} style={type.body}>
              • {text}
            </Text>
          ))}
        </View>

        {!user && (
          <Button
            title="Log In or Sign Up for Purchase Info!"
            accessibilityRole="link"
            onPress={() => router.push("/login")}
            fullWidth
            style={styles.action}
          />
        )}
        {user && (
          <Button
            title={isEmailSent ? "Email Sent!" : "Email Purchase Info"}
            startIcon={
              isEmailSent ? <Ionicons name="checkmark-sharp" /> : undefined
            }
            onPress={() => {
              sendPurchaseEmail();
            }}
            disabled={isEmailSent}
            fullWidth
            style={styles.action}
          />
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
  action: {
    marginTop: spacing.xl,
  },
});
