import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import AddAlbumButton from "@/components/AddAlbumButton";
import { createMockAlbum } from "@/__mocks__/mockAlbum";
import { createMockUser } from "@/__mocks__/mockUser";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

let mockUser: LoggedInUser | null = null;
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({ user: mockUser }),
}));

let mockRegion = "US";
jest.mock("expo-localization", () => ({
  getLocales: () => [{ regionCode: mockRegion }],
}));

// The real icon sets state after its font loads, outside act
jest.mock("@expo/vector-icons/Ionicons", () => "Ionicons");

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
      trackGroup={createMockAlbum({ minPrice: null })}
      setModalVisible={setModalVisible}
    />,
  );

  fireEvent.press(screen.getByRole("button"));

  expect(mockPush).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith("/login");
  expect(setModalVisible).not.toHaveBeenCalled();
});

describe("Name your price", () => {
  const modalParams = (release: AlbumProps) => ({
    trackGroupTitle: release.title,
    trackGroupId: release.id,
    artistId: release.artistId,
    artist: release.artist.name,
  });
  const press = (release: AlbumProps) => {
    const setModalVisible = jest.fn();
    render(
      <AddAlbumButton trackGroup={release} setModalVisible={setModalVisible} />,
    );
    fireEvent.press(screen.getByRole("button"));
    return setModalVisible;
  };
  const release = createMockAlbum({ minPrice: 0 });

  beforeEach(() => {
    mockPush.mockClear();
  });
  afterEach(() => {
    mockUser = null;
    mockRegion = "US";
  });

  test("opens the Purchase Info card in the US", () => {
    mockUser = createMockUser();

    const setModalVisible = press(release);

    expect(setModalVisible).toHaveBeenCalledWith(true);
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("starts the email flow outside the US", () => {
    mockUser = createMockUser();
    mockRegion = "DE";

    const setModalVisible = press(release);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/emailPurchaseInfoModal",
      params: modalParams(release),
    });
    expect(setModalVisible).not.toHaveBeenCalled();
  });

  test("sends a signed-out user outside the US to log in", () => {
    mockRegion = "DE";

    const setModalVisible = press(release);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/login");
    expect(setModalVisible).not.toHaveBeenCalled();
  });

  test("leaves a release without a price on the free dialog", () => {
    mockUser = createMockUser();
    const unpriced = createMockAlbum({ minPrice: null });

    const setModalVisible = press(unpriced);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/addFreeAlbumModal",
      params: modalParams(unpriced),
    });
    expect(setModalVisible).not.toHaveBeenCalled();
  });
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

describe("a release the user owns", () => {
  const owner = (trackGroupId: number) =>
    createMockUser({ userTrackGroupPurchases: [{ trackGroupId }] });

  beforeEach(() => {
    mockPush.mockClear();
  });
  afterEach(() => {
    mockUser = null;
  });

  test("offers its download, also when nobody can get it", () => {
    mockUser = owner(7);
    render(
      <AddAlbumButton
        trackGroup={createMockAlbum({
          id: 7,
          minPrice: 500,
          isGettable: false,
        })}
        setModalVisible={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
    expect(screen.queryByText("Buy")).toBeNull();
  });

  test("opens the download dialog for the release", () => {
    mockUser = owner(7);
    const trackGroup = createMockAlbum({ id: 7 });
    render(
      <AddAlbumButton trackGroup={trackGroup} setModalVisible={jest.fn()} />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Download" }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/downloadModal",
      params: {
        trackGroupId: 7,
        trackGroupTitle: trackGroup.title,
        artist: trackGroup.artist.name,
      },
    });
  });

  test("keeps a pre-order back until it ships", () => {
    mockUser = owner(7);
    render(
      <AddAlbumButton
        trackGroup={createMockAlbum({ id: 7, isPreorder: true })}
        setModalVisible={jest.fn()}
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
  });

  test("another release still shows its purchase button", () => {
    mockUser = owner(8);
    render(
      <AddAlbumButton
        trackGroup={createMockAlbum({ id: 7, minPrice: 500 })}
        setModalVisible={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Buy" })).toBeTruthy();
  });
});
