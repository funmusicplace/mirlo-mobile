import { useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import Button from "@/components/Button";
import DismissModalBar from "@/components/DismissModalBar";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";
import { screenEdges } from "@/constants/safe-area";
import { radius, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";
import { useInstances } from "@/state/InstancesContext";

export default function Sources() {
  const { t } = useTranslation("translation", { keyPrefix: "sources" });
  const colors = useColors();
  const { instances, addInstance, removeInstance } = useInstances();
  const [address, setAddress] = useState("");
  const add = useMutation({
    mutationFn: addInstance,
    onSuccess: () => setAddress(""),
  });

  const submit = () => {
    if (address.trim() && !add.isPending) add.mutate(address);
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={screenEdges}
    >
      <DismissModalBar title={t("title", "Sources")} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[type.body, { color: colors.secondaryText }]}>
          {t(
            "description",
            "Recent releases come from every source in this list. You can add any site that runs Mirlo.",
          )}
        </Text>
        <View>
          {instances.map((instance, index) => (
            <View
              key={instance.apiRoot}
              style={[styles.row, { borderBottomColor: colors.border }]}
            >
              <View style={styles.rowText}>
                <Text style={type.body}>{instance.name}</Text>
                <Text style={[type.small, { color: colors.secondaryText }]}>
                  {instance.siteUrl.replace(/^https?:\/\//, "")}
                </Text>
              </View>
              {/* The first is the built-in default */}
              {index > 0 ? (
                <Button
                  variant="outlined"
                  size="compact"
                  title={t("remove", "Remove")}
                  accessibilityLabel={t("removeLabel", {
                    name: instance.name,
                    defaultValue: "Remove {{name}}",
                  })}
                  onPress={() => removeInstance(instance.apiRoot)}
                />
              ) : null}
            </View>
          ))}
        </View>
        <View>
          <Text style={styles.label}>
            {t("addressLabel", "Source address")}
          </Text>
          <TextInput
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              add.reset();
            }}
            onSubmitEditing={submit}
            editable={!add.isPending}
            placeholder={t("addressPlaceholder", "mirlo.example.org")}
            placeholderTextColor={colors.inputPlaceholder}
            accessibilityLabel={t("addressLabel", "Source address")}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="url"
            textContentType="URL"
            returnKeyType="go"
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.inputText,
              },
            ]}
          />
          {add.error ? (
            <Text
              accessibilityRole="alert"
              style={[styles.error, { color: colors.danger }]}
            >
              {add.error.message === "duplicate"
                ? t("duplicate", "That source is already in the list.")
                : t("notFound", "Couldn't find a Mirlo site at that address.")}
            </Text>
          ) : null}
        </View>
        <Button
          title={t("add", "Add source")}
          onPress={submit}
          loading={add.isPending}
          disabled={!address.trim()}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: touchTarget,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
  },
  label: {
    ...type.formLabel,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: touchTarget,
    fontSize: type.body.fontSize,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  error: {
    ...type.small,
    marginTop: spacing.sm,
  },
});
