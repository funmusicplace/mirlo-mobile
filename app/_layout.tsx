import { Stack, usePathname } from "expo-router";
import { SearchContextProvider } from "@/state/SearchContext";
import { PlayerContextProvider } from "@/state/PlayerContext";
import { AuthContextProvider } from "@/state/AuthContext";
import { QueryClientWrapper } from "@/queries/QueryClientWrapper";
import { DevToolsBubble } from "react-native-react-query-devtools";
import * as Clipboard from "expo-clipboard";
import { StatusBar } from "expo-status-bar";
import TrackPlayer from "react-native-track-player";
import * as SplashScreen from "expo-splash-screen";
import { AppReadyContextProvider } from "@/state/AppReadyContext";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import "../i18n";
import { checkForUpdates } from "../scripts/appVersionCheck";

SplashScreen.preventAutoHideAsync();

// Keep the home screen under deep-linked routes: it is what hides the splash
// once data loads, and Back then returns home instead of leaving the app
export const unstable_settings = { anchor: "index" };

SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

TrackPlayer.registerPlaybackService(() => require("../scripts/service"));

export default function RootLayout() {
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  // Needed for TanStack Query Devtools
  const onCopy = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    checkForUpdates();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      SplashScreen.hide();
    }
  }, [isDataLoaded]);

  return (
    <AppReadyContextProvider
      value={{ isDataLoaded: isDataLoaded, setIsDataLoaded: setIsDataLoaded }}
    >
      <QueryClientWrapper>
        <AuthContextProvider>
          <PlayerContextProvider>
            <SearchContextProvider>
              <Stack screenOptions={{ animation: "none" }}>
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen
                  name="index"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="collections"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="artist/[id]"
                  options={{
                    headerShown: false,
                    animation: "none",
                  }}
                />
                <Stack.Screen
                  name="now-playing"
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    animationDuration: 100,
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="search"
                  options={{
                    headerShown: false,
                    animation: "fade",
                    animationDuration: 300,
                    presentation: "transparentModal",
                  }}
                />
                <Stack.Screen
                  name="menu"
                  options={{
                    headerShown: false,
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />
                <Stack.Screen
                  name="deleteAccount"
                  options={{
                    headerShown: false,
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    animationDuration: 200,
                  }}
                />
                <Stack.Screen
                  name="tags/[tag]"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="mostPlayed"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="topSold"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="wishlist"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="maxPlaysReached"
                  options={{
                    headerShown: false,
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    animationDuration: 200,
                  }}
                />
                <Stack.Screen
                  name="emailPurchaseInfoModal"
                  options={{
                    headerShown: false,
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    animationDuration: 200,
                  }}
                />
                <Stack.Screen
                  name="addFreeAlbumModal"
                  options={{
                    headerShown: false,
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    animationDuration: 200,
                  }}
                />
                <Stack.Screen
                  name="emailVerificationModal"
                  options={{
                    headerShown: false,
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    animationDuration: 200,
                  }}
                />
              </Stack>
              <Footer />
              <StatusBar style="dark" backgroundColor="white" />
            </SearchContextProvider>
          </PlayerContextProvider>
        </AuthContextProvider>
        {/* <DevToolsBubble onCopy={onCopy} /> */}
      </QueryClientWrapper>
    </AppReadyContextProvider>
  );
}
