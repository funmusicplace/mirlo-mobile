import React from "react";
import { ActivityIndicator, FlatList, Image } from "react-native";
import {
  act,
  fireEvent,
  isHiddenFromAccessibility,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import ArtistTile from "@/components/ArtistTile";
import ArtistPage from "@/app/artist/[id]/artist-page";
import { createMockAlbum } from "@/__mocks__/mockAlbum";
import { createMockArtist } from "@/__mocks__/mockArtist";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useRouter: () => ({ push: jest.fn() }),
  useLocalSearchParams: () => ({ id: "label" }),
}));

let mockArtist: Artist;
let mockLabel: {
  data?: { results: AlbumProps[] };
  isPending: boolean;
  isError: boolean;
};
jest.mock("@tanstack/react-query", () => ({
  useQuery: (options: { queryKey: string[] }) =>
    options.queryKey[0] === "fetchLabelTrackGroups"
      ? mockLabel
      : { data: mockArtist, isPending: false, isError: false },
}));
jest.mock("@/queries/queries", () => ({
  queryArtist: () => ({ queryKey: ["fetchArtist"], enabled: true }),
  queryLabelTrackGroups: () => ({
    queryKey: ["fetchLabelTrackGroups"],
    enabled: true,
  }),
}));
jest.mock("@/state/InstancesContext", () => ({
  useKnownApiRoot: () => ({ apiRoot: undefined, ready: true, unknown: false }),
}));
jest.mock("@/state/AuthContext", () => ({
  useAuthContext: () => ({ user: null }),
}));
jest.mock("@/scripts/openInBrowser", () => ({ openOnWeb: jest.fn() }));
// The library ships untranspiled JSX, and these artists have no text for it
jest.mock("@/components/Markdown", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: jest.requireActual("react-native").View,
}));

// Local strings, so a Transifex token in the env can't change them
jest.mock("react-i18next", () => {
  const en = jest.requireActual("@/translation/en.json");
  const t = (key: string) =>
    key.split(".").reduce((node, part) => node?.[part], en) ?? key;
  return { useTranslation: () => ({ t, i18n: { language: "en" } }) };
});

// The real icon sets state after their font loads, outside act
jest.mock("@expo/vector-icons/Ionicons", () => "Ionicons");
jest.mock("@expo/vector-icons/FontAwesome5", () => "FontAwesome5");

const withCover = (id: number) =>
  ({
    id,
    cover: { sizes: { 300: `https://example.com/cover-${id}.jpg` } },
  }) as AlbumProps;
const image = (url: string) => ({ url, updatedAt: "", sizes: {} });
const artistWith = (overrides?: Partial<Artist>) =>
  createMockArtist({
    id: 7,
    name: "Joni Void",
    urlSlug: "joni-void",
    avatar: undefined,
    ...overrides,
  });
const sources = () =>
  screen.UNSAFE_getAllByType(Image).map((node) => node.props.source.uri);

beforeEach(() => jest.clearAllMocks());

