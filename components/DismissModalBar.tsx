import { View, Pressable, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/constants/colors";

export default function DismissModalBar() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const colors = useColors();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        height: height * 0.08,
        backgroundColor: colors.header,
      }}
    >
      <Pressable
        onPress={() => router.dismiss()}
        style={{
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
        }}
      >
        <Ionicons
          name="chevron-down-outline"
          size={40}
          style={{ color: colors.secondaryText }}
        ></Ionicons>
      </Pressable>
    </View>
  );
}
