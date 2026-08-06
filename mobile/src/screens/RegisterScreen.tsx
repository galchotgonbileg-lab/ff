import React, { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getAuthErrorMessage } from "../lib/authError";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { Starfield } from "../components/Starfield";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { GOOGLE_CLIENT_ID } from "../config/google";
import { colors, radius, shadow, spacing, typography } from "../theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await register(email.trim(), password, username.trim());
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
      } catch (err: any) {
        setError(getAuthErrorMessage(err));
      }
    },
    [loginWithGoogle]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Starfield />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>👩‍🍳</Text>
          </View>
          <Text style={styles.appName}>Бүртгүүлэх</Text>
          <Text style={styles.tagline}>Өөрийн жороо хуваалцаж эхэлье</Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TextField
            label="Хэрэглэгчийн нэр"
            placeholder="chef_bataa"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
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
            placeholder="6+ тэмдэгт"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button title="Бүртгүүлэх" onPress={handleSubmit} loading={submitting} style={{ marginTop: spacing.sm }} />

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

        <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
          Бүртгэлтэй юу? <Text style={styles.linkStrong}>Нэвтрэх</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  appName: { ...typography.h2, color: colors.primaryDark },
  tagline: { ...typography.muted, marginTop: spacing.xs, textAlign: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontWeight: "600", fontSize: 14 },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  link: { textAlign: "center", marginTop: spacing.xl, color: colors.textMuted, fontSize: 15 },
  linkStrong: { color: colors.primary, fontWeight: "700" },
});
