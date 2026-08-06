import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colorForName } from "../theme";

export function Avatar({
  username,
  avatarUrl,
  size = 40,
}: {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  const initial = username.trim().charAt(0).toUpperCase() || "?";
  return (
    <View
      style={[
        styles.circle,
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colorForName(username) },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: "#eee" },
  fallback: { alignItems: "center", justifyContent: "center" },
  initial: { color: "#fff", fontWeight: "700" },
});
