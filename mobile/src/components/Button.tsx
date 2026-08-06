import React from "react";
import { ActivityIndicator, StyleSheet, Text, ViewStyle } from "react-native";
import { AnimatedPressable } from "./AnimatedPressable";
import { colors, radius } from "../theme";

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline";
  style?: ViewStyle;
}) {
  const isOutline = variant === "outline";
  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.97}
      style={[
        styles.base,
        isOutline ? styles.outline : styles.primary,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : "#fff"} />
      ) : (
        <Text style={[styles.text, isOutline ? styles.textOutline : styles.textPrimary]}>{title}</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary },
  disabled: { opacity: 0.55 },
  text: { fontSize: 16, fontWeight: "700" },
  textPrimary: { color: "#fff" },
  textOutline: { color: colors.primary },
});