describe("ArtistTile", () => {
  test("is one link named after the artist, to the artist page", () => {
    render(
      <ArtistTile
        artist={artistWith()}
        width={180}
        apiRoot="https://other.example"
      />,
    );
    expect(screen.getByText("Joni Void")).toBeTruthy();
    fireEvent.press(screen.getByRole("link", { name: "Joni Void" }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/artist/[id]/artist-page",
      params: { id: "joni-void", apiRoot: "https://other.example" },
    });
  });

  test("shows the avatar, else the background, else the covers", () => {
    const artist = artistWith({
      trackGroups: [withCover(1)],
      avatar: {
        ...image(""),
        sizes: { 300: "https://example.com/avatar.jpg" },
      },
      background: {
        ...image(""),
        sizes: { 625: "https://example.com/bg.jpg" },
      },
    });
    const { rerender } = render(<ArtistTile artist={artist} width={180} />);
    expect(sources()).toEqual(["https://example.com/avatar.jpg"]);

    rerender(
      <ArtistTile artist={{ ...artist, avatar: undefined }} width={180} />,
    );
    expect(sources()).toEqual(["https://example.com/bg.jpg"]);

    rerender(
      <ArtistTile
        artist={{ ...artist, avatar: undefined, background: undefined }}
        width={180}
      />,
    );
    expect(sources()).toEqual(["https://example.com/cover-1.jpg"]);
  });

  test("the cover composite holds up to four covers and none is an empty square", () => {
    const tile = (covers: number) => (
      <ArtistTile
        artist={artistWith({
          trackGroups: Array.from({ length: covers }, (_, i) =>
            withCover(i + 1),
          ),
        })}
        width={180}
      />
    );
    const { rerender } = render(tile(0));
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
    expect(screen.getByRole("link", { name: "Joni Void" })).toBeTruthy();

    for (const [covers, shown] of [
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
      [6, 4],
    ]) {
      rerender(tile(covers));
      expect(sources()).toEqual(
        Array.from(
          { length: shown },
          (_, i) => `https://example.com/cover-${i + 1}.jpg`,
        ),
      );
    }
  });

  test("the images stay out of the screen reader", () => {
    render(
      <ArtistTile
        artist={artistWith({
          trackGroups: [withCover(1), withCover(2)],
        })}
        width={180}
      />,
    );
    for (const node of screen.UNSAFE_getAllByType(Image)) {
      expect(isHiddenFromAccessibility(node)).toBe(true);
    }
  });
});

