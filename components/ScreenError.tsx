import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CollectionEmpty } from "@/components/CollectionPurchase";
import ErrorNotification from "@/components/ErrorNotification";
import MenuButton from "@/components/MenuButton";
import ScreenHeader, { BackButton } from "@/components/ScreenHeader";
import SearchButton from "@/components/SearchButton";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { gutter } from "@/constants/spacing";
import { MirloFetchError } from "@/queries/fetch/MirloFetchError";

// A failed request of a screen, kept under the header of the loaded one
export default function ScreenError({
  error,
  notFound,
}: {
  error: Error;
  notFound?: string;
}) {
  const colors = useColors();
  const [visible, setVisible] = useState(true);
  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
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
      {notFound && error instanceof MirloFetchError && error.status === 404 ? (
        <View style={styles.message}>
          <CollectionEmpty>{notFound}</CollectionEmpty>
        </View>
      ) : (
        <ErrorNotification
          visible={visible}
          onDismiss={() => setVisible(false)}
          error={error}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  message: {
    paddingHorizontal: gutter,
  },
});
