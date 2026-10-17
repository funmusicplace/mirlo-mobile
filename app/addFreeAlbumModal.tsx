import DismissModalBar from "@/components/DismissModalBar";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mirloRed } from "@/constants/mirlo-red";
import { useColors } from "@/constants/colors";
import { usePlayer } from "@/state/PlayerContext";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import * as api from "../queries/fetch/fetchWrapper";
import { authRefresh } from "@/queries/authQueries";
import { useAuthContext } from "@/state/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

export default function AddFreeAlbumModal() {
  const colors = useColors();
  const { user, refreshLoggedInUser } = useAuthContext();
  const queryClient = useQueryClient();
  const { trackGroupTitle, trackGroupId } = useLocalSearchParams();
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [adding, setAdding] = useState(false);

  const getFreeAlbum = useCallback(async () => {
    try {
      if (!user) {
        return;
      }
      setAdding(true);
      const response = await api.post(
        `/v1/trackGroups/${trackGroupId}/purchase`,
        {
          price: 0,
        }
      );
      queryClient.invalidateQueries({
        queryKey: ["fetchUserPurchases", { userId: user.id }],
      });
      refreshLoggedInUser();
      setAdding(false);
      setIsAdded(true);
      console.log(response);
    } catch (err) {
      console.error("Issue purchasing free album", err);
    }
  }, [trackGroupId]);

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
        <Text
          style={{
            fontSize: 20,
            color: "white",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Add <Text style={{ fontWeight: "bold" }}>{trackGroupTitle}</Text> to
          your collection.
        </Text>
        <Text style={{ fontSize: 20, marginBottom: 20, color: "white" }}>
          You'll add this free album to your collection.
        </Text>
        <Pressable
          onPress={() => {
            if (!adding && !isAdded) {
              getFreeAlbum();
            } else {
              console.log("already processed");
              return;
            }
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
            {!isAdded ? "Add to Collection" : "Added! ✅"}
          </Text>
        </Pressable>
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
