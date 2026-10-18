import { View, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/state/AuthContext";
import { useLogoutMutation } from "@/queries/authQueries";
import { useTranslation } from "react-i18next";
import Text from "@/components/ThemedText";
import Button from "@/components/Button";
import ScreenHeader, { HeaderButton } from "@/components/ScreenHeader";
import { useColors } from "@/constants/colors";
import { radius, spacing, touchTarget } from "@/constants/spacing";
import { type } from "@/constants/typography";

type MenuLinkProps = {
  label: string;
  onPress: () => void;
  color?: string;
};

function MenuLink({ label, onPress, color }: MenuLinkProps) {
  const colors = useColors();
  const tint = color ?? colors.text;
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [
        styles.link,
        pressed && { backgroundColor: tint },
      ]}
    >
      {({ pressed }) => (
        <Text
          style={[
            type.body,
            { color: pressed ? colors.background : tint },
            pressed && styles.underline,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function Separator() {
  const colors = useColors();
  return <View style={[styles.separator, { borderTopColor: colors.tintX }]} />;
}

export default function Menu() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { t } = useTranslation("translation");
  const colors = useColors();

  const { mutate: logout, isPending } = useLogoutMutation();
  const onLogOut = () => {
    logout(undefined, {
      onSuccess() {
        router.dismissTo("/");
        console.log("logged out");
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        right={
          <HeaderButton
            accessibilityLabel="Close"
            onPress={() => router.dismiss()}
          >
            <FontAwesome5 name="times" size={20} color={colors.text} solid />
          </HeaderButton>
        }
      />
      <View style={styles.body}>
        <View style={styles.nav}>
          {user && user.name && (
            <>
              <Text style={[type.heading, styles.name]}>{user.name}</Text>
              <Separator />
            </>
          )}
          <MenuLink
            label={t("releases.recentReleases")}
            onPress={() => {
              router.back();
              router.navigate("/");
            }}
          />
          <MenuLink
            label={t("profile.yourCollection")}
            onPress={() => {
              router.back();
              router.navigate("/collections");
            }}
          />
          <MenuLink
            label={t("profile.yourWishlist")}
            onPress={() => {
              router.back();
              router.navigate("/wishlist");
            }}
          />
          <Separator />
          <MenuLink
            label={t("headerMenu.about")}
            onPress={() => {
              router.back();
              router.push("/about");
            }}
          />
        </View>
        <View style={styles.actions}>
          <Button
            variant={user ? "outlined" : "solid"}
            title={user ? t("headerMenu.logOut") : t("headerMenu.logIn")}
            loading={isPending}
            fullWidth
            onPress={() => {
              if (user) {
                onLogOut();
              } else {
                router.dismissTo("/login");
              }
            }}
          />
          {user && (
            <MenuLink
              label={t("profile.deleteAccount")}
              color={colors.danger}
              onPress={() => {
                router.push("/deleteAccount");
              }}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
  },
  nav: {
    flex: 1,
  },
  name: {
    paddingHorizontal: spacing.sm,
  },
  link: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    // Web padding is 8, this lifts the row to the 44 pt target
    paddingVertical: (touchTarget - type.body.lineHeight) / 2,
  },
  underline: {
    textDecorationLine: "underline",
  },
  separator: {
    borderTopWidth: 1,
    marginVertical: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
});
