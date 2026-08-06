import React, { useEffect } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppNotification, getNotifications, markNotificationsRead } from "../api/notifications";
import { useAuth } from "../context/AuthContext";
import { AuthPrompt } from "../components/AuthPrompt";
import { Avatar } from "../components/Avatar";
import { EmptyState } from "../components/EmptyState";
import { colors, spacing, typography } from "../theme";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../navigation/types";

function describe(notification: AppNotification): string {
  switch (notification.type) {
    case "LIKE":
      return `${notification.actor.username} таны "${notification.recipe?.title ?? "жор"}"-д таалагдлаа`;
    case "COMMENT":
      return `${notification.actor.username} таны "${notification.recipe?.title ?? "жор"}"-д сэтгэгдэл бичлээ`;
    case "FOLLOW":
      return `${notification.actor.username} таныг дагалаа`;
  }
}

function icon(type: AppNotification["type"]): string {
  if (type === "LIKE") return "❤️";
  if (type === "COMMENT") return "💬";
  return "👤";
}

export function NotificationsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: !!user,
  });

  useEffect(() => {
    if (!user || notifications.length === 0) return;
    markNotificationsRead().then(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    });
    // Mark-as-read only needs to fire once when the list first has content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, notifications.length > 0]);

  if (!user) {
    return <AuthPrompt emoji="🔔" message="Мэдэгдэл харахын тулд нэвтэрнэ үү" />;
  }

  function openNotification(n: AppNotification) {
    if (n.type === "FOLLOW") {
      navigation.navigate("FeedTab", { screen: "UserProfile", params: { userId: n.actor.id } });
    } else if (n.recipe) {
      navigation.navigate("FeedTab", { screen: "RecipeDetail", params: { recipeId: n.recipe.id } });
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Мэдэгдэл</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              style={[styles.row, !item.read && styles.rowUnread]}
              onPress={() => openNotification(item)}
            >
              <Avatar username={item.actor.username} avatarUrl={item.actor.avatarUrl} size={40} />
              <View style={styles.rowBody}>
                <Text style={styles.rowText}>
                  {icon(item.type)} {describe(item)}
                </Text>
                <Text style={styles.rowTime}>{new Date(item.createdAt).toLocaleString("mn-MN")}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={<EmptyState emoji="🔔" text="Одоогоор мэдэгдэл алга" />}
          contentContainerStyle={{ paddingVertical: spacing.sm, flexGrow: 1 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.surface, paddingTop: spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  heading: { ...typography.h1, fontSize: 26 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowUnread: { backgroundColor: colors.primarySoft },
  rowBody: { flex: 1 },
  rowText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  rowTime: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
