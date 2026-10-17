import { renderHook } from "@testing-library/react-native";
import * as ReactNative from "react-native";
import { useColors } from "@/constants/colors";

describe("useColors", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns light tokens by default", () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");

    const { result } = renderHook(() => useColors());

    expect(result.current.background).toBe("white");
    expect(result.current.text).toBe("black");
    expect(result.current.accent).toBe("#BE3455");
  });

  test("returns dark tokens when the system scheme is dark", () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");

    const { result } = renderHook(() => useColors());

    expect(result.current.background).toBe("#121212");
    expect(result.current.text).toBe("#f2f2f2");
    expect(result.current.accent).toBe("#E0607E");
  });

  test("falls back to light tokens for an unset scheme", () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("unspecified");

    const { result } = renderHook(() => useColors());

    expect(result.current.background).toBe("white");
  });
});
