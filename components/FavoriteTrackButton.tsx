import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useState } from "react";
import { useAuthContext } from "@/state/AuthContext";
import { useTranslation } from "react-i18next";
import * as api from "../queries/fetch/fetchWrapper";
import { ViewProps } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/constants/colors";

type FavoriteTrackButton = {
  track: {
    id: number;
  };
  style?: ViewProps;
  size?: number;
};

export default function FavoriteTrackButton({
  track,
  style,
  size,
}: FavoriteTrackButton) {
  const { user, refreshLoggedInUser } = useAuthContext();
  const colors = useColors();
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
    <Pressable onPress={onPress} style={style}>
      <Ionicons
        name={isInFavorites ? "star" : "star-outline"}
        color={isInFavorites ? colors.accent : colors.inactive}
        size={size}
      />
    </Pressable>
  );
}
