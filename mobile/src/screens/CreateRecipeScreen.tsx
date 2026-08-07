import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRecipe, detectIngredients } from "../api/recipes";
import { getIngredients, IngredientEntry } from "../api/ingredients";
import { useAuth } from "../context/AuthContext";
import { AuthPrompt } from "../components/AuthPrompt";
import { DIFFICULTIES, RECIPE_CATEGORIES } from "../lib/recipeOptions";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { colors, radius, spacing, typography } from "../theme";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../navigation/types";

type Props = BottomTabScreenProps<MainTabParamList, "CreateTab">;

function EditableList({
  label,
  placeholder,
  items,
  onChange,
  suggestionPool,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
  suggestionPool?: IngredientEntry[];
}) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  function updateItem(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function suggestionsFor(query: string): IngredientEntry[] {
    const q = query.trim().toLowerCase();
    if (!suggestionPool || q.length < 1) return [];
    return suggestionPool.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6);
  }

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {items.map((item, i) => {
        const suggestions = focusedIndex === i ? suggestionsFor(item) : [];
        return (
          <View key={i} style={styles.listRow}>
            <View style={styles.listIndex}>
              <Text style={styles.listIndexText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                style={{ marginBottom: 0 }}
                placeholder={`${placeholder} ${i + 1}`}
                value={item}
                onChangeText={(v) => updateItem(i, v)}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setTimeout(() => setFocusedIndex((f) => (f === i ? null : f)), 150)}
              />
              {suggestions.length > 0 && (
                <View style={styles.suggestBox}>
                  {suggestions.map((s) => (
                    <Pressable
                      key={s.name}
                      accessibilityRole="button"
                      style={styles.suggestRow}
                      onPress={() => {
                        updateItem(i, s.name);
                        setFocusedIndex(null);
                      }}
                    >
                      <Text style={styles.suggestName}>{s.name}</Text>
                      <Text style={styles.suggestDesc} numberOfLines={1}>
                        {s.description}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <Pressable accessibilityRole="button" onPress={() => removeItem(i)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>✕</Text>
            </Pressable>
          </View>
        );
      })}
      <Pressable accessibilityRole="button" onPress={() => onChange([...items, ""])} style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Нэмэх</Text>
      </Pressable>
    </View>
  );
}

function OptionChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map((option) => (
          <Pressable
            accessibilityRole="button"
            key={option}
            onPress={() => onChange(option)}
            style={[styles.chip, value === option && styles.chipActive]}
          >
            <Text style={[styles.chipText, value === option && styles.chipTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function toPositiveNumber(value: string) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function mergeSuggestedIngredients(existing: string[], suggested: string[]): string[] {
  if (existing.length === 1 && existing[0] === "") {
    return suggested;
  }
  const existingLower = new Set(existing.map((i) => i.trim().toLowerCase()).filter(Boolean));
  const newOnes = suggested.filter((s) => !existingLower.has(s.trim().toLowerCase()));
  return [...existing, ...newOnes];
}

export function CreateRecipeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: ingredientPool } = useQuery({
    queryKey: ["ingredients"],
    queryFn: getIngredients,
    staleTime: 1000 * 60 * 60,
  });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [category, setCategory] = useState(RECIPE_CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("Амархан");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [detecting, setDetecting] = useState(false);
  const [aiSuggestedCount, setAiSuggestedCount] = useState(0);

  const mutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      setTitle("");
      setDescription("");
      setIngredients([""]);
      setSteps([""]);
      setCategory(RECIPE_CATEGORIES[0]);
      setDifficulty("Амархан");
      setPrepTime("");
      setCookTime("");
      setServings("");
      setImageUri(undefined);
      setAiSuggestedCount(0);
      navigation.navigate("FeedTab", { screen: "Feed" });
    },
    onError: (err: any) => {
      Alert.alert("Нийтлэхэд алдаа гарлаа", err?.response?.data?.error ?? "Дахин оролдоно уу");
    },
  });

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Зөвшөөрөл хэрэгтэй", "Зураг сонгохын тулд медиа сан руу хандах зөвшөөрөл өгнө үү");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setAiSuggestedCount(0);
      setDetecting(true);
      const suggestions = await detectIngredients(uri);
      setDetecting(false);
      if (suggestions.length > 0) {
        setIngredients((prev) => mergeSuggestedIngredients(prev, suggestions));
        setAiSuggestedCount(suggestions.length);
      }
    }
  }

  function handleSubmit() {
    const cleanIngredients = ingredients.map((i) => i.trim()).filter(Boolean);
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);

    if (!title.trim() || !description.trim() || cleanIngredients.length === 0 || cleanSteps.length === 0) {
      Alert.alert("Дутуу мэдээлэл", "Гарчиг, тайлбар, дор хаяж нэг орц, нэг алхам оруулна уу");
      return;
    }

    mutation.mutate({
      title: title.trim(),
      description: description.trim(),
      ingredients: cleanIngredients,
      steps: cleanSteps,
      category,
      difficulty,
      prepTime: toPositiveNumber(prepTime),
      cookTime: toPositiveNumber(cookTime),
      servings: toPositiveNumber(servings),
      imageUri,
    });
  }

  if (!user) {
    return <AuthPrompt emoji="📝" message="Жор нийтлэхийн тулд нэвтэрнэ үү" />;
  }

  return (
    <View style={styles.container}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <Text style={styles.heading}>Шинэ жор нийтлэх</Text>

      <Pressable accessibilityRole="button" style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <>
            <Text style={styles.imagePickerEmoji}>📷</Text>
            <Text style={styles.imagePickerText}>Зураг сонгох</Text>
          </>
        )}
      </Pressable>
      {detecting && (
        <View style={styles.detectingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.detectingText}>Орц тодорхойлж байна...</Text>
        </View>
      )}

      <View style={styles.section}>
        <TextField label="Гарчиг" value={title} onChangeText={setTitle} placeholder="Жишээ: Буузны жор" />
        <TextField
          label="Тайлбар"
          style={styles.multiline}
          value={description}
          onChangeText={setDescription}
          placeholder="Богино тайлбар"
          multiline
        />
      </View>

      <OptionChips label="Ангилал" options={RECIPE_CATEGORIES} value={category} onChange={setCategory} />
      <OptionChips label="Төвшин" options={DIFFICULTIES} value={difficulty} onChange={(v) => setDifficulty(v as typeof difficulty)} />

      <View style={styles.metaRow}>
        <View style={styles.metaField}>
          <TextField label="Бэлтгэх мин" value={prepTime} onChangeText={setPrepTime} keyboardType="number-pad" placeholder="15" />
        </View>
        <View style={styles.metaField}>
          <TextField label="Болох мин" value={cookTime} onChangeText={setCookTime} keyboardType="number-pad" placeholder="30" />
        </View>
        <View style={styles.metaField}>
          <TextField label="Порц" value={servings} onChangeText={setServings} keyboardType="number-pad" placeholder="4" />
        </View>
      </View>

      {aiSuggestedCount > 0 && (
        <Text style={styles.aiCaption}>🤖 Зурган дээрх орцыг санал болголоо — шалгаад засварлана уу</Text>
      )}
      <EditableList
        label="Орц"
        placeholder="Орц"
        items={ingredients}
        onChange={setIngredients}
        suggestionPool={ingredientPool}
      />
      <EditableList label="Хийх дараалал" placeholder="Алхам" items={steps} onChange={setSteps} />

      <Button
        title="Нийтлэх"
        onPress={handleSubmit}
        loading={mutation.isPending}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heading: { ...typography.h1, fontSize: 24, marginBottom: spacing.lg },
  section: { marginBottom: spacing.sm },
  label: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  imagePicker: {
    height: 170,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  imagePickerEmoji: { fontSize: 30, marginBottom: spacing.xs },
  imagePickerText: { color: colors.textMuted, fontWeight: "600" },
  imagePreview: { width: "100%", height: "100%" },
  detectingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
  },
  detectingText: { color: colors.textMuted, fontSize: 13 },
  aiCaption: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: "#fff" },
  metaRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  metaField: { flex: 1 },
  listRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: spacing.sm },
  listIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  listIndexText: { color: colors.primaryDark, fontWeight: "700", fontSize: 12 },
  removeButton: { padding: spacing.sm, marginTop: 2 },
  removeButtonText: { color: colors.textMuted, fontSize: 16 },
  addButton: { alignSelf: "flex-start", marginTop: spacing.xs },
  addButtonText: { color: colors.primary, fontWeight: "700" },
  suggestBox: {
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  suggestRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestName: { color: colors.text, fontWeight: "700", fontSize: 14 },
  suggestDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
