import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  PhoneLogin: undefined;
};

export type FeedStackParamList = {
  Feed: undefined;
  RecipeDetail: { recipeId: string };
  UserProfile: { userId: string };
};

export type MainTabParamList = {
  FeedTab: NavigatorScreenParams<FeedStackParamList> | undefined;
  CreateTab: undefined;
  ProfileTab: undefined;
};
