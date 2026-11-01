import { renderHook } from "@testing-library/react-native";
import * as ReactNative from "react-native";
import { colors, useColors } from "@/constants/colors";

type Rgb = [number, number, number];

// Flattens "#rrggbb" or "rgba(r, g, b, a)" onto an opaque background
function rgb(color: string, over: Rgb = [255, 255, 255]): Rgb {
  if (color.startsWith("#")) {
    return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)) as Rgb;
  }
  const [r, g, b, a = 1] = color.match(/\d+(\.\d+)?/g)!.map(Number);
  return [r, g, b].map((v, i) => Math.round(v * a + over[i] * (1 - a))) as Rgb;
}

// WCAG 2.x relative luminance and contrast ratio
function luminance([r, g, b]: Rgb) {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function contrast(fg: string, bg: string, page: Rgb) {
  const back = rgb(bg, page);
  const [a, b] = [luminance(rgb(fg, back)), luminance(back)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe.each(["light", "dark"] as const)("%s theme contrast", (scheme) => {
  const c = colors[scheme];
  const page = rgb(c.background);
  const atLeast = (ratio: number, pairs: [string, string][]) =>
    pairs.forEach(([fg, bg]) =>
      expect(contrast(fg, bg, page)).toBeGreaterThanOrEqual(ratio),
    );

  test("text reaches 4.5:1 (WCAG AA)", () => {
    atLeast(4.5, [
      [c.text, c.background],
      [c.secondaryText, c.background],
      [c.accent, c.background],
      [c.accent, c.playerBackground],
      [c.danger, c.background],
      [c.inputPlaceholder, c.inputBackground],
      [c.buttonText, c.button],
      [c.text, c.alert],
      [c.coverChipText, c.coverChip],
    ]);
  });

  test("icons, tracks and borders that carry meaning reach 3:1", () => {
    atLeast(3, [
      [c.inactive, c.background],
      [c.inactive, c.playerBackground],
      [c.track, c.background],
      [c.accent, c.disabled],
    ]);
  });
});

describe("useColors", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns light tokens by default", () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");

    const { result } = renderHook(() => useColors());

    expect(result.current.background).toBe("#ffffff");
    expect(result.current.text).toBe("#000000");
    expect(result.current.accent).toBe("#BE3455");
  });

  test("returns dark tokens when the system scheme is dark", () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");

    const { result } = renderHook(() => useColors());

    expect(result.current.background).toBe("#111111");
    expect(result.current.text).toBe("#f5f0f0");
    expect(result.current.accent).toBe("#e0607e");
  });

  test("falls back to light tokens for an unset scheme", () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("unspecified");

    const { result } = renderHook(() => useColors());

    expect(result.current.background).toBe("#ffffff");
  });
});
