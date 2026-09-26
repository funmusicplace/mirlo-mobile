import { forwardRef } from "react";
import { Text as RNText, TextProps } from "react-native";
import { useColors } from "@/constants/colors";

const ThemedText = forwardRef<RNText, TextProps>(function ThemedText(
  { style, ...props },
  ref,
) {
  const colors = useColors();
  return (
    <RNText ref={ref} style={[{ color: colors.text }, style]} {...props} />
  );
});

export default ThemedText;
