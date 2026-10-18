import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  if (!visible) return null;

  const offline = error.message === "Network request failed";

  return (
    <SafeAreaView>
      <View
        accessibilityRole="alert"
        style={[
          styles.box,
          {
            backgroundColor: colors.alert,
            borderLeftColor: colors.alertBorder,
          },
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            {offline ? "Connection Issue" : error.name}
          </Text>
          <Text style={styles.message}>
            {offline
              ? "Unable to connect. Check your internet and try again."
              : error.message}
          </Text>
        </View>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={(touchTarget - 20) / 2}
          style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}
        >
          <FontAwesome5 name="times" size={16} color={colors.text} />
        </Pressable>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 11.2,
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
