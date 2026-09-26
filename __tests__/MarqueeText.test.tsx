/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { render } from "@testing-library/react-native";
import MarqueeText from "@/components/MarqueeText";

// No native Worklets module under jest
jest.mock("react-native-worklets", () =>
  require("react-native-worklets/src/mock"),
);

jest.mock("react-native-reanimated", () => {
  const actual = require("react-native-reanimated/mock");
  return { ...actual, useReducedMotion: () => true };
});

describe("<MarqueeText />", () => {
  test("renders the full text", () => {
    const { getByText } = render(
      <MarqueeText style={{ fontWeight: "bold" }}>
        A very long track title that would normally be truncated
      </MarqueeText>,
    );

    expect(
      getByText("A very long track title that would normally be truncated"),
    ).toBeTruthy();
  });
});
