import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useColorSchemeName } from "@/constants/colors";
import { TURNSTILE_SITE_KEY } from "@/constants/turnstile";
import { openInBrowser } from "@/scripts/openInBrowser";

type TurnstileProps = {
  onToken: (token: string | null) => void;
};

// Turnstile has no native SDK. The page takes the site's origin because the
// key only works on its hostnames
export default function Turnstile({ onToken }: TurnstileProps) {
  const theme = useColorSchemeName();
  const html = `<!doctype html>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>
  function onToken(token) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ token }));
  }
  function onClear() {
    onToken(null);
  }
</script>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<body style="margin: 0; overflow: hidden">
  <div class="cf-turnstile" data-sitekey="${TURNSTILE_SITE_KEY}" data-theme="${theme}" data-callback="onToken" data-expired-callback="onClear" data-error-callback="onClear"></div>
</body>`;

  return (
    <WebView
      source={{ html, baseUrl: "https://mirlo.space" }}
      // The challenge runs in about:srcdoc frames, which the default list blocks
      originWhitelist={["*"]}
      onMessage={({ nativeEvent }) =>
        onToken(JSON.parse(nativeEvent.data).token)
      }
      // The widget's links would otherwise load in its place
      onOpenWindow={({ nativeEvent }) => openInBrowser(nativeEvent.targetUrl)}
      scrollEnabled={false}
      containerStyle={styles.container}
      style={styles.webView}
    />
  );
}

const styles = StyleSheet.create({
  // The widget's normal size
  container: {
    flex: 0,
    width: 300,
    height: 65,
  },
  webView: {
    backgroundColor: "transparent",
  },
});
