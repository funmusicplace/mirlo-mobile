// Tags read from the finished release, and the releases fetched for each
export const SIMILAR_TAGS = 3;
export const SIMILAR_RELEASES = 10;
// The web's MAX_OTHER_RELEASES
const ARTIST_RELEASES = 20;

export type PlayNextSection = {
  key: "recommended" | "artist" | "similar";
  releases: AlbumProps[];
};

export const keyOf = ({ id, apiRoot }: Pick<AlbumProps, "id" | "apiRoot">) =>
  `${apiRoot ?? ""}-${id}`;

// As the home list's isReleased=released, an undated release (NaN) stays out
const isOut = ({ releaseDate }: AlbumProps, now: number) =>
  Date.parse(releaseDate ?? "") <= now;

// The artist's picks, their other releases, then releases sharing the first
// tags. A release shows once, in the first section that has it, and the
// finished release never does
export function playNextSections(
  finished: Pick<AlbumProps, "id" | "apiRoot">,
  {
    recommended = [],
    artist,
    tagged = [],
  }: {
    recommended?: AlbumProps[];
    artist?: Artist;
    // One list per tag, in the release's tag order
    tagged?: (AlbumProps[] | undefined)[];
  },
  now = Date.now(),
): PlayNextSection[] {
  const seen = new Set([keyOf(finished)]);
  const pick = (releases: AlbumProps[], max = Infinity) => {
    const picked: AlbumProps[] = [];
    for (const release of releases) {
      if (picked.length >= max) break;
      if (!isOut(release, now) || seen.has(keyOf(release))) continue;
      seen.add(keyOf(release));
      picked.push(release);
    }
    return picked;
  };
  // Both lists come from the finished release's instance
  const own = (release: AlbumProps) => ({
    ...release,
    apiRoot: finished.apiRoot,
  });
  const sections: PlayNextSection[] = [
    { key: "recommended", releases: pick(recommended.map(own)) },
    {
      key: "artist",
      releases: pick(
        // The artist's own list leaves the artist off each release
        artist
          ? artist.trackGroups.map((release) => own({ ...release, artist }))
          : [],
        ARTIST_RELEASES,
      ),
    },
    {
      key: "similar",
      // Tags stay on the default instance
      releases: finished.apiRoot
        ? []
        : pick(
            tagged.slice(0, SIMILAR_TAGS).flatMap((list) => list ?? []),
            SIMILAR_RELEASES,
          ),
    },
  ];
  return sections.filter(({ releases }) => releases.length > 0);
}
