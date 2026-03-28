import { Tabs } from "expo-router";
import { FlaskConical, Lightbulb, Calendar, User } from "lucide-react-native";
import { colors } from "@/constants/theme";

export default function AppLayout() {
  return (
    <Tabs
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
        name="(laborator)"
        options={{
          title: "Laboratoř",
          tabBarIcon: ({ color, size }) => (
            <FlaskConical size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(inspirace)"
        options={{
          title: "Inspirace",
          tabBarIcon: ({ color, size }) => (
            <Lightbulb size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(koucing)"
        options={{
          title: "Koučing",
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
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
