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

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// The real icon sets state after its font loads, outside act
jest.mock("@expo/vector-icons/Ionicons", () => "Ionicons");

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
