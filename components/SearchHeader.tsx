import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, View, ViewProps } from "react-native";
import SearchBar from "./searchBar";
import { useRouter } from "expo-router";
import { useSearch } from "@/state/SearchContext";
import { useColors } from "@/constants/colors";

export default function SearchHeader({ style }: ViewProps) {
  const router = useRouter();
  const { setSearchValue, setSearchResults } = useSearch();
  const colors = useColors();
  return (
    <View>
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 10,
            width: "100%",
            height: 60,
            borderBottomWidth: 3,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
          style,
        ]}
      >
        <Ionicons
          name="search-outline"
          size={30}
          style={{ color: colors.inactive }}
        ></Ionicons>
        <SearchBar />
        <Pressable
          onPress={() => {
            setSearchValue("");
            setSearchResults([]);
            router.dismiss(1);
          }}
        >
          <Ionicons
            name="close-outline"
            size={30}
            style={{ color: colors.inactive, marginHorizontal: 15 }}
          ></Ionicons>
        </Pressable>
      </View>
    </View>
  );
}
