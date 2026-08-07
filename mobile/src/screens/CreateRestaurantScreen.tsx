import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRestaurant } from "../api/restaurants";
import { useAuth } from "../context/AuthContext";
import { AuthPrompt } from "../components/AuthPrompt";
import { PRICE_RANGES, RESTAURANT_CATEGORIES } from "../lib/restaurantOptions";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { colors, radius, spacing, typography } from "../theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RestaurantStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RestaurantStackParamList, "CreateRestaurant">;

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

export function CreateRestaurantScreen({ navigation }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState(RESTAURANT_CATEGORIES[0]);
  const [priceRange, setPriceRange] = useState<(typeof PRICE_RANGES)[number]>("Дунд");
  const [imageUri, setImageUri] = useState<string | undefined>();

  const mutation = useMutation({
    mutationFn: createRestaurant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-feed"] });
      setName("");
      setDescription("");
      setAddress("");
      setPhone("");
      setCategory(RESTAURANT_CATEGORIES[0]);
      setPriceRange("Дунд");
      setImageUri(undefined);
      navigation.navigate("Restaurants");
    },
    onError: (err: any) => {
      Alert.alert("Нэмэхэд алдаа гарлаа", err?.response?.data?.error ?? "Дахин оролдоно уу");
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
      setImageUri(result.assets[0].uri);
    }
  }

  function handleSubmit() {
    if (!name.trim() || !description.trim() || !address.trim()) {
      Alert.alert("Дутуу мэдээлэл", "Нэр, тайлбар, хаяг заавал оруулна уу");
      return;
    }

    mutation.mutate({
      name: name.trim(),
      description: description.trim(),
      address: address.trim(),
      phone: phone.trim() || undefined,
      category,
      priceRange,
      imageUri,
    });
  }

  if (!user) {
    return <AuthPrompt emoji="🏠" message="Ресторан нэмэхийн тулд нэвтэрнэ үү" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <Text style={styles.heading}>Шинэ ресторан нэмэх</Text>

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

      <View style={styles.section}>
        <TextField label="Нэр" value={name} onChangeText={setName} placeholder="Жишээ: Модерн Ноён" />
        <TextField
          label="Тайлбар"
          style={styles.multiline}
          value={description}
          onChangeText={setDescription}
          placeholder="Богино тайлбар"
          multiline
        />
        <TextField label="Хаяг" value={address} onChangeText={setAddress} placeholder="Жишээ: СБД, 1-р хороо, ..." />
        <TextField label="Утас" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="99112233" />
      </View>

      <OptionChips label="Төрөл" options={RESTAURANT_CATEGORIES} value={category} onChange={setCategory} />
      <OptionChips
        label="Үнийн төвшин"
        options={PRICE_RANGES}
        value={priceRange}
        onChange={(v) => setPriceRange(v as typeof priceRange)}
      />

      <Button
        title="Нэмэх"
        onPress={handleSubmit}
        loading={mutation.isPending}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
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
});
