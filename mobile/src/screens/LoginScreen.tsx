import React, { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getAuthErrorMessage } from "../lib/authError";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { Starfield } from "../components/Starfield";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { AppStoreBadges } from "../components/AppStoreBadges";
import { GOOGLE_CLIENT_ID } from "../config/google";
import { colors, radius, shadow, spacing, typography } from "../theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigation.navigate("Main");
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const handleGoogleToken = useCallback(
    async (idToken: string) => {
      setError(null);
      try {
        await loginWithGoogle(idToken);
        navigation.navigate("Main");
      } catch (err: any) {
        setError(getAuthErrorMessage(err));
      }
    },
    [loginWithGoogle, navigation]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Starfield />
      {navigation.canGoBack() && (
        <Text accessibilityRole="button" style={styles.closeButton} onPress={() => navigation.goBack()}>
          ✕
        </Text>
      )}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🍲</Text>
          </View>
          <Text style={styles.appName}>FF</Text>
          <Text style={styles.tagline}>Хоолны орц, жор хуваалцдаг сүлжээ</Text>
        </View>

        <AppStoreBadges />

        <View style={styles.card}>
          <Text style={styles.heading}>Тавтай морил</Text>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TextField
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Нууц үг"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button title="Нэвтрэх" onPress={handleSubmit} loading={submitting} style={{ marginTop: spacing.sm }} />

          <Text style={styles.phoneLink} onPress={() => navigation.navigate("PhoneLogin")}>
            Утасны дугаараар нэвтрэх
          </Text>

          {GOOGLE_CLIENT_ID ? (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>эсвэл</Text>
                <View style={styles.dividerLine} />
              </View>
              <GoogleSignInButton onToken={handleGoogleToken} />
            </>
          ) : null}
        </View>

        <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
          Бүртгэлгүй юу? <Text style={styles.linkStrong}>Бүртгүүлэх</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  closeButton: {
    position: "absolute",
    top: spacing.xl,
    right: spacing.xl,
    zIndex: 1,
    fontSize: 20,
    color: colors.textMuted,
    padding: spacing.sm,
  },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
  brand: { alignItems: "center", marginBottom: spacing.xl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    ...shadow.floating,
  },
  logoText: { fontSize: 30 },
  appName: { ...typography.h1, color: colors.primaryDark },
  tagline: { ...typography.muted, marginTop: spacing.xs, textAlign: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heading: { ...typography.h2, marginBottom: spacing.lg },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontWeight: "600", fontSize: 14 },
  phoneLink: { textAlign: "center", marginTop: spacing.md, color: colors.primary, fontWeight: "600", fontSize: 14 },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  link: { textAlign: "center", marginTop: spacing.xl, color: colors.textMuted, fontSize: 15 },
  linkStrong: { color: colors.primary, fontWeight: "700" },
});
