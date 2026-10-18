import { useRouter } from "expo-router";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewProps,
} from "react-native";
import { useColors } from "@/constants/colors";

type TagPillProps = {
  tagName: string;
  onPress?: () => void;
};

// Pads the 26 pt chip to a 44 pt touch target without breaking the web gap
const HIT_SLOP = { top: 9, bottom: 9, left: 4, right: 4 };

export default function TagPill({ tagName, onPress }: TagPillProps) {
  const colors = useColors();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        onPress?.();
        router.push({ pathname: "/tags/[tag]", params: { tag: tagName } });
      }}
      accessibilityRole="link"
      hitSlop={HIT_SLOP}
      android_ripple={{ color: colors.tintX }}
      style={({ pressed }) => [
        styles.pill,
        {
          borderColor: colors.tintX,
          backgroundColor:
            pressed && Platform.OS === "ios" ? colors.tintX : colors.tint,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.accent }]}>{tagName}</Text>
    </Pressable>
  );
}

export function TagPillList({ style, ...props }: ViewProps) {
  return <View style={[styles.list, style]} {...props} />;
}

const styles = StyleSheet.create({
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    // Keeps the hit slop inside the parent, Android clips touches outside it
    paddingVertical: HIT_SLOP.top,
    marginVertical: 16 - HIT_SLOP.top,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 8,
    overflow: "hidden",
  },
  label: {
    fontSize: 12.8,
    lineHeight: 16,
  },
});
