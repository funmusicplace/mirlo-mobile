import React from "react";
import { Image } from "react-native";
import {
  fireEvent,
  isHiddenFromAccessibility,
  render,
  screen,
} from "@testing-library/react-native";
import ArtistTile from "@/components/ArtistTile";
import ArtistPage from "@/app/artist/[id]/artist-page";
import { createMockArtist } from "@/__mocks__/mockArtist";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useRouter: () => ({ push: jest.fn() }),
  useLocalSearchParams: () => ({ id: "label" }),
}));

let mockArtist: Artist;
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: mockArtist, isPending: false, isError: false }),
}));
jest.mock("@/queries/queries", () => ({
  queryArtist: () => ({ enabled: true }),
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

describe("artist page roster", () => {
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
  const page = (overrides?: Partial<Artist>) => {
    mockArtist = createMockArtist({
      id: 1,
      name: "Constellation",
      bio: "",
      isLabelProfile: true,
      user: {
        artistLabels: [
          rosterEntry(artistWith()),
          rosterEntry(artistWith({ id: 8, name: "Jessica Moss" })),
        ],
      },
      ...overrides,
    });
    return render(<ArtistPage />);
  };

  test("a label gets a strip button and a section, titled by the label or Roster", () => {
    page();
    expect(screen.getByRole("button", { name: "Roster" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Roster" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Joni Void" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Jessica Moss" })).toBeTruthy();
    screen.unmount();

    page({
      properties: {
        colors: {},
        titles: { roster: "Artists" },
      },
    });
    expect(screen.getByRole("button", { name: "Artists" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Artists" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Roster" })).toBeNull();
  });

  test("an artist the label owner also owns, or a label without artists, shows none", () => {
    // The API sends the owner's roster on every profile the owner has
    page({ isLabelProfile: false });
    expect(screen.queryByRole("button", { name: "Roster" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Joni Void" })).toBeNull();
    screen.unmount();

    page({ user: { artistLabels: [] } });
    expect(screen.queryByRole("button", { name: "Roster" })).toBeNull();
    expect(screen.queryByRole("header", { name: "Roster" })).toBeNull();
  });
});
