import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarDays, MessageCircle, BookOpen, User, BarChart3 } from "lucide-react-native";
import { colors } from "@/constants/theme";

export default function AppLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="(manual)"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: "#aaa",
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          paddingTop: 4,
          paddingBottom: Platform.OS === "android" ? Math.max(insets.bottom, 8) : insets.bottom,
          height: 56 + Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="(manual)"
        options={{
          title: "Dnes",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(reflexe)"
        options={{
          title: "Check-in",
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(koucing)"
        options={{
          title: "Průvodce",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(nastroje)"
        options={{
          title: "Manuál",
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profil)"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
