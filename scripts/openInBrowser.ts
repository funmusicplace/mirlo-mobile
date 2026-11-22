import * as WebBrowser from "expo-web-browser";
import { Alert, Linking, Platform } from "react-native";
// The instance i18n.ts configures, @/i18n breaks tests that mock react-i18next
import i18n from "i18next";

// Opens a web page in an in-app browser sheet. On Android the Custom Tab intent
// has to name a browser: an implicit VIEW intent for a mirlo.space URL resolves
// to this app (it handles that domain) and loops. Resolves false after Android
// alerts that the page couldn't open
export async function openInBrowser(url: string) {
  try {
    let browserPackage: string | undefined;
    if (Platform.OS === "android") {
      const b = await WebBrowser.getCustomTabsSupportingBrowsersAsync();
      browserPackage =
        b.preferredBrowserPackage ??
        b.defaultBrowserPackage ??
        b.browserPackages[0];
      if (!browserPackage) {
        showNoBrowserAlert();
        return false;
      }
    }
    await WebBrowser.openBrowserAsync(url, { browserPackage });
    return true;
  } catch (e) {
    if (Platform.OS !== "android") throw e;
    console.error(e);
    showAlert();
    return false;
  }
}

// No caller catches, so Android reports a failure here instead of throwing
function showAlert(message?: string) {
  Alert.alert(
    i18n.t("mobileApp.browser.title"),
    message,
    [{ text: i18n.t("common.close") }],
    { cancelable: true },
  );
}

function showNoBrowserAlert() {
  showAlert(i18n.t("mobileApp.browser.message"));
}

// A link the app can't show goes to the browser, where the user is logged in.
// iOS hands a universal link for this app's own domain to Safari instead of
// looping back. Android would resolve it to this app, so it gets a Custom Tab
export function openOnWeb(url: string) {
  return Platform.OS === "ios" ? Linking.openURL(url) : openInBrowser(url);
}

// A link that goes to the system browser. Only a web link needs a browser, so
// other schemes such as mailto: keep rejecting
export function openInSystemBrowser(url: string) {
  return Linking.openURL(url).catch((e) => {
    if (Platform.OS !== "android" || !url.startsWith("http")) throw e;
    console.error(e);
    showNoBrowserAlert();
  });
}
