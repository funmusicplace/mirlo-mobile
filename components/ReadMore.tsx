import { type ReactNode, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Button from "@/components/Button";
import { spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";

// Layout rounds text up to the pixel grid, so exactly the cap can read over
const ROUNDING = 1;

type ReadMoreProps = {
  children: ReactNode;
  lines?: number;
  // Label color
  color: string;
  moreKey: string;
  lessKey: string;
};

// Cuts body text at a few lines until a toggle shows the rest. The content
// must not end in margin, or text of exactly the cap gets a toggle too
export default function ReadMore({
  children,
  lines = 4,
  color,
  moreKey,
  lessKey,
}: ReadMoreProps) {
  const { t } = useTranslation("translation");
  const { fontScale } = useWindowDimensions();
  const [height, setHeight] = useState(0);
  const [expanded, setExpanded] = useState(false);
  // Line heights follow the text size setting
  const cap = lines * type.body.lineHeight * fontScale;

  return (
    <View>
      {/* A View with maxHeight squeezes its text, so a measure inside it reads
          the cap. A ScrollView lays its content out in full, and the cap holds
          before the first layout too. It never scrolls by touch */}
      <ScrollView
        testID="read-more"
        scrollEnabled={false}
        scrollsToTop={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={!expanded && { maxHeight: cap }}
        onContentSizeChange={(_, contentHeight) => setHeight(contentHeight)}
      >
        {children}
      </ScrollView>
      {height > cap + ROUNDING ? (
        <Button
          variant="link"
          size="compact"
          title={t(expanded ? lessKey : moreKey)}
          textStyle={{ color }}
          style={styles.toggle}
          accessibilityState={{ expanded }}
          onPress={() => setExpanded(!expanded)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
  },
});
