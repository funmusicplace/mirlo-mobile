import { TextStyle } from "react-native";

// Loaded in app/_layout.tsx, the web uses Cubano for the splash and section titles
export const fonts = {
  display: "CubanoSharp",
};

// Web type scale at phone width, body text stays on the system font
export const type = {
  display: { fontFamily: fonts.display, fontSize: 28, lineHeight: 35 },
  pageTitle: { fontSize: 32, lineHeight: 40 },
  title: { fontSize: 24, lineHeight: 26.4, fontWeight: "600" },
  heading: { fontSize: 20.8, lineHeight: 28.8 },
  label: { fontSize: 16, lineHeight: 16, textTransform: "uppercase" },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 21 },
  caption: { fontSize: 12.8, lineHeight: 19.2 },
  xsmall: { fontSize: 12, lineHeight: 16 },
  cardTitle: { fontSize: 14, lineHeight: 19.25 },
  cardMeta: { fontSize: 12, lineHeight: 18 },
} satisfies Record<string, TextStyle>;
