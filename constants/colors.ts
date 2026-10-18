import { useColorScheme } from "react-native";
import { mirloRed } from "./mirlo-red";

// Light values are the mirlo.space CSS variables (--mi-*), dark values apply
// the web's dark tint logic (white overlays at 0.08, 0.18, 0.35) to #111.
// docs/design-language.md maps each key to its web variable
export const palette = {
  black: "#111111",
  white: "#ffffff",
  offWhite: "#f5f0f0",
  pink: mirloRed,
  neutral500: "#8b8083",
  red700: "#6e162d",
  warning: "#f2897a",
};

export const colors = {
  light: {
    background: palette.white,
    header: palette.white,
    muted: "#f0f0f0",
    border: "rgba(50, 0, 0, 0.2)",
    text: "#000000",
    secondaryText: "#454545",
    inactive: palette.neutral500,
    disabled: "#dddddd",
    accent: palette.pink,
    button: palette.pink,
    buttonText: palette.white,
    danger: palette.red700,
    alert: "#fbdcd7",
    alertBorder: palette.warning,
    playerBackground: palette.offWhite,
    playerForeground: palette.black,
    playerShadow: "rgba(17, 17, 17, 0.3)",
    tint: "rgba(50, 0, 0, 0.03)",
    tintX: "rgba(50, 0, 0, 0.2)",
    tintXX: "rgba(50, 0, 0, 0.2)",
    inputBackground: palette.white,
    inputText: "#000000",
    inputPlaceholder: "#757575",
    overlay: "rgba(0, 0, 0, 0.85)",
    scrim: "rgba(0, 0, 0, 0.5)",
  },
  dark: {
    background: palette.black,
    header: palette.black,
    muted: "#1f1e1e",
    border: "rgba(255, 255, 255, 0.18)",
    text: palette.offWhite,
    secondaryText: "#b7b4b4",
    inactive: palette.neutral500,
    disabled: "#2f2f2f",
    accent: "#e0607e",
    button: palette.pink,
    buttonText: palette.white,
    danger: palette.warning,
    alert: "#553531",
    alertBorder: palette.warning,
    playerBackground: palette.black,
    playerForeground: palette.offWhite,
    playerShadow: "rgba(245, 240, 240, 0.3)",
    tint: "rgba(255, 255, 255, 0.08)",
    tintX: "rgba(255, 255, 255, 0.18)",
    tintXX: "rgba(255, 255, 255, 0.35)",
    inputBackground: palette.black,
    inputText: palette.offWhite,
    inputPlaceholder: palette.neutral500,
    overlay: "rgba(0, 0, 0, 0.85)",
    scrim: "rgba(0, 0, 0, 0.5)",
  },
};

export function useColors() {
  return colors[useColorScheme() === "dark" ? "dark" : "light"];
}
