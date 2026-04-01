import { Tabs } from "expo-router";
import { CalendarDays, MessageCircle, FlaskConical, User } from "lucide-react-native";
import { colors } from "@/constants/theme";

export default function AppLayout() {
  return (
    <Tabs
      initialRouteName="(dilna)"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: "#aaa",
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          paddingTop: 4,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="(dilna)"
        options={{
          title: "Dnes",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays size={size} color={color} />
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
          title: "Dílna",
          tabBarIcon: ({ color, size }) => (
            <FlaskConical size={size} color={color} />
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
