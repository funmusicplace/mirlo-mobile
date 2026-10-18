import * as api from "../queries/fetch/fetchWrapper";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePlayer } from "@/state/PlayerContext";
import { useColors } from "@/constants/colors";
import { useAuthContext } from "@/state/AuthContext";
import { useState } from "react";
import Button from "@/components/Button";
import DismissModalBar from "@/components/DismissModalBar";
import Text from "@/components/ThemedText";
import { spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";

export default function MaxPlaysReached() {
  const colors = useColors();
  const { activeTrack } = usePlayer();
  const { user } = useAuthContext();
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);

  function sendPurchaseEmail() {
    try {
      if (activeTrack && user) {
        api.post(
          `/v1/trackGroups/${activeTrack.trackGroup.id}/emailPurchaseLink?email=${user?.email}`,
          {},
        );
        setIsEmailSent(true);
      } else {
        console.log("Missing active track or user email");
      }
    } catch (err) {
      console.error("issue emailing purchase info", err);
    }
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <DismissModalBar
        title={`You are out of free plays for the track "${activeTrack?.title ?? ""}"`}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Buy this {activeTrack?.allowIndividualSale ? "track" : "album"} to:
        </Text>
        <View style={styles.list}>
          {[
            `Support ${activeTrack?.artist}`,
            "Get unlimited streaming",
            "Get high quality downloads",
          ].map((text) => (
            <Text key={text} style={type.body}>
              • {text}
            </Text>
          ))}
        </View>

        {!user && (
          <Text style={styles.callout}>
            Log In or Sign Up for Purchase Info!
          </Text>
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
  callout: {
    ...type.body,
    fontWeight: "600",
    marginTop: spacing.xl,
  },
  action: {
    marginTop: spacing.xl,
  },
});
