import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "@/state/AuthContext";
import * as api from "../queries/fetch/fetchWrapper";
import { HeaderButton } from "@/components/ScreenHeader";
import { useColors } from "@/constants/colors";

// Web track row options button
const BUTTON_SIZE = 28;

type FavoriteTrackButtonProps = {
  track: {
    id: number;
  };
};

export default function FavoriteTrackButton({
  track,
}: FavoriteTrackButtonProps) {
  const { user, refreshLoggedInUser } = useAuthContext();
  const colors = useColors();
  const { t } = useTranslation("translation");
  const [isInFavorites, setIsInFavorites] = useState(
    !!user?.trackFavorites?.find((w) => w.trackId === track.id),
  );

  const onPress = useCallback(async () => {
    if (!user) return;

    await api.post(`/v1/tracks/${track.id}/favorite`, {
      favorite: !isInFavorites,
    });
    setIsInFavorites((val) => !val);
    refreshLoggedInUser();
  }, [user, isInFavorites, track.id, refreshLoggedInUser]);

  if (!user) {
    return null;
  }

  return (
    <HeaderButton
      size={BUTTON_SIZE}
      onPress={onPress}
      accessibilityLabel={
        isInFavorites
          ? t("wishlist.removeFromFavorites")
          : t("wishlist.addToFavorites")
      }
    >
      <Ionicons
        name={isInFavorites ? "star" : "star-outline"}
        color={colors.accent}
        size={16}
      />
    </HeaderButton>
  );
}
