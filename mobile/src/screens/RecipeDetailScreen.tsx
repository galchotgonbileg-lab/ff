import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
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
  getRecipe,
  likeRecipe,
  postComment,
  resolveImageUrl,
  saveRecipe,
  unlikeRecipe,
  unsaveRecipe,
} from "../api/recipes";
import { Avatar } from "../components/Avatar";
import { ActionChip } from "../components/ActionChip";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { colors, radius, shadow, spacing, typography } from "../theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FeedStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<FeedStackParamList, "RecipeDetail">;

function RecipeFacts({ recipe }: { recipe: NonNullable<Awaited<ReturnType<typeof getRecipe>>> }) {
  const facts = [
    recipe.category ? ["Ангилал", recipe.category] : undefined,
    recipe.prepTime ? ["Бэлтгэх", `${recipe.prepTime} мин`] : undefined,
    recipe.cookTime ? ["Болох", `${recipe.cookTime} мин`] : undefined,
    recipe.servings ? ["Порц", `${recipe.servings}`] : undefined,
    recipe.difficulty ? ["Төвшин", recipe.difficulty] : undefined,
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

export function RecipeDetailScreen({ route, navigation }: Props) {
  const { recipeId } = route.params;
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: recipe, isLoading } = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => getRecipe(recipeId),
  });

  const refreshRecipe = () => {
    queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  };

  const likeMutation = useMutation({
    mutationFn: () => (recipe?.likedByMe ? unlikeRecipe(recipeId) : likeRecipe(recipeId)),
    onSuccess: refreshRecipe,
  });

  const saveMutation = useMutation({
    mutationFn: () => (recipe?.savedByMe ? unsaveRecipe(recipeId) : saveRecipe(recipeId)),
    onSuccess: refreshRecipe,
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => postComment(recipeId, text),
    onSuccess: () => {
      setCommentText("");
      refreshRecipe();
    },
  });

  if (isLoading || !recipe) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  }

  const imageUrl = resolveImageUrl(recipe.imageUrl);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderEmoji}>🍽️</Text>
          </View>
        )}
        <View style={styles.body}>
          <Text style={styles.title}>{recipe.title}</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.authorRow}
            onPress={() => navigation.push("UserProfile", { userId: recipe.author.id })}
          >
            <Avatar username={recipe.author.username} avatarUrl={recipe.author.avatarUrl} size={26} />
            <Text style={styles.author}>{recipe.author.username}</Text>
          </Pressable>
          <RecipeFacts recipe={recipe} />
          <Text style={styles.description}>{recipe.description}</Text>

          <View style={styles.actionRow}>
            <ActionChip
              label={`${recipe.likedByMe ? "❤️" : "🤍"} ${recipe.likeCount}`}
              active={!!recipe.likedByMe}
              onPress={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            />
            <ActionChip
              label={`${recipe.savedByMe ? "🔖" : "📑"} ${recipe.savedByMe ? "Хадгалсан" : "Хадгалах"}`}
              active={!!recipe.savedByMe}
              onPress={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            />
          </View>

          <Text style={styles.sectionTitle}>Орц</Text>
          <View style={styles.listBox}>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={styles.listRow}>
                <View style={styles.dot} />
                <Text style={styles.listItem}>{ing}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Хийх дараалал</Text>
          <View style={styles.listBox}>
            {recipe.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{i + 1}</Text>
                </View>
                <Text style={styles.listItem}>{step}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Сэтгэгдэл ({recipe.commentCount})</Text>
          {recipe.comments.length === 0 ? (
            <Text style={styles.noComments}>Хараахан сэтгэгдэл алга. Анхных нь бичээрэй!</Text>
          ) : (
            recipe.comments.map((c) => (
              <View key={c.id} style={styles.comment}>
                <Pressable
                  accessibilityRole="button"
                  style={styles.commentAuthorRow}
                  onPress={() => navigation.push("UserProfile", { userId: c.user.id })}
                >
                  <Avatar username={c.user.username} avatarUrl={c.user.avatarUrl} size={22} />
                  <Text style={styles.commentAuthor}>{c.user.username}</Text>
                </Pressable>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  listBox: { gap: spacing.sm },
  listRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: spacing.sm },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  listItem: { flex: 1, fontSize: 15, lineHeight: 21, color: colors.text },
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
});
