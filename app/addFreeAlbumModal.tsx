import DismissModalBar from "@/components/DismissModalBar";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/constants/colors";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import * as api from "../queries/fetch/fetchWrapper";
import { useAuthContext } from "@/state/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Text from "@/components/ThemedText";
import { screenEdges } from "@/constants/safe-area";
import { spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";

type PurchaseBody = {
  artistId: number;
  items: { type: "trackGroup"; id: number; price: string }[];
  deferred: true;
};

type PurchaseResponse = {
  redirectUrl?: string;
  success?: boolean;
  deferred?: unknown;
};

export default function AddFreeAlbumModal() {
  const colors = useColors();
  const { t } = useTranslation("translation");
  const { user, refreshLoggedInUser } = useAuthContext();
  const queryClient = useQueryClient();
  const { trackGroupTitle, trackGroupId, artistId } = useLocalSearchParams();
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [adding, setAdding] = useState(false);
  const [failed, setFailed] = useState(false);

  const getFreeAlbum = useCallback(async () => {
    try {
      if (!user) {
        return;
      }
      setAdding(true);
      setFailed(false);
      const response = await api.post<PurchaseBody, PurchaseResponse>(
        "/v1/purchase",
        {
          artistId: Number(artistId),
          items: [{ type: "trackGroup", id: Number(trackGroupId), price: "0" }],
          deferred: true,
        },
      );
      // A deferred quote means the release is not free
      if (!response.redirectUrl && !response.success) {
        throw new Error("Unexpected purchase response");
      }
      queryClient.invalidateQueries({
        queryKey: ["fetchUserPurchases", { userId: user.id }],
      });
      refreshLoggedInUser();
      setIsAdded(true);
    } catch (err) {
      console.error("Issue purchasing free album", err);
      setFailed(true);
    } finally {
      setAdding(false);
    }
  }, [artistId, trackGroupId, user, queryClient, refreshLoggedInUser]);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <DismissModalBar
        title={t("trackGroupCard.addAlbumToCollection", {
          title: trackGroupTitle ?? "",
        })}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.body}>
          {t("trackGroupCard.addToCollectionDescription")}
        </Text>
        <Button
          title={
            !isAdded
              ? t("trackGroupCard.addToCollection")
              : t("trackGroupCard.added")
          }
          startIcon={
            <Ionicons name={!isAdded ? "add-sharp" : "checkmark-sharp"} />
          }
          onPress={() => {
            if (!adding && !isAdded) {
              getFreeAlbum();
            }
          }}
          disabled={isAdded}
          loading={adding}
          fullWidth
          style={styles.action}
        />
        {failed ? (
          <Text
            accessibilityRole="alert"
            style={[type.body, styles.error, { color: colors.danger }]}
          >
            {t("trackGroupCard.error")}
          </Text>
        ) : null}
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
  error: {
    marginTop: spacing.md,
  },
});
