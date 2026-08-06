import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { Recipe } from "../api/types";
import { resolveImageUrl } from "../api/recipes";
import { Avatar } from "./Avatar";
import { AnimatedPressable } from "./AnimatedPressable";
import { colors, radius, shadow, spacing, typography } from "../theme";

function buildMeta(recipe: Recipe) {
  const time = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  return [
    recipe.category,
    time ? `⏱ ${time} мин` : undefined,
    recipe.servings ? `🍽 ${recipe.servings}` : undefined,
    recipe.difficulty,
  ].filter(Boolean);
}

export function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const imageUrl = resolveImageUrl(recipe.imageUrl);
  const meta = buildMeta(recipe);
  const authorName = recipe.author?.username ?? "Нэргүй хэрэглэгч";

  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [enter]);

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }}
    >
      <AnimatedPressable accessibilityRole="button" onPress={onPress} scaleTo={0.98} style={styles.card}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderEmoji}>🍽️</Text>
          </View>
        )}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {recipe.title}
          </Text>

          <View style={styles.authorRow}>
            <Avatar username={authorName} avatarUrl={recipe.author?.avatarUrl} size={20} />
            <Text style={styles.author} numberOfLines={1}>
              {authorName}
            </Text>
          </View>

          {meta.length > 0 && (
            <View style={styles.metaWrap}>
              {meta.map((m) => (
                <Text key={m} style={styles.metaChip}>
                  {m}
                </Text>
              ))}
            </View>
          )}

          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>

          <View style={styles.stats}>
            <Text style={styles.statText}>❤️ {recipe.likeCount}</Text>
            <Text style={styles.statText}>💬 {recipe.commentCount}</Text>
            <Text style={styles.statText}>🔖 {recipe.favoriteCount}</Text>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    overflow: "hidden",
    ...shadow.card,
  },
  image: { width: "100%", height: 170, backgroundColor: colors.primarySoft },
  placeholder: { alignItems: "center", justifyContent: "center" },
  placeholderEmoji: { fontSize: 36 },
  body: { padding: spacing.lg },
  title: { ...typography.h3, fontSize: 18 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  author: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  metaWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  metaChip: {
    color: colors.primaryDark,
    backgroundColor: colors.primarySoft,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  description: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
  stats: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  statText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
});
