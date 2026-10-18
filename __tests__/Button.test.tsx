import React from "react";
import { StyleSheet, Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import Button from "@/components/Button";
import { touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

test("text and icon buttons reach a 44 pt hit target", () => {
  const onPress = jest.fn();
  render(<Button title="Log in" onPress={onPress} />);
  const button = screen.getByRole("button", { name: "Log in" });
  const { paddingVertical } = StyleSheet.flatten(button.props.style);
  const { top, bottom } = button.props.hitSlop;
  expect(type.body.lineHeight + paddingVertical * 2 + top + bottom).toBe(
    touchTarget,
  );
  fireEvent.press(button);
  expect(onPress).toHaveBeenCalledTimes(1);

  render(
    <Button
      title="Share"
      onlyIcon
      startIcon={<Text>+</Text>}
      onPress={onPress}
    />,
  );
  const icon = screen.getByRole("button", { name: "Share" });
  const { width } = StyleSheet.flatten(icon.props.style);
  expect(width + icon.props.hitSlop.left * 2).toBe(touchTarget);
  expect(screen.queryByText("Share")).toBeNull();
});

test("loading keeps the label for width and blocks presses", () => {
  const onPress = jest.fn();
  render(<Button title="Log in" onPress={onPress} loading />);
  const button = screen.getByRole("button", { name: "Log in" });
  expect(button.props.accessibilityState).toEqual({
    disabled: true,
    busy: true,
  });
  expect(screen.getByText("Log in")).toBeTruthy();
  fireEvent.press(button);
  expect(onPress).not.toHaveBeenCalled();
});
