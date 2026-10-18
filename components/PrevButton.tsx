import { View, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { skipTrack } from "@/scripts/trackPlayUtils";

export default function PrevButton() {
  const colors = useColors();
  const prevIcon = (
    <Ionicons name="play-skip-back" size={40} color={colors.text} />
  );

  const prevSong = async () => {
    try {
      await skipTrack("previous");
    } catch (err) {
      console.error("issue setting the song to previous track in queue", err);
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.button} onPress={prevSong}>
        <Text>{prevIcon}</Text>
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
