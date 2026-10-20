import { Platform } from "react-native";
import type { Edge } from "react-native-safe-area-context";

// The footer pads the bottom inset below every screen, and Android's
// SafeAreaView would add it again
export const screenEdges: readonly Edge[] =
  Platform.OS === "android"
    ? ["top", "right", "left"]
    : ["top", "right", "bottom", "left"];
