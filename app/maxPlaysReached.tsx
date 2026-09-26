import * as api from "../queries/fetch/fetchWrapper";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { usePlayer } from "@/state/PlayerContext";
import { mirloRed } from "@/constants/mirlo-red";
import { useColors } from "@/constants/colors";
import { useAuthContext } from "@/state/AuthContext";
import { useState } from "react";

export default function MaxPlaysReached() {
  const colors = useColors();
  const router = useRouter();
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
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          height: 60,
          backgroundColor: colors.header,
        }}
      >
        <Pressable
          onPress={() => router.dismiss()}
          style={{
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
          }}
        >
          <Ionicons
            name="chevron-down-outline"
            size={40}
            style={{ color: colors.secondaryText }}
          ></Ionicons>
        </Pressable>
      </View>

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
        <Text style={{ fontSize: 20, color: "white" }}>
          You are out of free plays for the track
        </Text>
        <Text style={{ fontSize: 20, marginBottom: 20, color: "white" }}>
          "{activeTrack?.title}"
        </Text>

        {!user && (
          <Text
            style={{
              fontSize: 20,
              color: "white",
              margin: 10,
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Log In or Sign Up for Purchase Info!
          </Text>
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
        {/* {activeTrack?.allowIndividualSale ? (
            <Text
              style={{
                color: "white",
                fontSize: 20,
                margin: 10,
              }}
            >
              OR
            </Text>
          ) : null} */}

        {/* {activeTrack?.allowIndividualSale ? (
          <Pressable
            onPress={() =>
              Linking.openURL(
                `https://mirlo.space/${activeTrack?.trackGroup.artist.urlSlug}/release/${activeTrack?.trackGroup.urlSlug}/tracks/${activeTrack?.id}`
              )
            }
            style={{
              alignItems: "center",
              marginVertical: 10,
              backgroundColor: "white",
              borderRadius: 5,
            }}
          >
            <Text
              style={{
                color: "black",
                fontSize: 20,
                margin: 10,
                textAlign: "center",
              }}
            >
              Buy Track "{activeTrack?.title}"
            </Text>
          </Pressable>
        ) : null} */}

        <Text
          style={{
            fontSize: 20,
            color: "white",
            alignSelf: "flex-start",
            marginTop: 20,
          }}
        >
          Buy this {activeTrack?.allowIndividualSale ? "track" : "album"} to:
        </Text>
        <FlatList
          style={{ margin: 10 }}
          data={[
            { text: `Support ${activeTrack?.artist}` },
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
