import { Pressable, Share, Platform } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";

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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("trackGroupEmbed.share")}
    >
      <Ionicons
        name={Platform.OS === "ios" ? "share-outline" : "share-social-outline"}
        size={30}
        color="#696969"
      />
    </Pressable>
  );
}
