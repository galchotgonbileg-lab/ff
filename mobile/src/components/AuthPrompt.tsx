import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button } from "./Button";
import { colors, spacing, typography } from "../theme";

export function AuthPrompt({ emoji = "🔒", message }: { emoji?: string; message: string }) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.message}>{message}</Text>
      <Button title="Нэвтрэх" onPress={() => navigation.navigate("Login")} style={styles.button} />
      <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
        Бүртгэлгүй юу? <Text style={styles.linkStrong}>Бүртгүүлэх</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, backgroundColor: colors.background },
  emoji: { fontSize: 40, marginBottom: spacing.md },
  message: { ...typography.body, color: colors.textMuted, textAlign: "center", marginBottom: spacing.lg },
  button: { minWidth: 180 },
  link: { marginTop: spacing.lg, color: colors.textMuted, fontSize: 14 },
  linkStrong: { color: colors.primary, fontWeight: "700" },
});
