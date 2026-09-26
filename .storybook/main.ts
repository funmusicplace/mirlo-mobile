import type { StorybookConfig } from "@storybook/react-native-web-vite";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mergeConfig } from "vite";

// ESM, no __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  framework: "@storybook/react-native-web-vite",
  stories: ["../components/**/*.stories.tsx", "../stories/**/*.stories.tsx"],
  staticDirs: ["./public"],
  async viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      resolve: {
        alias: {
          "react-native-track-player": join(
            __dirname,
            "mocks/react-native-track-player.ts",
          ),
          "@preeternal/react-native-cookie-manager": join(
            __dirname,
            "mocks/react-native-cookie-manager.ts",
          ),
          "expo-secure-store": join(__dirname, "mocks/expo-secure-store.ts"),
          "expo-router": join(__dirname, "mocks/expo-router.tsx"),
        },
      },
      define: {
        // relative API calls, for MSW
        "process.env.EXPO_PUBLIC_API_ROOT": JSON.stringify(""),
        "process.env.EXPO_PUBLIC_API_KEY": JSON.stringify(""),
        "process.env.EXPO_PUBLIC_TRANSIFEX_TOKEN": JSON.stringify(""),
      },
    });
  },
};

export default config;
