import DismissModalBar from "@/components/DismissModalBar";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import * as api from "../queries/fetch/fetchWrapper";
import { useState } from "react";
import { useAuthContext } from "@/state/AuthContext";
import { usePlayer } from "@/state/PlayerContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { mirloRed } from "@/constants/mirlo-red";
import { useColors } from "@/constants/colors";

export default function EmailPurchaseInfoModal() {
  const colors = useColors();
  const { trackGroupId, artist, trackGroupTitle } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const [isEmailSent, setIsEmailSent] = useState<Boolean>(false);

  function sendPurchaseEmail() {
    try {
      if (user) {
        api.post(
          `/v1/trackGroups/${trackGroupId}/emailPurchaseLink?email=${user?.email}`,
          {}
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
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <DismissModalBar />

      <View
        style={{
          flex: 1,
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 50,
          width: "100%",
          backgroundColor: mirloRed,
        }}
      >
        {!user && (
          <Pressable onPress={() => router.push("/login")}>
            <Text
              style={{
                fontSize: 20,
                color: "white",
                margin: 10,
                textAlign: "center",
                fontWeight: "bold",
                textDecorationLine: "underline",
              }}
            >
              Log In or Sign Up for Purchase Info!
            </Text>
          </Pressable>
        )}
        {user && !isEmailSent && (
          <Pressable
            onPress={() => {
              sendPurchaseEmail();
            }}
            style={{
              alignItems: "center",
              marginBottom: 10,
              backgroundColor: "white",
              borderRadius: 5,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                color: "black",
                margin: 10,
                textAlign: "center",
              }}
            >
              Email Purchase Info
            </Text>
          </Pressable>
        )}
        {user && isEmailSent && (
          <Pressable
            style={{
              alignItems: "center",
              marginBottom: 10,
              backgroundColor: "white",
              borderRadius: 5,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                color: "black",
                margin: 10,
                textAlign: "center",
              }}
            >
              Email Sent! ✅
            </Text>
          </Pressable>
        )}
        <Text
          style={{
            fontSize: 20,
            color: "white",
            alignSelf: "flex-start",
            marginTop: 20,
          }}
        >
          Buy {trackGroupTitle} to:
        </Text>
        <FlatList
          style={{ margin: 10 }}
          data={[
            { text: `Support ${artist}` },
            { text: "Get unlimited streaming" },
            { text: "Get high quality downloads" },
          ]}
          renderItem={({ item }) => (
            <Text style={{ color: "white", fontSize: 17, margin: 5 }}>
              • {item.text}
            </Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
});
