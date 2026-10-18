import { ActivityIndicator, View, FlatList } from "react-native";
import MenuButton from "@/components/MenuButton";
import SearchButton from "@/components/SearchButton";
import { StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import TrackGroupItem, {
  useGridColumnWidth,
} from "@/components/TrackGroupItem";
import ScreenHeader, {
  BackButton,
  SectionHeader,
} from "@/components/ScreenHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { queryTopSold } from "@/queries/queries";
import ErrorNotification from "@/components/ErrorNotification";
import { useState } from "react";
import { useColors } from "@/constants/colors";
import { gutter, spacing } from "@/constants/spacing";

export default function Index() {
  const { isPending, isError, data, error } = useQuery(queryTopSold({}));
  const { top } = useSafeAreaInsets();
  const trackGroups = data?.results;
  const [showError, setShowError] = useState<boolean>(true);
  const colors = useColors();
  const columnWidth = useGridColumnWidth();

  if (isPending) {
    return (
      <View style={{ flex: 1 }}>
        <ActivityIndicator
          size="large"
          color={colors.accent}
          style={styles.loadSpinner}
        />
      </View>
    );
  }

  if (isError) {
    console.error(error);
    return (
      <View style={{ flex: 1 }}>
        <ErrorNotification
          visible={showError}
          onDismiss={() => setShowError(false)}
          error={error}
        />
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, paddingTop: top, backgroundColor: colors.background }}
    >
      <ScreenHeader
        left={<BackButton />}
        right={
          <>
            <SearchButton />
            <MenuButton />
          </>
        }
      />
      <FlatList
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={{ paddingHorizontal: gutter }}
        data={trackGroups}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          <TrackGroupItem {...item} width={columnWidth} />
        )}
        ListHeaderComponent={<SectionHeader>Popular</SectionHeader>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadSpinner: {
    flex: 1,
  },
});
