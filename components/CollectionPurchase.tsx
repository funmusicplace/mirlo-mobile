import { View, Image, StyleSheet, useColorScheme } from "react-native";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";

type CollectionPurchaseProps = {
  trackGroup: AlbumProps;
  track?: RNTrack;
};

const logoLight = require("@/assets/images/mirlo-logo-logoOnly-light.png");
const logoDark = require("@/assets/images/mirlo-logo-logoOnly-dark.png");

export default function CollectionPurchase({
  trackGroup,
  track,
}: CollectionPurchaseProps) {
  const colors = useColors();
  const isDark = useColorScheme() === "dark";
  return (
    <View style={styles.listItem}>
      <Image
        source={
          trackGroup.cover?.sizes
            ? { uri: trackGroup.cover?.sizes[120] }
            : { uri: isDark ? logoDark : logoLight }
        }
        style={[styles.image, { backgroundColor: colors.muted }]}
      />
      <View style={{ marginLeft: 15, width: 300 }}>
        <Text
          style={{ color: colors.text, fontSize: 15, fontWeight: "bold" }}
          ellipsizeMode="tail"
          numberOfLines={1}
        >
          {track ? track.title : trackGroup.title}
        </Text>
        <Text style={{ color: colors.text, fontSize: 14 }}>
          {trackGroup.artist.name}
        </Text>
      </View>
    </View>
  );
}

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
