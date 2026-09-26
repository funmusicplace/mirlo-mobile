import {
  View,
  Pressable,
  Image,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { useSearch } from "@/state/SearchContext";
import { toUpper } from "lodash";
import { useTranslation } from "react-i18next";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";

const logoLight = require("@/assets/images/mirlo-logo-logoOnly-light.png");
const logoDark = require("@/assets/images/mirlo-logo-logoOnly-dark.png");

type Result = {
  result: {
    id: number | string;
    name: string;
    category?: string;
    artistId?: number | string;
    trackGroupId?: number | string;
    artistName?: string;
    avatar?: {
      url: string;
      sizes?: { [key: string]: string };
      updatedAt: string;
    };
    trackGroupCover?: {
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
  index: number;
};

export default function SearchItem({ result, index }: Result) {
  const { t } = useTranslation();
  const router = useRouter();
  const { setSearchResults, setShowSuggestions } = useSearch();
  const colors = useColors();
  const isDark = useColorScheme() === "dark";
  return (
    <View style={{ marginVertical: 5 }}>
      <Pressable
        onPress={() => {
          setSearchResults([]);
          setShowSuggestions(false);
          router.back();
          router.navigate(constructUrl(result));
        }}
      >
        <View style={styles.listItem}>
          <Image
            source={
              result.trackGroupCover?.sizes?.[120]
                ? { uri: result.trackGroupCover.sizes[120] }
                : result.avatar?.sizes?.[120]
                  ? { uri: result.avatar.sizes[120] }
                  : isDark
                    ? logoDark
                    : logoLight
            }
            style={[styles.image, { backgroundColor: colors.muted }]}
          />
          <View style={{ marginLeft: 15, width: 300, gap: 2 }}>
            <Text
              ellipsizeMode="tail"
              numberOfLines={1}
              style={{ fontSize: 18 }}
            >
              {result.name.trim()}
            </Text>
            {result.artistName && (
              <Text
                ellipsizeMode="tail"
                numberOfLines={1}
                style={{ fontSize: 15, color: colors.secondaryText }}
              >
                {t("profile.albumLink")
                  .replace(/<[^>]*>.*?<\/[^>]*>/g, "")
                  .trim()}{" "}
                {result.artistName.trim()}
              </Text>
            )}
            <Text style={{ fontSize: 12, color: colors.secondaryText }}>
              {toUpper(result.category)}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
const constructUrl = (r: any) => {
  if (!r) {
    return "/";
  }

  if (r.isTrack) {
    return `/artist/${r.artistId}/album/${r.trackGroupId}/tracks/${r.id}` as const;
  } else if (r.isTrackGroup) {
    return `/artist/${r.artistId}/album/${r.trackGroupId}/album-tracks` as const; // as const tells typescript this is a literal string pattern
  } else if (r.isArtist) {
    return `/artist/${r.artistId}/artist-page` as const;
  } else {
    console.log(r.name);
    return `/tags/${r.name}` as const;
  }
};

const styles = StyleSheet.create({
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 1,
  },
});
