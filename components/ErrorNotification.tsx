import React, { useEffect } from "react";
import { AccessibilityInfo, View, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { gutter, radius, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

type ErrorNotificationProps = {
  onDismiss: () => void;
  visible: boolean;
  error: Error;
};

// Matches the web warning Box: 30% tinted surface with a 4 pt left rule
const ErrorNotification = ({
  onDismiss,
  visible = true,
  error,
}: ErrorNotificationProps) => {
  const colors = useColors();
  const { t } = useTranslation("translation");
  const offline = error.message === "Network request failed";
  const title = offline
    ? t("mobileApp.errorNotification.connectionIssue")
    : t("trackGroupCard.error");
  const message = offline
    ? t("mobileApp.errorNotification.unableToConnect")
    : error.message;

  // The role alone announces nothing when the box appears
  useEffect(() => {
    if (visible) {
      AccessibilityInfo.announceForAccessibility(`${title}, ${message}`);
    }
  }, [visible, title, message]);

  if (!visible) return null;

  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: colors.alert,
          borderLeftColor: colors.alertBorder,
        },
      ]}
    >
      {/* The alert is the text only, or iOS would swallow Dismiss */}
      <View accessible accessibilityRole="alert" style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={t("common.dismiss")}
        hitSlop={(touchTarget - 20) / 2}
        style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}
      >
        <FontAwesome5 name="times" size={16} color={colors.text} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginHorizontal: gutter,
    marginVertical: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderLeftWidth: 4,
  },
  content: {
    flex: 1,
  },
  title: {
    ...type.body,
    fontWeight: "600",
  },
  message: {
    ...type.small,
  },
  dismiss: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
});

export default ErrorNotification;
