import { useAuthContext } from "@/state/AuthContext";
import { Router, useRouter, Href } from "expo-router";
import { Pressable, ViewStyle, Modal } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback } from "react";
import { getLocales } from "expo-localization";
import * as Linking from "expo-linking";
import { useColors } from "@/constants/colors";

type AddAlbumButtonProps = {
  trackGroup: AlbumProps;
  setModalVisible: (modalVisible: boolean) => void;
  style?: ViewStyle;
  size?: number;
};

const getAppStoreRegion = () => {
  return getLocales()[0].regionCode;
};

const showModal = (
  modalPath: string,
  router: Router,
  trackGroup: AlbumProps,
) => {
  router.push({
    pathname: modalPath as any,
    params: {
      trackGroupTitle: trackGroup.title,
      trackGroupId: trackGroup.id,
      artist: trackGroup.artist.name,
    },
  });
};

export default function AddAlbumButton({
  style,
  size,
  trackGroup,
  setModalVisible,
}: AddAlbumButtonProps) {
  const { user } = useAuthContext();
  const router = useRouter();
  const colors = useColors();

  const ids: number[] | undefined = user?.userTrackGroupPurchases?.map(
    (purchase) => purchase.trackGroupId,
  );

  const onPress = useCallback(() => {
    const region = getAppStoreRegion();

    // We can just add free albums without worrying about Apple purchase guidelines
    if (user && (trackGroup.minPrice === 0 || trackGroup.minPrice === null)) {
      showModal("/addFreeAlbumModal", router, trackGroup);
      return;
    }

    // If in US, we can go directly to mirlo in a browser per Apple guidelines
    if (region === "US") {
      setModalVisible(true);
    } else {
      // If not in US, we need to follow the email flow to keep within Apple guidelines
      if (!user) {
        showModal("/emailVerificationModal", router, trackGroup);
      } else {
        showModal("/emailPurchaseInfoModal", router, trackGroup);
      }
    }
  }, [setModalVisible, user, trackGroup, router]);
  return ids && ids.includes(trackGroup.id) ? null : (
    <Pressable onPress={onPress} style={style}>
      <Ionicons name="add-circle-outline" size={size} color={colors.inactive} />
    </Pressable>
  );
}
