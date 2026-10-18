import { View, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { skipTrack } from "@/scripts/trackPlayUtils";
export default function NextButton() {
  const colors = useColors();
  const nextIcon = (
    <Ionicons name="play-skip-forward" size={40} color={colors.text} />
  );

  const nextSong = async () => {
    try {
      await skipTrack("next");
    } catch (err) {
      console.error("issue skipping to next song", err);
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.button} onPress={nextSong}>
        <Text>{nextIcon}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginRight: 10,
  },
});
