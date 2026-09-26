import type { ReactNode } from "react";
import { useState } from "react";
import type { Preview } from "@storybook/react-native-web-vite";
import { initialize, mswLoader } from "msw-storybook-addon";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppReadyContextProvider } from "@/state/AppReadyContext";
import { AuthContextProvider } from "@/state/AuthContext";
import { PlayerContextProvider } from "@/state/PlayerContext";
import { SearchContextProvider } from "@/state/SearchContext";
import { queryClient, QueryClientWrapper } from "@/queries/QueryClientWrapper";
import { defaultHandlers } from "./handlers";
import "../i18n";

initialize({ onUnhandledRequest: "warn" });

// Same providers as app/_layout.tsx
function Providers({ children }: { children: ReactNode }) {
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  return (
    <SafeAreaProvider>
      <AppReadyContextProvider value={{ isDataLoaded, setIsDataLoaded }}>
        <QueryClientWrapper>
          <AuthContextProvider>
            <PlayerContextProvider>
              <SearchContextProvider>{children}</SearchContextProvider>
            </PlayerContextProvider>
          </AuthContextProvider>
        </QueryClientWrapper>
      </AppReadyContextProvider>
    </SafeAreaProvider>
  );
}

// Singleton, so stories don't share cache
const clearQueryCache = async () => {
  queryClient.clear();
  return {};
};

const preview: Preview = {
  loaders: [clearQueryCache, mswLoader],
  decorators: [
    (Story) => (
      <Providers>
        <Story />
      </Providers>
    ),
  ],
  parameters: {
    msw: { handlers: defaultHandlers },
  },
  initialGlobals: {
    viewport: { value: "iphone14", isRotated: false },
  },
};

export default preview;
