import DismissModalBar from "@/components/DismissModalBar";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/constants/colors";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import * as api from "../queries/fetch/fetchWrapper";
import { useAuthContext } from "@/state/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Text from "@/components/ThemedText";
import { screenEdges } from "@/constants/safe-area";
import { spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";

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
        },
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
      setAdding(false);
    }
  }, [trackGroupId, user, queryClient, refreshLoggedInUser]);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <DismissModalBar
        title={`Add ${trackGroupTitle ?? ""} to your collection.`}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.body}>
          You'll add this free album to your collection.
        </Text>
        <Button
          title={!isAdded ? "Add to Collection" : "Added!"}
          startIcon={
            <Ionicons name={!isAdded ? "add-sharp" : "checkmark-sharp"} />
          }
          onPress={() => {
            if (!adding && !isAdded) {
              getFreeAlbum();
            } else {
              console.log("already processed");
              return;
            }
          }}
          disabled={isAdded}
          fullWidth
          style={styles.action}
        />
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
  action: {
    marginTop: spacing.xl,
  },
});
