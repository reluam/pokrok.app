import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../../lib/theme";

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💬" label="Chat" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="topics"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🧭" label="Témata" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" label="Nastavení" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabEmoji: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.muted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
});
