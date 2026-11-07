import React from "react";
import { Dimensions, StyleSheet, Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import ReadMore from "@/components/ReadMore";
import { type } from "@/constants/typography";

// Local strings, so a Transifex token in the env can't change them
jest.mock("react-i18next", () => {
  const en = jest.requireActual("@/translation/en.json");
  const t = (key: string) =>
    key.split(".").reduce((node, part) => node?.[part], en) ?? key;
  return { useTranslation: () => ({ t }) };
});

// Line heights grow with the text size setting
const cap = 4 * type.body.lineHeight * Dimensions.get("window").fontScale;

const renderReadMore = () =>
  render(
    <ReadMore
      color="#fff"
      moreKey="mobileApp.artistPage.readMore"
      lessKey="mobileApp.artistPage.showLess"
    >
      <Text>Announcement</Text>
    </ReadMore>,
  );

const layOut = (height: number) =>
  fireEvent(screen.getByTestId("read-more"), "contentSizeChange", 0, height);

const clip = () =>
  StyleSheet.flatten(screen.getByTestId("read-more").props.style);

test("content that fits the cap gets no toggle", () => {
  renderReadMore();
  expect(screen.queryByRole("button")).toBeNull();

  layOut(cap);
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByText("Announcement")).toBeTruthy();

  // Layout rounds text up to the pixel grid
  layOut(cap + 0.5);
  expect(screen.queryByRole("button")).toBeNull();

  layOut(cap + 2);
  expect(screen.getByRole("button", { name: "Read more" })).toBeTruthy();
});

test("longer content is cut at the cap until the toggle expands it", () => {
  renderReadMore();
  expect(clip()).toEqual({ maxHeight: cap });

  layOut(300);
  fireEvent.press(
    screen.getByRole("button", { name: "Read more", expanded: false }),
  );
  expect(
    screen.getByRole("button", { name: "Show less", expanded: true }),
  ).toBeTruthy();
  expect(clip()).toBeUndefined();

  fireEvent.press(screen.getByRole("button", { name: "Show less" }));
  expect(
    screen.getByRole("button", { name: "Read more", expanded: false }),
  ).toBeTruthy();
  expect(clip()).toEqual({ maxHeight: cap });
});

test("the toggle goes away when a new layout fits the cap", () => {
  renderReadMore();
  layOut(300);
  expect(screen.getByRole("button", { name: "Read more" })).toBeTruthy();

  layOut(cap - 1);
  expect(screen.queryByRole("button")).toBeNull();
});
