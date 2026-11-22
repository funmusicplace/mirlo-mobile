import { Text } from "react-native";
import MarkdownDisplay, {
  openUrl,
  type MarkdownProps,
  type OnLinkPress,
  type RenderRules,
} from "@ronradtke/react-native-markdown-display";
import { useColorSchemeName } from "@/constants/colors";
import { openInSystemBrowser } from "@/scripts/openInBrowser";

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

export default function Markdown({ onLinkPress, ...props }: MarkdownProps) {
  return (
    <MarkdownDisplay
      rules={rules}
      colorScheme={useColorSchemeName()}
      // Opens the link here, as the library's Linking.openURL fails silently without a browser
      onLinkPress={(url) => {
        if (!onLinkPress || onLinkPress(url)) openInSystemBrowser(url);
        return false;
      }}
      {...props}
    />
  );
}
