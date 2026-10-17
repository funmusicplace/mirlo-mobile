interface LoggedInUser {
  email: string;
  name: string;
  id: number;
  urlSlug?: string;
  artists?: Artist[];
  artistUserSubscriptions?: ArtistUserSubscription[];
  userTrackGroupPurchases?: { trackGroupId: number }[];
  userTrackPurchases?: { trackId: number }[];
  isAdmin: boolean;
  currency?: string;
  isLabelAccount?: boolean;
  wishlist?: {
    userId: number;
    trackGroupId: number;
  }[];
  trackFavorites?: {
    userId: number;
    trackId: number;
    track: RNTrack;
    createdAt: Date;
  }[];
  language?: string;
  canCreateArtists?: boolean;
  merchPurchase?: MerchPurchase[];
}

interface UserTransaction {
  id: string;
  userId: number;
  user: User;
  createdAt: Date;
  amount: number;
  currency: string;
  platformCut?: number;
  stripeCut?: number;
  stripeId?: string;
  trackGroupPurchases: UserTrackGroupPurchase[];
  trackPurchases: UserTrackPurchase[];
}

interface UserTrackGroupPurchase {
  userId: number;
  user?: User;
  trackGroupId: number;
  trackGroup?: TrackGroup;
  pricePaid: number;
  currencyPaid: string;
  datePurchased: string;
  singleDownloadToken?: string;
}

interface UserTrackPurchase {
  userId: number;
  user?: User;
  trackId: number;
  track?: Track;
  pricePaid: number;
  currencyPaid: string;
  datePurchased: string;
}

interface AlbumProps {
  id: number;
  cover: {
    sizes: {
      60: string;
      120: string;
      300: string;
      600: string;
      960: string;
      1200: string;
      1500: string;
    };
  };
  title: string;
  artist: Artist;
  artistId: number;
  urlSlug: string;
  userTrackGroupPurchases?: { userId: number }[];
  releaseDate: string;
  tracks?: RNTrack[];
  about?: string;
  tags?: string[];
  trackGroupId: number;
  minPrice?: number;
}

interface TrackProps {
  title: string;
  order: number;
  id: number | undefined;
  artist: string;
  albumId: number;
  trackGroup: AlbumProps;
  isPreview: boolean;
  audio: {
    url: string;
    duration: number | undefined;
  };
}

interface RNTrack {
  title: string;
  artist: string;
  artwork: string;
  trackArtists?: {
    role?: string;
    artistId?: number;
    artistName?: string;
    isCoAuthor?: boolean;
    trackId?: number;
  }[];
  allowIndividualSale: boolean;
  url: string;
  id: number;
  queueIndex: number;
  trackGroupId: number;
  trackGroup: {
    id: number;
    releaseDate: string;
    trackGroupId: number;
    title: string;
    userTrackGroupPurchases?: { userId: number }[];
    artist: Artist;
    artistId: number;
    urlSlug: string;
    cover: {
      sizes: {
        60: string;
        120: string;
        300: string;
        600: string;
        960: string;
        1200: string;
        1500: string;
      };
    };
  };
  audio: {
    url: string;
    duration: number | undefined;
  };
  isPreview: boolean;
  isFeatured?: boolean;
  order: number;
  headers: {};
  type?: "default" | "hls" | "dash" | "smoothstreaming";
}

interface PlayButtonProps {
  albumTracks: RNTrack[];
  trackObject: RNTrack;
  buttonColor?: string;
  albumInfo?: AlbumProps;
}

interface PropsWithChildren<P> extends P {
  children?: ReactNode;
}

interface PlayPauseWrapperProps {
  trackObject: RNTrack;
  style?: StyleProp<ViewStyle>;
  selectedAlbum?: AlbumProps;
  onTrackScreen: boolean;
}

interface Artist {
  name: string;
  bio: string;
  activityPub: boolean;
  urlSlug?: string;
  userId: number;
  id: number;
  location?: string;
  enabled: boolean;
  createdAt: string;
  artistLabels?: ArtistLabel[];
  trackGroups: AlbumProps[];
  links?: string[];
  linksJson?: Link[];
  properties?: {
    colors: ArtistColors;
  };
  user?: Partial<User>;
  banner?: {
    url: string;
    sizes?: { [key: number]: string };
    updatedAt: string;
  };
  avatar?: {
    url: string;
    sizes?: { [key: string]: string };
    updatedAt: string;
  };
  location?: string;
  bio: string;
  maxFreePlays?: number;
}

interface Tag {
  tag: string;
}

interface ArtistSubscriptionTier {
  artist?: Artist;
}

interface ArtistUserSubscription {
  id: number;
  amount: number;
  currency?: string;
  userId: number;
  artistSubscriptionTierId?: number;
  artistSubscriptionTier?: ArtistSubscriptionTier;
}

interface MerchPurchase {
  merchId: string;
  id: string;
  userId: number;
}
