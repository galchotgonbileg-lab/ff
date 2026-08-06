import React from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { followUser, getUserProfile, unfollowUser } from "../api/recipes";
import { useAuth } from "../context/AuthContext";
import { RecipeCard } from "../components/RecipeCard";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { colors, spacing, typography } from "../theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FeedStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<FeedStackParamList, "UserProfile">;

export function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserProfile(userId),
  });

  const followMutation = useMutation({
    mutationFn: () => (profile?.followedByMe ? unfollowUser(userId) : followUser(userId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user", userId] }),
  });

  if (isLoading || !profile) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  }

  const isOwnProfile = user?.id === userId;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar username={profile.username} avatarUrl={profile.avatarUrl} size={72} />
        <Text style={styles.username}>{profile.username}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.recipes.length}</Text>
            <Text style={styles.statLabel}>жор</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.followerCount}</Text>
            <Text style={styles.statLabel}>дагагч</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.followingCount}</Text>
            <Text style={styles.statLabel}>дагаж буй</Text>
          </View>
        </View>
        {!isOwnProfile && (
          <Button
            title={profile.followedByMe ? "Дагасан ✓" : "Дагах"}
            onPress={() => (user ? followMutation.mutate() : (navigation as any).navigate("Login"))}
            loading={followMutation.isPending}
            style={{ ...styles.followButton, ...(profile.followedByMe ? styles.followButtonActive : null) }}
          />
        )}
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
  statsRow: { flexDirection: "row", gap: spacing.xl, marginTop: spacing.md },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.primary },
  statLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  followButton: { marginTop: spacing.lg, minWidth: 140 },
  followButtonActive: { opacity: 0.7 },
});
