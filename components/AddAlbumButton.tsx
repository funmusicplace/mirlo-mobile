import { useAuthContext } from "@/state/AuthContext";
import { StyleSheet } from "react-native";
import { Router, useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { getLocales } from "expo-localization";
import Button from "@/components/Button";
import { spacing } from "@/constants/spacing";

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

// Same order as the web PurchaseAlbumModal
const purchaseLabel = (trackGroup: AlbumProps, t: TFunction) => {
  if (trackGroup.minPrice === null) return t("trackGroupCard.addToCollection");
  if (trackGroup.fundraiser?.isAllOrNothing)
    return t("trackGroupCard.backThisProject");
  if (trackGroup.isPreorder) return t("trackGroupCard.preOrder");
  return trackGroup.minPrice === 0
    ? t("trackGroupCard.nameYourPriceLabel")
    : t("trackGroupCard.buy");
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
        router.push("/login");
      } else {
        showModal("/emailPurchaseInfoModal", router, trackGroup);
      }
    }
  }, [setModalVisible, user, trackGroup, router]);
  // An absent flag keeps the button
  if (trackGroup.isGettable === false) return null;
  return ids && ids.includes(trackGroup.id) ? null : (
    <Button
      variant="outlined"
      rounded
      title={purchaseLabel(trackGroup, t)}
      onPress={onPress}
      style={styles.purchase}
    />
  );
}

const styles = StyleSheet.create({
  // Right edge like the web, wraps at large text sizes, clear of the cover
  purchase: {
    marginLeft: "auto",
    marginVertical: spacing.xs,
    flexShrink: 1,
  },
});
