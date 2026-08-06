import React from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "../api/recipes";
import { RecipeCard } from "../components/RecipeCard";
import { Avatar } from "../components/Avatar";
import { EmptyState } from "../components/EmptyState";
import { colors, spacing, typography } from "../theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FeedStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<FeedStackParamList, "UserProfile">;

export function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserProfile(userId),
  });

  if (isLoading || !profile) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar username={profile.username} avatarUrl={profile.avatarUrl} size={72} />
        <Text style={styles.username}>{profile.username}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statValue}>{profile.recipes.length}</Text>
          <Text style={styles.statLabel}>жор</Text>
        </View>
      </View>

      <FlatList
        data={profile.recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={{ ...item, author: { id: profile.id, username: profile.username, avatarUrl: profile.avatarUrl } }}
            onPress={() => navigation.push("RecipeDetail", { recipeId: item.id })}
          />
        )}
        ListEmptyComponent={<EmptyState emoji="📭" text="Энэ хэрэглэгч одоогоор жор нийтлээгүй байна" />}
        contentContainerStyle={{ paddingVertical: spacing.sm, flexGrow: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.surface, padding: spacing.xl, alignItems: "center" },
  username: { ...typography.h2, marginTop: spacing.md },
  statsRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.xs, marginTop: spacing.md },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.primary },
  statLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
});
