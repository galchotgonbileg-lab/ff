import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getFeed } from "../api/recipes";
import { RecipeCard } from "../components/RecipeCard";
import { EmptyState } from "../components/EmptyState";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { RECIPE_CATEGORIES } from "../lib/recipeOptions";
import { colors, radius, spacing, typography } from "../theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FeedStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<FeedStackParamList, "Feed">;

export function FeedScreen({ navigation }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<"new" | "top">("new");

  const { data, isLoading, isRefetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["feed", search, category, sort],
      initialPageParam: 1,
      queryFn: ({ pageParam }) =>
        getFeed({ search: search || undefined, category, sort, page: pageParam }),
      getNextPageParam: (lastPage) =>
        lastPage.recipes.length < lastPage.pageSize ? undefined : lastPage.page + 1,
    });

  const recipes = data?.pages.flatMap((p) => p.recipes) ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Жорууд</Text>
          <View style={styles.sortToggle}>
            <AnimatedPressable
              accessibilityRole="button"
              scaleTo={0.94}
              onPress={() => setSort("new")}
              style={[styles.sortOption, sort === "new" && styles.sortOptionActive]}
            >
              <Text style={[styles.sortText, sort === "new" && styles.sortTextActive]}>Шинэ</Text>
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityRole="button"
              scaleTo={0.94}
              onPress={() => setSort("top")}
              style={[styles.sortOption, sort === "top" && styles.sortOptionActive]}
            >
              <Text style={[styles.sortText, sort === "top" && styles.sortTextActive]}>🔥 ТОП</Text>
            </AnimatedPressable>
          </View>
        </View>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.search}
            placeholder="Жор эсвэл орц хайх..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >
        <AnimatedPressable
          accessibilityRole="button"
          scaleTo={0.92}
          onPress={() => setCategory(undefined)}
          style={[styles.categoryChip, !category && styles.categoryChipActive]}
        >
          <Text style={[styles.categoryText, !category && styles.categoryTextActive]}>Бүгд</Text>
        </AnimatedPressable>
        {RECIPE_CATEGORIES.map((item) => (
          <AnimatedPressable
            accessibilityRole="button"
            key={item}
            scaleTo={0.92}
            onPress={() => setCategory(item)}
            style={[styles.categoryChip, category === item && styles.categoryChipActive]}
          >
            <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>
              {item}
            </Text>
          </AnimatedPressable>
        ))}
      </ScrollView>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() => navigation.navigate("RecipeDetail", { recipeId: item.id })}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<EmptyState emoji="🍳" text="Одоогоор жор алга байна. Анхныхаа жороо нийтэлж үзээрэй!" />}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : null
          }
          contentContainerStyle={{ paddingVertical: spacing.sm, flexGrow: 1 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.surface, paddingTop: spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  heading: { ...typography.h1, fontSize: 26 },
  sortToggle: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: radius.full,
    padding: 3,
    gap: 2,
  },
  sortOption: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full },
  sortOptionActive: { backgroundColor: colors.primary },
  sortText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  sortTextActive: { color: "#fff" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  searchIcon: { fontSize: 15, marginRight: spacing.sm },
  search: { flex: 1, paddingVertical: 11, fontSize: 15, color: colors.text },
  categoryList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  categoryChip: {
    height: 36,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  categoryChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  categoryText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  categoryTextActive: { color: "#fff" },
});
