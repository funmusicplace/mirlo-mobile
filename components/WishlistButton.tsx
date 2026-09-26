import { Pressable, Text, View, ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useState } from "react";
import { useAuthContext } from "@/state/AuthContext";
import { useTranslation } from "react-i18next";
import * as api from "../queries/fetch/fetchWrapper";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useColors } from "@/constants/colors";

type WishlistButton = {
  trackGroup: {
    id: number;
  };
  style?: ViewStyle;
  size?: number;
};

export default function WishlistButton({
  trackGroup,
  style,
  size,
}: WishlistButton) {
  const { user, refreshLoggedInUser } = useAuthContext();
  const queryClient = useQueryClient();
  const [isInWishlist, setIsInWishlist] = useState(
    !!user?.wishlist?.find((w) => w.trackGroupId === trackGroup.id)
  );
  const router = useRouter();
  const colors = useColors();

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
    <Pressable onPress={onPress} style={style}>
      <Ionicons
        name={isInWishlist ? "heart" : "heart-outline"}
        color={isInWishlist ? colors.accent : colors.inactive}
        size={size}
      />
    </Pressable>
  );
}
