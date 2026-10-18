import { cloneElement, isValidElement, ReactNode } from "react";
import {
  AccessibilityRole,
  ActivityIndicator,
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { useColors } from "@/constants/colors";
import { radius, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

export type ButtonProps = {
  title?: string;
  children?: ReactNode;
  onPress: (event: GestureResponderEvent) => void;
  variant?: "solid" | "outlined" | "link" | "transparent";
  size?: "default" | "compact" | "big";
  rounded?: boolean;
  onlyIcon?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
};

const BORDER_WIDTH = 1;
// --mi-touch-target-min, the web icon button size at phone width
const ICON_BUTTON_SIZE = 30;

// Web Button size steps, snapped to the spacing scale
const sizes = {
  default: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    text: type.body,
  },
  compact: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    text: type.caption,
  },
  big: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    text: { ...type.large, lineHeight: type.large.fontSize },
  },
};

export default function Button({
  title,
  children,
  onPress,
  variant = "solid",
  size = "default",
  rounded,
  onlyIcon,
  startIcon,
  endIcon,
  disabled,
  loading,
  fullWidth,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "button",
}: ButtonProps) {
  const colors = useColors();
  const { paddingVertical, paddingHorizontal, text } = sizes[size];
  const isSolid = variant === "solid";
  const isLink = variant === "link";
  const isOutlined = variant === "outlined";
  const inactive = !!disabled || !!loading;

  let color = disabled ? colors.disabled : colors.accent;
  if (isSolid) color = disabled ? colors.inactive : colors.buttonText;

  const visualHeight = onlyIcon
    ? ICON_BUTTON_SIZE
    : text.lineHeight +
      (isLink ? 0 : paddingVertical * 2) +
      (isOutlined ? BORDER_WIDTH * 2 : 0);
  const slopY = Math.max(0, (touchTarget - visualHeight) / 2);
  const slopX = onlyIcon ? (touchTarget - ICON_BUTTON_SIZE) / 2 : 0;

  // Icons take the label color and size, like the web's svg fill
  const icon = (node: ReactNode) =>
    isValidElement<{ color?: string; size?: number }>(node)
      ? cloneElement(node, {
          color: node.props.color ?? color,
          size: node.props.size ?? text.fontSize,
        })
      : node;

  const label = children ?? title;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      hitSlop={{ top: slopY, bottom: slopY, left: slopX, right: slopX }}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      android_ripple={{ color: colors.tintX }}
      style={({ pressed }) => [
        styles.base,
        !isLink && !onlyIcon && { paddingVertical, paddingHorizontal },
        isSolid && {
          backgroundColor: disabled ? colors.disabled : colors.button,
        },
        isOutlined && { borderWidth: BORDER_WIDTH, borderColor: color },
        rounded && styles.rounded,
        onlyIcon && styles.onlyIcon,
        fullWidth && styles.fullWidth,
        pressed && Platform.OS === "ios" && styles.pressed,
        style,
      ]}
    >
      <View style={[styles.content, loading && styles.hidden]}>
        {startIcon ? icon(startIcon) : null}
        {!onlyIcon && label != null ? (
          typeof label === "string" || typeof label === "number" ? (
            <Text
              style={[
                text,
                { color },
                !isSolid && !isLink && styles.bold,
                isLink ? styles.underline : styles.centered,
                textStyle,
              ]}
            >
              {label}
            </Text>
          ) : (
            label
          )
        ) : null}
        {endIcon ? icon(endIcon) : null}
      </View>
      {loading ? (
        <ActivityIndicator color={color} style={StyleSheet.absoluteFill} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  rounded: {
    borderRadius: radius.pill,
  },
  onlyIcon: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: radius.pill,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  pressed: {
    opacity: 0.6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  hidden: {
    opacity: 0,
  },
  bold: {
    fontWeight: "700",
  },
  underline: {
    textDecorationLine: "underline",
  },
  centered: {
    textAlign: "center",
  },
});
