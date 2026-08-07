import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { FeedStackNavigator } from "./FeedStackNavigator";
import { RestaurantStackNavigator } from "./RestaurantStackNavigator";
import { CreateRecipeScreen } from "../screens/CreateRecipeScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { getUnreadCount } from "../api/notifications";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  FeedTab: "🍲",
  CreateTab: "➕",
  RestaurantTab: "🏠",
  NotificationsTab: "🔔",
  ProfileTab: "👤",
};

export function MainTabNavigator() {
  const { user } = useAuth();
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: getUnreadCount,
    enabled: !!user,
    refetchInterval: 30000,
  });

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
        tabBarBadgeStyle: { backgroundColor: colors.danger },
      })}
    >
      <Tab.Screen name="FeedTab" component={FeedStackNavigator} options={{ title: "Жорууд" }} />
      <Tab.Screen name="CreateTab" component={CreateRecipeScreen} options={{ title: "Нийтлэх" }} />
      <Tab.Screen name="RestaurantTab" component={RestaurantStackNavigator} options={{ title: "Ресторан" }} />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{ title: "Мэдэгдэл", tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: "Профайл" }} />
    </Tab.Navigator>
  );
}
