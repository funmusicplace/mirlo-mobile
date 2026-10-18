import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/state/AuthContext";
import * as api from "../queries/fetch/fetchWrapper";
import Button from "@/components/Button";

type WishlistButtonProps = {
  trackGroup: {
    id: number;
  };
};

export default function WishlistButton({ trackGroup }: WishlistButtonProps) {
  const { user, refreshLoggedInUser } = useAuthContext();
  const queryClient = useQueryClient();
  const [isInWishlist, setIsInWishlist] = useState(
    !!user?.wishlist?.find((w) => w.trackGroupId === trackGroup.id),
  );
  const router = useRouter();
  const { t } = useTranslation("translation");

  const onPress = useCallback(async () => {
    if (!user) {
      router.push({
        pathname: "/emailVerificationModal",
      });
      return null;
    }
    await api.post(`/v1/trackGroups/${trackGroup.id}/wishlist`, {
      wishlist: !isInWishlist,
    });
    setIsInWishlist((val) => !val);
    queryClient.invalidateQueries({
      queryKey: ["fetchWishlist", { userId: user.id }],
    });
    refreshLoggedInUser();
  }, [isInWishlist, trackGroup.id]);

  return (
    <Button
      variant="outlined"
      onlyIcon
      startIcon={<Ionicons name={isInWishlist ? "heart" : "heart-outline"} />}
      onPress={onPress}
      accessibilityLabel={
        isInWishlist
          ? t("wishlist.removeFromWishlist")
          : t("wishlist.addToWishlist")
      }
    />
  );
}
