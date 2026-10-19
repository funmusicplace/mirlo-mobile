import { Platform, Pressable, StyleSheet, View } from "react-native";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { radius, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

type FilterGroupProps<T extends string> = {
  legend: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

const BORDER_WIDTH = 1;
const PILL_HEIGHT = type.xsmall.lineHeight + 2 * (spacing.xs + BORDER_WIDTH);
const SLOP_Y = (touchTarget - PILL_HEIGHT) / 2;
// Pads the pill to a 44 pt touch target, half the gap at the sides keeps neighbors apart
const HIT_SLOP = {
  top: SLOP_Y,
  bottom: SLOP_Y,
  left: spacing.xs / 2,
  right: spacing.xs / 2,
};

// Web FilterGroup: radio pills in a wrapping row
export default function FilterGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
}: FilterGroupProps<T>) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={legend}
      style={styles.group}
    >
      {options.map((option) => {
        const checked = option.value === value;
        const fill = checked ? colors.tint : undefined;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked }}
            hitSlop={HIT_SLOP}
            android_ripple={{ color: colors.tintX }}
            style={({ pressed }) => [
              styles.pill,
              {
                borderColor: checked ? colors.accent : colors.tintX,
                backgroundColor:
                  pressed && Platform.OS === "ios" ? colors.tintX : fill,
              },
            ]}
          >
            <Text
              style={[
                type.xsmall,
                { color: checked ? colors.accent : colors.text },
                checked && styles.checked,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    // Keeps the hit slop inside the parent, Android clips touches outside it
    paddingVertical: SLOP_Y,
    // The title above sets the space over the pills, the web adds 1rem below them
    marginTop: -SLOP_Y,
    marginBottom: spacing.lg - SLOP_Y,
  },
  pill: {
    borderWidth: BORDER_WIDTH,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + spacing.xxs,
    overflow: "hidden",
  },
  checked: {
    fontWeight: "600",
  },
});
