import { Text } from "react-native";
import MarkdownDisplay, {
  openUrl,
  type MarkdownProps,
  type OnLinkPress,
  type RenderRules,
} from "@ronradtke/react-native-markdown-display";
import { useColorSchemeName } from "@/constants/colors";

// The library's Pressable links sit off the text baseline, nested Text keeps them inline
const rules: RenderRules = {
  link: (node, children, _parents, styles, onLinkPress) => (
    <Text
      key={node.key}
      accessibilityRole="link"
      style={styles.link}
      onPress={() => openUrl(node.attributes.href, onLinkPress as OnLinkPress)}
    >
      {children}
    </Text>
  ),
};

export default function Markdown(props: MarkdownProps) {
  return (
    <MarkdownDisplay
      rules={rules}
      colorScheme={useColorSchemeName()}
      {...props}
    />
  );
}
