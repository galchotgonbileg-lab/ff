import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getUserFavorites, getUserProfile } from "../api/recipes";
import { RecipeCard } from "../components/RecipeCard";
import { Avatar } from "../components/Avatar";
import { EmptyState } from "../components/EmptyState";
import { AuthPrompt } from "../components/AuthPrompt";
import { colors, radius, spacing, typography } from "../theme";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../navigation/types";

type ProfileTab = "mine" | "saved";

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [tab, setTab] = useState<ProfileTab>("mine");

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: () => getUserProfile(user!.id),
    enabled: !!user,
  });

  const { data: favorites = [], isLoading: isFavoritesLoading } = useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: () => getUserFavorites(user!.id),
    enabled: !!user,
  });

  if (!user) {
    return <AuthPrompt emoji="👤" message="Профайлаа харах, жороо нийтлэхийн тулд нэвтэрнэ үү" />;
  }

  const recipes = tab === "mine" ? profile?.recipes ?? [] : favorites;
  const isLoading = tab === "mine" ? isProfileLoading : isFavoritesLoading;

  function openRecipe(recipeId: string) {
    navigation.navigate("FeedTab", { screen: "RecipeDetail", params: { recipeId } });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar username={user.username} avatarUrl={user.avatarUrl} size={72} />
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statValue}>{profile?.recipes.length ?? "—"}</Text>
          <Text style={styles.statLabel}>жор</Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Гарах</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setTab("mine")}
          style={[styles.tabButton, tab === "mine" && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, tab === "mine" && styles.tabTextActive]}>Миний жор</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setTab("saved")}
          style={[styles.tabButton, tab === "saved" && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, tab === "saved" && styles.tabTextActive]}>Хадгалсан</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RecipeCard recipe={item} onPress={() => openRecipe(item.id)} />}
          ListEmptyComponent={
            <EmptyState
              emoji={tab === "mine" ? "📝" : "🔖"}
              text={tab === "mine" ? "Та одоогоор жор нийтлээгүй байна" : "Та одоогоор жор хадгалаагүй байна"}
            />
          }
          contentContainerStyle={{ paddingVertical: spacing.sm, flexGrow: 1 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.surface, padding: spacing.xl, alignItems: "center" },
  username: { ...typography.h2, marginTop: spacing.md },
  email: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
  statsRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.xs, marginTop: spacing.md },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.primaryDark },
  statLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  logoutButton: {
    marginTop: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  logoutText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  tabs: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  tabButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  tabButtonActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  tabText: { color: colors.text, fontWeight: "700", fontSize: 13 },
  tabTextActive: { color: "#fff" },
});
