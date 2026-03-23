import { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const token = params.token_hash as string | undefined;
    const type = params.type as string | undefined;

    if (token && type) {
      supabase.auth
        .verifyOtp({ token_hash: token, type: type as "email" })
        .then(({ error }) => {
          if (error) router.replace("/login");
          // auth state change v _layout se postará o přesměrování
        });
    } else {
      router.replace("/login");
    }
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});
