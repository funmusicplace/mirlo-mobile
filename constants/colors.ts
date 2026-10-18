import { useColorScheme } from "react-native";
import { mirloRed } from "./mirlo-red";

export const colors = {
  light: {
    background: "white",
    header: "#fafafa",
    muted: "#f0f0f0",
    border: "#e8e9eb",
    text: "black",
    secondaryText: "#696969",
    inactive: "#ababab",
    accent: mirloRed,
    danger: "red",
    alert: "#fff7f8",
    alertBorder: "#f0d3d9",
    tint: "rgba(50, 0, 0, 0.03)",
    tintX: "rgba(50, 0, 0, 0.2)",
    tintXX: "rgba(50, 0, 0, 0.2)",
    inputBackground: "#ffffff",
    inputText: "#111111",
    inputPlaceholder: "#757575",
  },
  dark: {
    background: "#121212",
    header: "#1c1c1e",
    muted: "#2c2c2e",
    border: "#38383a",
    text: "#f2f2f2",
    secondaryText: "#a0a0a0",
    inactive: "#8e8e93",
    accent: "#E0607E",
    danger: "#ff6b6b",
    alert: "#2a1d21",
    alertBorder: "#4a2c35",
    tint: "rgba(255, 255, 255, 0.08)",
    tintX: "rgba(255, 255, 255, 0.18)",
    tintXX: "rgba(255, 255, 255, 0.35)",
    inputBackground: "#ffffff",
    inputText: "#111111",
    inputPlaceholder: "#757575",
  },
};

export function useColors() {
  return colors[useColorScheme() === "dark" ? "dark" : "light"];
}