describe("artist page tabs", () => {
  const rosterEntry = (artist: Artist): ArtistLabel => ({
    artistId: artist.id,
    labelUserId: 1,
    isLabelApproved: true,
    isArtistApproved: true,
    canLabelManageArtist: true,
    canLabelAddReleases: true,
    isDisplayedOnArtistPage: true,
    orderIndex: null,
    artist,
  });
  const jessica = artistWith({ id: 8, name: "Jessica Moss" });
  const release = (id: number, title: string, artist: Artist) =>
    createMockAlbum({ id, title, artist, artistId: artist.id });
  const labelReleases = [
    release(11, "Hyper Natural", artistWith()),
    release(12, "Entire Cities", jessica),
  ];
  const ownRelease = release(
    13,
    "Corona Borealis",
    artistWith({ id: 1, name: "Constellation" }),
  );
  const page = (overrides?: Partial<Artist>) => {
    mockArtist = createMockArtist({
      id: 1,
      name: "Constellation",
      bio: "",
      isLabelProfile: true,
      user: {
        artistLabels: [rosterEntry(artistWith()), rosterEntry(jessica)],
      },
      trackGroups: [ownRelease],
      ...overrides,
    });
    return render(<ArtistPage />);
  };
  const tabNames = () =>
    screen
      .getAllByRole("tab")
      .map((tab) => within(tab).getByText(/./).props.children);

  beforeEach(() => {
    // The list batches its cells on a timer that would fire outside act
    jest.useFakeTimers();
    mockLabel = {
      data: { results: labelReleases },
      isPending: false,
      isError: false,
    };
  });
  afterEach(() => jest.useRealTimers());

  test("a label without a tab order lands on Roster, and Releases swaps in the label's releases", () => {
    page();
    expect(tabNames()).toEqual(["Roster", "Releases"]);
    expect(
      screen.getByRole("tab", { name: "Roster", selected: true }),
    ).toBeTruthy();
    expect(
      screen.getByRole("tab", { name: "Releases", selected: false }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Joni Void" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Jessica Moss" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Hyper Natural/ })).toBeNull();
    // The tabs replace the strip button and the footer section
    expect(screen.queryByRole("button", { name: "Roster" })).toBeNull();
    expect(screen.queryByRole("header", { name: "Roster" })).toBeNull();

    fireEvent.press(screen.getByRole("tab", { name: "Releases" }));
    expect(
      screen.getByRole("tab", { name: "Releases", selected: true }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Hyper Natural, Joni Void" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Entire Cities, Jessica Moss" }),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Joni Void")).toBeNull();
    // The own release is not in the label's list, which holds every artist's
    expect(screen.queryByRole("link", { name: /Corona Borealis/ })).toBeNull();

    fireEvent.press(screen.getByRole("tab", { name: "Roster" }));
    expect(screen.getByRole("link", { name: "Joni Void" })).toBeTruthy();
  });

  test("the label's tab order and titles decide the tabs and the landing one", () => {
    page({
      properties: {
        colors: {},
        titles: { roster: "Artists" },
        tabOrder: ["releases", "roster", "posts", "support", "merch"],
      },
    });
    expect(tabNames()).toEqual(["Releases", "Artists"]);
    expect(
      screen.getByRole("tab", { name: "Releases", selected: true }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Entire Cities, Jessica Moss" }),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Joni Void")).toBeNull();
    expect(screen.queryByRole("tab", { name: "Roster" })).toBeNull();

    fireEvent.press(screen.getByRole("tab", { name: "Artists" }));
    expect(screen.getByRole("link", { name: "Joni Void" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Entire Cities/ })).toBeNull();
  });

  test("a label without releases has the Roster tab only", () => {
    mockLabel = { data: { results: [] }, isPending: false, isError: false };
    page({ trackGroups: [] });
    expect(tabNames()).toEqual(["Roster"]);
    expect(screen.getByRole("link", { name: "Joni Void" })).toBeTruthy();
  });

  test("while the label's releases load, Releases shows a spinner, and goes if nothing comes", () => {
    mockLabel = { isPending: true, isError: false };
    page({
      trackGroups: [],
      properties: { colors: {}, tabOrder: ["releases", "roster"] },
    });
    expect(tabNames()).toEqual(["Releases", "Roster"]);
    expect(
      screen.getByRole("tab", { name: "Releases", selected: true }),
    ).toBeTruthy();
    expect(screen.UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
    expect(screen.queryByText("No Albums Present!")).toBeNull();

    mockLabel = { data: { results: [] }, isPending: false, isError: false };
    screen.rerender(<ArtistPage />);
    expect(tabNames()).toEqual(["Roster"]);
    expect(screen.UNSAFE_queryByType(ActivityIndicator)).toBeNull();
    expect(screen.getByRole("link", { name: "Joni Void" })).toBeTruthy();
  });

  test("a label list that fails falls back to the label's own releases", () => {
    mockLabel = { isPending: false, isError: true };
    page({ properties: { colors: {}, tabOrder: ["releases", "roster"] } });
    expect(
      screen.getByRole("link", { name: "Corona Borealis, Constellation" }),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Hyper Natural/ })).toBeNull();
  });

  test("a strip button aims again while the list grows, until it settles or the user drags", () => {
    const scroll = jest
      .spyOn(FlatList.prototype, "scrollToOffset")
      .mockImplementation(() => {});
    page({ bio: "We are a label" });
    const list = screen.UNSAFE_getByType(FlatList);
    const grow = (height: number) =>
      act(() => list.props.onContentSizeChange(0, height));
    const about = () => screen.getByRole("button", { name: "About" });

    grow(3000);
    fireEvent.press(about());
    // The rows below the screen are estimates, so the end moves as they render
    grow(3600);
    expect(scroll.mock.calls.map(([params]) => params?.offset)).toEqual([
      2984, 3584,
    ]);

    act(() => jest.advanceTimersByTime(600));
    grow(3700);
    expect(scroll).toHaveBeenCalledTimes(2);

    fireEvent.press(about());
    act(() => list.props.onScrollBeginDrag());
    grow(3800);
    expect(scroll).toHaveBeenCalledTimes(3);
    scroll.mockRestore();
  });

  test("an artist the label owner also owns, or a label without artists, has no tabs", () => {
    // The API sends the owner's roster on every profile the owner has
    page({ isLabelProfile: false });
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("link", { name: "Joni Void" })).toBeNull();
    expect(screen.getByRole("header", { name: "Releases" })).toBeTruthy();
    // Its own releases, without the label's list or an artist line
    expect(screen.getByRole("link", { name: "Corona Borealis" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Hyper Natural/ })).toBeNull();
    screen.unmount();

    page({ user: { artistLabels: [] } });
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.getByRole("header", { name: "Releases" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Hyper Natural, Joni Void" }),
    ).toBeTruthy();
  });
});
