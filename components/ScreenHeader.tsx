import { ReactNode } from "react";
import {
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { router } from "expo-router";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { gutter, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

// Web header height and icon button size (--mi-touch-target-min)
const HEIGHT = 50;
const BUTTON_SIZE = 30;

type ScreenHeaderProps = {
  left?: ReactNode;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function ScreenHeader({
  left,
  right,
  style,
}: ScreenHeaderProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.header,
        { backgroundColor: colors.header, borderBottomColor: colors.border },
        style,
      ]}
    >
      {/* Both groups always render so space-between keeps right on the right */}
      <View style={styles.group}>{left}</View>
      <View style={styles.group}>{right}</View>
    </View>
  );
}

type HeaderButtonProps = Omit<
  PressableProps,
  "style" | "hitSlop" | "children"
> & {
  size?: number;
  children: ReactNode;
};

export function HeaderButton({
  size = BUTTON_SIZE,
  children,
  ...props
}: HeaderButtonProps) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{
        color: colors.tintX,
        borderless: true,
        radius: touchTarget / 2,
      }}
      {...props}
      hitSlop={(touchTarget - size) / 2}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size },
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function BackButton() {
  const colors = useColors();
  return (
    <HeaderButton
      accessibilityLabel="Back"
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.dismissTo("/");
      }}
    >
      <FontAwesome5 name="chevron-left" size={20} color={colors.accent} solid />
    </HeaderButton>
  );
}

type SectionHeaderProps = {
  children: ReactNode;
  right?: ReactNode;
};

export function SectionHeader({ children, right }: SectionHeaderProps) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text
        accessibilityRole="header"
        style={[type.label, styles.sectionLabel, { color: colors.accent }]}
      >
        {children}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEIGHT,
    paddingHorizontal: gutter,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  group: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  // Android shows the ripple instead
  pressed: {
    opacity: Platform.OS === "android" ? 1 : 0.6,
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md + spacing.xxs,
    paddingBottom: spacing.sm + spacing.xxs,
    // Web section margin-bottom plus the grid's padding-top
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    flexShrink: 1,
  },
});
