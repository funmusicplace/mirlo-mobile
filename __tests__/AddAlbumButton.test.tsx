import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import AddAlbumButton from "@/components/AddAlbumButton";
import { createMockAlbum } from "@/__mocks__/mockAlbum";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({ user: null }),
}));

// Local strings, so a Transifex token in the env can't change them
jest.mock("react-i18next", () => {
  const en = jest.requireActual("@/translation/en.json");
  const t = (key: string) =>
    key.split(".").reduce((node, part) => node?.[part], en) ?? key;
  return { useTranslation: () => ({ t }) };
});

// Web order: no price, pledge, pre-order, zero price, the last four rows pin it
test.each<[string, Partial<AlbumProps>]>([
  ["Add to collection", { minPrice: null }],
  [
    "Back this project",
    { minPrice: 500, fundraiser: { isAllOrNothing: true } },
  ],
  ["Pre-order", { minPrice: 500, isPreorder: true }],
  ["Name your price", { minPrice: 0 }],
  ["Buy", { minPrice: 500 }],
  ["Add to collection", { minPrice: null, isPreorder: true }],
  [
    "Back this project",
    {
      minPrice: 0,
      isPreorder: true,
      fundraiser: { isAllOrNothing: true },
    },
  ],
  ["Pre-order", { minPrice: 0, isPreorder: true }],
  ["Name your price", { minPrice: 0, fundraiser: { isAllOrNothing: false } }],
])("the button reads %s for %j", (label, release) => {
  render(
    <AddAlbumButton
      trackGroup={createMockAlbum(release)}
      setModalVisible={jest.fn()}
    />,
  );

  expect(screen.getByText(label)).toBeTruthy();
  expect(screen.getByRole("button", { name: label })).toBeTruthy();
});

test("a signed-out user on a free release is sent to log in", () => {
  const setModalVisible = jest.fn();
  render(
    <AddAlbumButton
      trackGroup={createMockAlbum({ minPrice: 0 })}
      setModalVisible={setModalVisible}
    />,
  );

  fireEvent.press(screen.getByRole("button"));

  expect(mockPush).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith("/login");
  expect(setModalVisible).not.toHaveBeenCalled();
});

test("a release nobody can get has no add button", () => {
  render(
    <AddAlbumButton
      trackGroup={createMockAlbum({ isGettable: false })}
      setModalVisible={jest.fn()}
    />,
  );

  expect(screen.queryByRole("button")).toBeNull();
});
