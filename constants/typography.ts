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
  chip: { fontSize: 12.8, lineHeight: 16 },
  formLabel: { fontSize: 17.6, lineHeight: 26.4, fontWeight: "600" },
  large: { fontSize: 19.2, lineHeight: 22.4 },
  listItem: { fontSize: 15.2, lineHeight: 24 },
} satisfies Record<string, TextStyle>;

// Web Markdown headings at phone width, with line heights so they don't inherit the body's
export const markdownHeadings = {
  heading1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
    marginBottom: 8,
  },
  heading2: {
    fontSize: 22.4,
    lineHeight: 28.8,
    fontWeight: "700",
    marginBottom: 8,
  },
  heading3: { fontSize: 19.2, lineHeight: 24, marginBottom: 16 },
  heading4: {
    fontSize: 20.8,
    lineHeight: 26,
    fontWeight: "700",
    marginBottom: 12,
  },
  heading5: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  heading6: {
    fontSize: 17.6,
    lineHeight: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
} satisfies Record<string, TextStyle>;
