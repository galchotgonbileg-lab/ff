import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

export function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxl * 1.5, paddingHorizontal: spacing.xl },
  emoji: { fontSize: 40, marginBottom: spacing.sm },
  text: { color: colors.textMuted, fontSize: 15, textAlign: "center", lineHeight: 21 },
});
