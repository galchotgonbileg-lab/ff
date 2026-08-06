import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { AnimatedPressable } from "./AnimatedPressable";
import { colors, radius, spacing } from "../theme";

export function ActionChip({
  label,
  active,
  onPress,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const pop = useRef(new Animated.Value(1)).current;
  const wasActive = useRef(active);

  useEffect(() => {
    if (active && !wasActive.current) {
      Animated.sequence([
        Animated.spring(pop, { toValue: 1.18, useNativeDriver: true, speed: 40, bounciness: 12 }),
        Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }),
      ]).start();
    }
    wasActive.current = active;
  }, [active, pop]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.94}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Animated.Text style={[styles.text, active && styles.textActive, { transform: [{ scale: pop }] }]}>
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  text: { color: colors.text, fontWeight: "700" },
  textActive: { color: colors.primaryDark },
});
