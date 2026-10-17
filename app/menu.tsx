import { View, Pressable, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/state/AuthContext";
import { useLogoutMutation } from "@/queries/authQueries";
import { useTranslation } from "react-i18next";

export default function Menu() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { t } = useTranslation("translation");

  const { mutate: logout } = useLogoutMutation();
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
      style={{
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        width: "100%",
        backgroundColor: "white",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 10,
          width: "100%",
          height: 60,
          backgroundColor: "#fafafa",
        }}
      >
        <Pressable onPress={() => router.dismiss()}>
          <Ionicons
            name="chevron-down-outline"
            size={40}
            style={{ color: "#696969" }}
          ></Ionicons>
        </Pressable>
      </View>
      <View style={{ width: "100%", padding: 30, flex: 1 }}>
        {user && user.name && (
          <View>
            <Text style={{ marginTop: 20, fontSize: 25, fontWeight: "bold" }}>
              {user.name}
            </Text>
            <View style={styles.separator} />
          </View>
        )}
        <View
          style={{
            alignItems: "center",
            width: "100%",
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          <View style={{ gap: 20, alignItems: "center", width: "100%" }}>
            <Pressable
              onPress={() => {
                router.back();
                router.navigate("/");
              }}
              style={styles.link}
            >
              <Ionicons name="home-outline" size={25} />
              <Text style={{ fontSize: 20 }}>
                {t("releases.recentReleases")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                router.back();
                router.navigate("/collections");
              }}
              style={styles.link}
            >
              <Ionicons name="library-outline" size={25} />
              <Text style={{ fontSize: 20 }}>
                {t("profile.yourCollection")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                router.back();
                router.navigate("/wishlist");
              }}
              style={styles.link}
            >
              <Ionicons name="heart-outline" size={25} />
              <Text style={{ fontSize: 20 }}>{t("profile.yourWishlist")}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                router.back();
                router.push("/about");
              }}
              style={styles.link}
            >
              <Ionicons name="information-circle-outline" size={25} />
              <Text style={{ fontSize: 20 }}>{t("headerMenu.about")}</Text>
            </Pressable>
            <Pressable
              style={[
                styles.link,
                {
                  borderColor: "#e0e0e0",
                  borderWidth: StyleSheet.hairlineWidth,
                  backgroundColor: "white",
                  marginTop: 20,
                },
              ]}
              onPress={() => {
                if (user) {
                  onLogOut();
                  return;
                } else {
                  router.dismissTo("/login");
                }
              }}
            >
              <Ionicons
                name={user ? "log-in-outline" : "log-out-outline"}
                size={25}
              />
              <Text style={{ fontSize: 20 }}>
                {user ? t("headerMenu.logOut") : t("headerMenu.logIn")}
              </Text>
            </Pressable>
          </View>

          {user && (
            <Pressable
              style={[
                styles.link,
                {
                  borderColor: "#e0e0e0",
                  borderWidth: StyleSheet.hairlineWidth,
                  backgroundColor: "white",
                  marginBottom: 30,
                },
              ]}
              onPress={() => {
                router.push("/deleteAccount");
              }}
            >
              <Text style={{ fontSize: 20, color: "red" }}>
                {t("profile.deleteAccount")}
              </Text>
              <Ionicons name="open-outline" size={25} color="red" />
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  separator: {
    borderBottomColor: "grey",
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 20,
  },
  link: {
    backgroundColor: "#edebeb",
    flexDirection: "row",
    width: "100%",
    padding: 10,
    alignItems: "center",
    gap: 10,
  },
});
