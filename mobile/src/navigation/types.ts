import type { NavigatorScreenParams } from "@react-navigation/native";

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

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Login: undefined;
  Register: undefined;
  PhoneLogin: undefined;
};
