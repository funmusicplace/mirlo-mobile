import {
  keepPreviousData,
  QueryFunction,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as api from "./fetch/fetchWrapper";
import { MirloFetchError } from "./fetch/MirloFetchError";

type UserPurchase = UserTrackPurchase | UserTrackGroupPurchase;

const fetchTrackGroups: QueryFunction<
  { results: AlbumProps[] },
  [
    "fetchTrackGroups",
    {
      skip?: number;
      take?: number;
      orderBy?: "random";
      tag?: string;
      distinctArtists?: boolean;
    },
    ...any,
  ]
> = ({
  queryKey: [_, { skip, take, orderBy, tag, distinctArtists }],
  signal,
  pageParam = 0,
}) => {
  const params = new URLSearchParams();
  if (skip || pageParam) params.append("skip", String(pageParam || skip));
  if (take) params.append("take", String(take));
  if (orderBy) params.append("orderBy", orderBy);
  if (tag) params.append("tag", tag);
  params.append("distinctArtists", String(distinctArtists ?? false));
  return api.get(`/v1/trackGroups?${params}`, { signal });
};

export function queryTrackGroups(opts: {
  skip?: number;
  take?: number;
  orderBy?: "random";
  tag?: string;
  distinctArtists: boolean;
}) {
  return queryOptions({
    queryKey: ["fetchTrackGroups", opts],
    queryFn: fetchTrackGroups,
    placeholderData: keepPreviousData,
  });
}

const fetchUserPurchases: QueryFunction<
  { results: UserTransaction[] },
  ["fetchUserPurchases", { userId: number | undefined }, ...any]
> = ({ queryKey: [_, { userId }], signal }) => {
  return api.get(`/v1/users/${userId}/purchases`, {});
};

export function queryUserPurchases(userId: number | undefined) {
  return queryOptions({
    queryKey: ["fetchUserPurchases", { userId }],
    queryFn: fetchUserPurchases,
    enabled: !!userId,
  });
}

const fetchUserCollection: QueryFunction<
  { results: UserPurchase[] },
  ["fetchUserCollection", { userId: number | undefined }, ...any]
> = ({ queryKey: [_, { userId }], signal }) => {
  return api.get(`/v1/users/${userId}/collection`, {});
};

export function queryUserCollection(userId: number | undefined) {
  return queryOptions({
    queryKey: ["fetchUserCollection", { userId }],
    queryFn: fetchUserCollection,
    enabled: !!userId,
  });
}

const fetchAlbum: QueryFunction<
  { result: AlbumProps },
  [
    "fetchAlbum",
    {
      slug: string | string[];
      id: string | string[];
      apiRoot?: string;
    },
  ]
> = async ({ queryKey: [_, { slug, id, apiRoot }], signal }) => {
  const safeSlug = Array.isArray(slug) ? slug[0] : slug;
  const safeId = Array.isArray(id) ? id[0] : id;
  const { result } = await api.get<{ result: AlbumProps }>(
    `/v1/trackGroups/${safeSlug}/?artistId=${safeId}`,
    { signal, apiRoot },
  );
  return { result: apiRoot ? { ...result, apiRoot } : result };
};

export function queryAlbum(opts: {
  slug: string | string[];
  id: string | string[];
  apiRoot?: string;
}) {
  return queryOptions({
    queryKey: ["fetchAlbum", opts],
    queryFn: fetchAlbum,
    enabled: !!opts.slug && !!opts.id,
  });
}

const fetchArtist: QueryFunction<
  Artist,
  ["fetchArtist", { artistSlug: string; apiRoot?: string }]
> = async ({ queryKey: [_, { artistSlug, apiRoot }], signal }) => {
  const { result } = await api.get<{ result: Artist }>(
    `/v1/artists/${artistSlug}`,
    { signal, apiRoot },
  );
  return result;
};

export function queryArtist(opts: { artistSlug: string; apiRoot?: string }) {
  return queryOptions({
    queryKey: [
      "fetchArtist",
      {
        artistSlug: opts.artistSlug,
        apiRoot: opts.apiRoot,
      },
    ],
    queryFn: fetchArtist,
    enabled: !!opts.artistSlug,
  });
}

const fetchLabelTrackGroups: QueryFunction<
  { results: AlbumProps[] },
  ["fetchLabelTrackGroups", { labelSlug: string; apiRoot?: string }]
> = ({ queryKey: [_, { labelSlug, apiRoot }], signal }) => {
  return api.get(`/v1/labels/${labelSlug}/trackGroups`, { signal, apiRoot });
};

export function queryLabelTrackGroups(opts: {
  labelSlug: string;
  apiRoot?: string;
}) {
  return queryOptions({
    queryKey: ["fetchLabelTrackGroups", opts],
    queryFn: fetchLabelTrackGroups,
    enabled: !!opts.labelSlug,
  });
}

const fetchTags: QueryFunction<
  { results: Tag[]; total?: number },
  [
    "fetchTags",
    {
      skip?: number;
      take?: number;
      orderBy?: "asc" | "count";
    },
    ...any,
  ]
> = ({ queryKey: [_, { skip, take, orderBy }], signal }) => {
  const params = new URLSearchParams();
  if (skip) params.append("skip", String(skip));
  if (take) params.append("take", String(take));
  if (orderBy) params.append("orderBy", orderBy);

  return api.get(`/v1/tags?${params}`, { signal });
};

export function queryTags(opts: {
  skip?: number;
  take?: number;
  orderBy?: "asc" | "count";
}) {
  return queryOptions({
    queryKey: ["fetchTags", opts, "tags"],
    queryFn: fetchTags,
  });
}

const fetchWishlist: QueryFunction<
  {
    results: {
      userId: number;
      trackGroupId: number;
      trackGroup: AlbumProps;
      createdAt: Date;
    }[];
  },
  ["fetchWishlist", { userId: number | undefined }, ...any]
> = ({ queryKey: [_, { userId }], signal }) => {
  return api.get(`/v1/users/${userId}/wishlist`, {});
};

export function queryWishlist(userId: number | undefined) {
  return queryOptions({
    queryKey: ["fetchWishlist", { userId }],
    queryFn: fetchWishlist,
    enabled: !!userId,
  });
}
