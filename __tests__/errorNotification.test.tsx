import React from "react";
import { AccessibilityInfo } from "react-native";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import ErrorNotification from "@/components/ErrorNotification";

// Local strings, so a Transifex token in the env can't change them
jest.mock("react-i18next", () => {
  const en = jest.requireActual("@/translation/en.json");
  const t = (key: string) =>
    key.split(".").reduce((node, part) => node?.[part], en) ?? key;
  return { useTranslation: () => ({ t }) };
});

// The real icon set sets state after its font loads, outside act
jest.mock("@expo/vector-icons/FontAwesome5", () => "FontAwesome5");

const announce = AccessibilityInfo.announceForAccessibility as jest.Mock;
beforeEach(() => announce.mockClear());

// The one alert element's lines in reading order
const alertLines = () =>
  within(screen.getByRole("alert"))
    .getAllByText(/./)
    .map((text) => text.props.children);

test("an ordinary error is one alert of the title and the message, with Dismiss as its own button", () => {
  const onDismiss = jest.fn();
  render(
    <ErrorNotification
      visible
      error={new Error("Bad request")}
      onDismiss={onDismiss}
    />,
  );

  expect(alertLines()).toEqual(["Something went wrong", "Bad request"]);
  // An accessible parent would swallow Dismiss on iOS
  expect(within(screen.getByRole("alert")).queryByRole("button")).toBeNull();
  fireEvent.press(screen.getByRole("button", { name: "Dismiss" }));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test("a connection failure reads the connection title and text", () => {
  render(
    <ErrorNotification
      visible
      error={new Error("Network request failed")}
      onDismiss={jest.fn()}
    />,
  );

  expect(alertLines()).toEqual([
    "Connection Issue",
    "Unable to connect. Check your internet and try again.",
  ]);
});

test("the box announces its title and message once when it appears, and nothing while hidden", () => {
  const box = (visible: boolean) => (
    <ErrorNotification
      visible={visible}
      error={new Error("Bad request")}
      onDismiss={jest.fn()}
    />
  );
  const { rerender } = render(box(false));
  expect(announce).not.toHaveBeenCalled();

  rerender(box(true));
  expect(announce).toHaveBeenCalledTimes(1);
  expect(announce).toHaveBeenCalledWith("Something went wrong, Bad request");

  // Rendering the same words again is the same appearance
  rerender(box(true));
  expect(announce).toHaveBeenCalledTimes(1);
});
