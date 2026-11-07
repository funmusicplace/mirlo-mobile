import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "@/state/AuthContext";
import * as api from "../queries/fetch/fetchWrapper";
import Button from "@/components/Button";

type FavoriteTrackButtonProps = {
  track: {
    id: number;
    trackGroup?: { apiRoot?: string };
  };
};

export default function FavoriteTrackButton({
  track,
}: FavoriteTrackButtonProps) {
  const { user, refreshLoggedInUser } = useAuthContext();
  const { t } = useTranslation("translation");
  const [isInFavorites, setIsInFavorites] = useState(
    !!user?.trackFavorites?.find((w) => w.trackId === track.id),
  );

  useEffect(() => {
    setIsInFavorites(
      !!user?.trackFavorites?.find((w) => w.trackId === track.id),
    );
  }, [user, track.id]);

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

  // Another instance's track ids mean nothing to this user's favorites
  if (track.trackGroup?.apiRoot) return null;

  // Looks like WishlistButton: the web wishlists tracks and releases with one heart
  return (
    <Button
      variant="outlined"
      onlyIcon
      startIcon={<Ionicons name={isInFavorites ? "heart" : "heart-outline"} />}
      onPress={onPress}
      accessibilityLabel={
        isInFavorites
          ? t("wishlist.removeFromWishlist")
          : t("wishlist.addToWishlist")
      }
    />
  );
}
