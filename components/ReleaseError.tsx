import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { CollectionEmpty } from "@/components/CollectionPurchase";
import ErrorNotification from "@/components/ErrorNotification";
import MenuButton from "@/components/MenuButton";
import ScreenHeader, { BackButton } from "@/components/ScreenHeader";
import SearchButton from "@/components/SearchButton";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { gutter } from "@/constants/spacing";
import { MirloFetchError } from "@/queries/fetch/MirloFetchError";

// A failed request of a release screen, kept under the header of the loaded one
export default function ReleaseError({ error }: { error: Error }) {
  const { t } = useTranslation("translation");
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
      {error instanceof MirloFetchError && error.status === 404 ? (
        <View style={styles.message}>
          <CollectionEmpty>
            {t("trackGroupDetails.doesNotExist")}
          </CollectionEmpty>
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
