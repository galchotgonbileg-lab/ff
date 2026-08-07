import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { Restaurant } from "../api/types";
import { resolveImageUrl } from "../api/recipes";
import { Avatar } from "./Avatar";
import { AnimatedPressable } from "./AnimatedPressable";
import { colors, radius, shadow, spacing, typography } from "../theme";

function buildMeta(restaurant: Restaurant) {
  return [restaurant.category, restaurant.priceRange].filter(Boolean);
}

export function RestaurantCard({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  const imageUrl = resolveImageUrl(restaurant.imageUrl);
  const meta = buildMeta(restaurant);
  const authorName = restaurant.author?.username ?? "Нэргүй хэрэглэгч";

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
            <Text style={styles.placeholderEmoji}>🏠</Text>
          </View>
        )}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {restaurant.name}
          </Text>

          <Text style={styles.address} numberOfLines={1}>
            📍 {restaurant.address}
          </Text>

          <View style={styles.authorRow}>
            <Avatar username={authorName} avatarUrl={restaurant.author?.avatarUrl} size={20} />
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
            {restaurant.description}
          </Text>

          <View style={styles.stats}>
            <Text style={styles.statText}>❤️ {restaurant.likeCount}</Text>
            <Text style={styles.statText}>💬 {restaurant.commentCount}</Text>
            <Text style={styles.statText}>🔖 {restaurant.favoriteCount}</Text>
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
  address: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
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
