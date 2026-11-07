import { StyleProp, ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Button from "@/components/Button";

type DownloadButtonProps = {
  trackGroup: AlbumProps;
  onlyIcon?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Opens the download dialog for a release the user owns
export default function DownloadButton({
  trackGroup,
  onlyIcon,
  style,
}: DownloadButtonProps) {
  const router = useRouter();
  const { t } = useTranslation("translation");

  // The web keeps a pre-order's files back until it ships
  if (trackGroup.isPreorder) return null;

  return (
    <Button
      variant="outlined"
      rounded
      onlyIcon={onlyIcon}
      title={t("trackGroupCard.download")}
      startIcon={<Ionicons name="download-outline" />}
      onPress={() =>
        router.push({
          pathname: "/downloadModal",
          params: {
            trackGroupId: trackGroup.id,
            trackGroupTitle: trackGroup.title,
            artist: trackGroup.artist.name,
          },
        })
      }
      style={style}
    />
  );
}
