import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { HeaderButton } from "@/components/ScreenHeader";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { radius, spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";

type DismissModalBarProps = {
  title?: string;
};

// Web Modal header: h2 title on the left, close button on the right
export default function DismissModalBar({ title }: DismissModalBarProps) {
  const router = useRouter();
  const colors = useColors();

  return (
    <View
      style={[
        styles.bar,
        title
          ? [styles.titled, { borderBottomColor: colors.border }]
          : styles.untitled,
      ]}
    >
      {title ? (
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      ) : null}
      <HeaderButton accessibilityLabel="Close" onPress={() => router.dismiss()}>
        <FontAwesome5 name="times" size={20} color={colors.text} />
      </HeaderButton>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    // The web pads the sheet top by --mi-border-radius-x
    paddingTop: radius.lg,
    paddingHorizontal: spacing.lg,
    // Also keeps the close button hit slop inside the bar for Android
    paddingBottom: spacing.sm,
  },
  titled: {
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  untitled: {
    justifyContent: "flex-end",
  },
  title: {
    ...type.heading,
    flexShrink: 1,
    maxWidth: "85%",
  },
});
