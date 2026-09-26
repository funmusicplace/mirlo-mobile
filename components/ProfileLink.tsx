import Feather from "@expo/vector-icons/Feather";
import { Link } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useAuthContext } from "@/state/AuthContext";
import { useLogoutMutation } from "@/queries/authQueries";
import { useCallback } from "react";
import { useRouter } from "expo-router";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";

export default function ProfileLink() {
  const { user } = useAuthContext();
  const { mutate: logout } = useLogoutMutation();
  const router = useRouter();
  const colors = useColors();
  const onLogOut = () => {
    logout(undefined, {
      onSuccess() {
        router.dismissTo("/");
        console.log("logged out");
      },
    });
  };

  const logInIcon = <Feather name="log-in" size={20} color={colors.text} />;
  const logOutIcon = <Feather name="log-out" size={20} color={colors.text} />;

  if (!user) {
    return (
      <View style={styles.link}>
        <Link href={{ pathname: "/login" }}>
          <View>
            <Text>{logInIcon}</Text>
            <Text>Login</Text>
          </View>
        </Link>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onLogOut} style={styles.link}>
      <Text>{logOutIcon}</Text>
      <Text>Logout</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  link: {
    marginRight: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
