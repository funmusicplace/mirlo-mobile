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
  coverCredit?: string | null;
  coverImageAlt?: string | null;
  credits?: string | null;
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
  isGettable?: boolean;
  // In cents, null when the artist set no price
  minPrice?: number | null;
  isPreorder?: boolean;
  fundraiser?: { isAllOrNothing: boolean } | null;
  // The instance it came from, unset for the default one
  apiRoot?: string;
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
    order?: number;
  }[];
  lyrics?: string | null;
  description?: string | null;
  isrc?: string | null;
  license?: { short?: string; name: string; link?: string | null } | null;
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
    apiRoot?: string;
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

interface Link {
  url: string;
  linkType?: string;
  linkLabel?: string;
  inHeader?: boolean;
  iconUrl?: string;
}

interface TourDate {
  id: number;
  date: string;
  location: string;
  ticketsUrl?: string | null;
}

interface Artist {
  name: string;
  bio: string;
  shortDescription?: string;
  activityPub: boolean;
  urlSlug?: string;
  userId: number;
  id: number;
  location?: string;
  enabled: boolean;
  createdAt: string;
  isLabelProfile?: boolean;
  artistLabels?: ArtistLabel[];
  trackGroups: AlbumProps[];
  links?: string[];
  linksJson?: Link[];
  announcementText?: string | null;
  tourDates?: TourDate[];
  properties?: {
    colors: ArtistColors;
    titles?: {
      roster?: string;
      releases?: string;
      merch?: string;
      posts?: string;
      support?: string;
    };
  };
  // The owner's roster, shown on label profiles only
  user?: { artistLabels?: ArtistLabel[] };
  banner?: {
    url: string;
    sizes?: { [key: number]: string };
    updatedAt: string;
  };
  background?: Artist["banner"];
  avatar?: {
    url: string;
    sizes?: { [key: string]: string };
    updatedAt: string;
  };
  location?: string;
  bio: string;
  maxFreePlays?: number;
}

interface ArtistLabel {
  artistId: number;
  labelUserId: number;
  isLabelApproved: boolean;
  isArtistApproved: boolean;
  canLabelManageArtist: boolean;
  canLabelAddReleases: boolean;
  isDisplayedOnArtistPage: boolean;
  orderIndex: number | null;
  artist: Artist;
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
