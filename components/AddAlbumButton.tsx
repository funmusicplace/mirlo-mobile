import { useAuthContext } from "@/state/AuthContext";
import { Router, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getLocales } from "expo-localization";
import Button from "@/components/Button";

type AddAlbumButtonProps = {
  trackGroup: AlbumProps;
  setModalVisible: (modalVisible: boolean) => void;
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
      artistId: trackGroup.artistId,
      artist: trackGroup.artist.name,
    },
  });
};

export default function AddAlbumButton({
  trackGroup,
  setModalVisible,
}: AddAlbumButtonProps) {
  const { user } = useAuthContext();
  const router = useRouter();
  const { t } = useTranslation("translation");

  const ids: number[] | undefined = user?.userTrackGroupPurchases?.map(
    (purchase) => purchase.trackGroupId,
  );

  const onPress = useCallback(() => {
    const region = getAppStoreRegion();
    const isFree = trackGroup.minPrice === 0 || trackGroup.minPrice === null;

    // We can just add free albums without worrying about Apple purchase guidelines
    if (isFree) {
      if (user) {
        showModal("/addFreeAlbumModal", router, trackGroup);
      } else {
        router.push("/login");
      }
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
    <Button
      variant="outlined"
      onlyIcon
      // Ionicons pads the plus more than the heart
      startIcon={<Ionicons name="add" size={20} />}
      onPress={onPress}
      accessibilityLabel={t("trackGroupCard.addToCollection")}
    />
  );
}
