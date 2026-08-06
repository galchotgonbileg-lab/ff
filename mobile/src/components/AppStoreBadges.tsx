import React from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";

function notifyComingSoon(store: string) {
  Alert.alert("Тун удахгүй", `${store} дээр удахгүй нийтлэгдэнэ`);
}

export function AppStoreBadges() {
  if (Platform.OS !== "web") return null;

  return (
    <View style={styles.container}>
      <Text style={styles.caption}>Мөн мобайл аппаараа ашиглаарай</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          style={styles.badge}
          onPress={() => notifyComingSoon("Google Play")}
        >
          <Text style={styles.badgeIcon}>🤖</Text>
          <View>
            <Text style={styles.badgeSmall}>GET IT ON</Text>
            <Text style={styles.badgeStore}>Google Play</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.badge}
          onPress={() => notifyComingSoon("App Store")}
        >
          <Text style={styles.badgeIcon}>🍎</Text>
          <View>
            <Text style={styles.badgeSmall}>DOWNLOAD ON THE</Text>
            <Text style={styles.badgeStore}>App Store</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginBottom: spacing.lg },
  caption: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgeIcon: { fontSize: 20 },
  badgeSmall: { color: colors.textMuted, fontSize: 8, fontWeight: "600", letterSpacing: 0.4 },
  badgeStore: { color: colors.text, fontSize: 13, fontWeight: "700" },
});
