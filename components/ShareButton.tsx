import { Platform, Share } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useTranslation } from "react-i18next";
import Button from "@/components/Button";

type ShareButtonProps = {
  url: string;
};

export default function ShareButton({ url }: ShareButtonProps) {
  const { t } = useTranslation("translation");

  const onPress = async () => {
    try {
      // url is iOS only
      await Share.share(Platform.OS === "ios" ? { url } : { message: url });
    } catch (err) {
      console.error("issue sharing", err);
    }
  };

  return (
    <Button
      onlyIcon
      startIcon={<FontAwesome5 name="share-alt" size={14} solid />}
      onPress={onPress}
      accessibilityLabel={t("trackGroupEmbed.share")}
    />
  );
}
