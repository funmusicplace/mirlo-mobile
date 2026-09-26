import { View, Pressable, ViewProps } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/constants/colors";

export default function MenuButton({ style }: ViewProps) {
  const router = useRouter();
  const colors = useColors();
  return (
    <Pressable
      onPress={() => {
        router.push("/menu");
      }}
      accessibilityRole="button"
      accessibilityLabel="Menu button"
      accessibilityHint="Opens the menu page"
      style={style}
    >
      <Ionicons
        name="menu-outline"
        size={30}
        style={{ color: colors.inactive }}
      ></Ionicons>
    </Pressable>
  );
}
