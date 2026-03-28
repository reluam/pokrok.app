import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { colors } from "@/constants/theme";

const queryClient = new QueryClient();

function AuthGate() {
  const { isLoading, isLoggedIn, hasSubscription } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === "(auth)";

    if (!isLoggedIn && !inAuth) {
      router.replace("/(auth)/login");
    } else if (isLoggedIn && !hasSubscription && !inAuth) {
      router.replace("/(auth)/subscription-gate");
    } else if (isLoggedIn && hasSubscription && inAuth) {
      router.replace("/(app)/(laborator)");
    }
  }, [isLoading, isLoggedIn, hasSubscription, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <AuthGate />
      </AuthProvider>
    </QueryClientProvider>
  );
}
