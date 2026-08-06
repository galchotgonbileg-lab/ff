import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FeedScreen } from "../screens/FeedScreen";
import { RecipeDetailScreen } from "../screens/RecipeDetailScreen";
import { UserProfileScreen } from "../screens/UserProfileScreen";
import { colors } from "../theme";
import type { FeedStackParamList } from "./types";

const Stack = createNativeStackNavigator<FeedStackParamList>();

export function FeedStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Feed" component={FeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: "Жор" }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: "Профайл" }} />
    </Stack.Navigator>
  );
}
