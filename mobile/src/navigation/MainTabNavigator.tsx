import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FeedStackNavigator } from "./FeedStackNavigator";
import { CreateRecipeScreen } from "../screens/CreateRecipeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { colors } from "../theme";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  FeedTab: "🍲",
  CreateTab: "➕",
  ProfileTab: "👤",
};

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{ICONS[route.name]}</Text>
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontWeight: "700", fontSize: 12 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
        },
      })}
    >
      <Tab.Screen name="FeedTab" component={FeedStackNavigator} options={{ title: "Жорууд" }} />
      <Tab.Screen name="CreateTab" component={CreateRecipeScreen} options={{ title: "Нийтлэх" }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: "Профайл" }} />
    </Tab.Navigator>
  );
}
