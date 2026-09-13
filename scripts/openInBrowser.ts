import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

// Opens a web page in an in-app browser sheet. On Android the Custom Tab intent
// has to name a browser: an implicit VIEW intent for a mirlo.space URL resolves
// to this app (it handles that domain) and loops
export async function openInBrowser(url: string) {
  let browserPackage: string | undefined;
  if (Platform.OS === "android") {
    const b = await WebBrowser.getCustomTabsSupportingBrowsersAsync();
    browserPackage =
      b.preferredBrowserPackage ??
      b.defaultBrowserPackage ??
      b.browserPackages[0];
    if (!browserPackage) return;
  }
  await WebBrowser.openBrowserAsync(url, { browserPackage });
}
