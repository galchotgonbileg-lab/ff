import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RestaurantsScreen } from "../screens/RestaurantsScreen";
import { RestaurantDetailScreen } from "../screens/RestaurantDetailScreen";
import { CreateRestaurantScreen } from "../screens/CreateRestaurantScreen";
import { colors } from "../theme";
import type { RestaurantStackParamList } from "./types";

const Stack = createNativeStackNavigator<RestaurantStackParamList>();

export function RestaurantStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Restaurants" component={RestaurantsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} options={{ title: "Ресторан" }} />
      <Stack.Screen name="CreateRestaurant" component={CreateRestaurantScreen} options={{ title: "Ресторан нэмэх" }} />
    </Stack.Navigator>
  );
}
