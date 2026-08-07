import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ActivityIndicator } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRestaurant,
  likeRestaurant,
  postRestaurantComment,
  saveRestaurant,
  unlikeRestaurant,
  unsaveRestaurant,
} from "../api/restaurants";
import { resolveImageUrl } from "../api/recipes";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "../components/Avatar";
import { ActionChip } from "../components/ActionChip";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { colors, radius, shadow, spacing, typography } from "../theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RestaurantStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RestaurantStackParamList, "RestaurantDetail">;

function RestaurantFacts({ restaurant }: { restaurant: NonNullable<Awaited<ReturnType<typeof getRestaurant>>> }) {
  const facts = [
    restaurant.category ? ["Төрөл", restaurant.category] : undefined,
    restaurant.priceRange ? ["Үнэ", restaurant.priceRange] : undefined,
    restaurant.phone ? ["Утас", restaurant.phone] : undefined,
  ].filter(Boolean) as string[][];

  if (facts.length === 0) return null;

  return (
    <View style={styles.facts}>
      {facts.map(([label, value]) => (
        <View key={label} style={styles.factItem}>
          <Text style={styles.factLabel}>{label}</Text>
          <Text style={styles.factValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

export function RestaurantDetailScreen({ route, navigation }: Props) {
  const { restaurantId } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  function requireAuth(action: () => void) {
    if (user) {
      action();
    } else {
      (navigation as any).navigate("Login");
    }
  }

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: () => getRestaurant(restaurantId),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["restaurant", restaurantId] });
    queryClient.invalidateQueries({ queryKey: ["restaurant-feed"] });
  };

  const likeMutation = useMutation({
    mutationFn: () => (restaurant?.likedByMe ? unlikeRestaurant(restaurantId) : likeRestaurant(restaurantId)),
    onSuccess: refresh,
  });

  const saveMutation = useMutation({
    mutationFn: () => (restaurant?.savedByMe ? unsaveRestaurant(restaurantId) : saveRestaurant(restaurantId)),
    onSuccess: refresh,
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => postRestaurantComment(restaurantId, text),
    onSuccess: () => {
      setCommentText("");
      refresh();
    },
  });

  if (isLoading || !restaurant) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  }

  const imageUrl = resolveImageUrl(restaurant.imageUrl);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderEmoji}>🏠</Text>
          </View>
        )}
        <View style={styles.body}>
          <Text style={styles.title}>{restaurant.name}</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.authorRow}
            onPress={() => (navigation as any).navigate("FeedTab", { screen: "UserProfile", params: { userId: restaurant.author.id } })}
          >
            <Avatar username={restaurant.author.username} avatarUrl={restaurant.author.avatarUrl} size={26} />
            <Text style={styles.author}>{restaurant.author.username}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={styles.addressRow}
            onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`)}
          >
            <Text style={styles.address}>📍 {restaurant.address}</Text>
          </Pressable>

          <RestaurantFacts restaurant={restaurant} />
          <Text style={styles.description}>{restaurant.description}</Text>

          <View style={styles.actionRow}>
            <ActionChip
              label={`${restaurant.likedByMe ? "❤️" : "🤍"} ${restaurant.likeCount}`}
              active={!!restaurant.likedByMe}
              onPress={() => requireAuth(() => likeMutation.mutate())}
              disabled={likeMutation.isPending}
            />
            <ActionChip
              label={`${restaurant.savedByMe ? "🔖" : "📑"} ${restaurant.savedByMe ? "Хадгалсан" : "Хадгалах"}`}
              active={!!restaurant.savedByMe}
              onPress={() => requireAuth(() => saveMutation.mutate())}
              disabled={saveMutation.isPending}
            />
          </View>

          <Text style={styles.sectionTitle}>Сэтгэгдэл ({restaurant.commentCount})</Text>
          {restaurant.comments.length === 0 ? (
            <Text style={styles.noComments}>Хараахан сэтгэгдэл алга. Анхных нь бичээрэй!</Text>
          ) : (
            restaurant.comments.map((c) => (
              <View key={c.id} style={styles.comment}>
                <View style={styles.commentAuthorRow}>
                  <Avatar username={c.user.username} avatarUrl={c.user.avatarUrl} size={22} />
                  <Text style={styles.commentAuthor}>{c.user.username}</Text>
                </View>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      {user ? (
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Сэтгэгдэл бичих..."
            placeholderTextColor={colors.textMuted}
            value={commentText}
            onChangeText={setCommentText}
          />
          <AnimatedPressable
            accessibilityRole="button"
            scaleTo={0.88}
            style={[styles.sendButton, (!commentText.trim() || commentMutation.isPending) && styles.sendButtonDisabled]}
            disabled={!commentText.trim() || commentMutation.isPending}
            onPress={() => commentMutation.mutate(commentText.trim())}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          style={styles.commentLoginRow}
          onPress={() => (navigation as any).navigate("Login")}
        >
          <Text style={styles.commentLoginText}>Сэтгэгдэл бичихийн тулд нэвтэрнэ үү</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  image: { width: "100%", height: 260, backgroundColor: colors.primarySoft },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  imagePlaceholderEmoji: { fontSize: 48 },
  body: { padding: spacing.lg, backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, marginTop: -radius.xl },
  title: { ...typography.h1, fontSize: 24 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  author: { color: colors.textMuted, fontWeight: "700", fontSize: 14 },
  addressRow: { marginTop: spacing.sm },
  address: { color: colors.primaryDark, fontWeight: "600", fontSize: 14 },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg },
  factItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  factLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  factValue: { color: colors.text, fontWeight: "700", marginTop: 2 },
  description: { ...typography.body, marginTop: spacing.md, fontSize: 16, lineHeight: 22, color: colors.textMuted },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg },
  sectionTitle: { ...typography.h3, fontSize: 18, marginTop: spacing.xl, marginBottom: spacing.sm },
  noComments: { color: colors.textMuted, fontStyle: "italic" },
  comment: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  commentAuthorRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  commentAuthor: { fontWeight: "700", color: colors.text, fontSize: 13 },
  commentText: { color: colors.textMuted, marginLeft: 30 },
  commentInputRow: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  commentLoginRow: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  commentLoginText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
});
