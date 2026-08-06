import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getPhoneAuthErrorMessage } from "../lib/authError";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { Starfield } from "../components/Starfield";
import { colors, radius, shadow, spacing, typography } from "../theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "PhoneLogin">;

export function PhoneLoginScreen({ navigation }: Props) {
  const { requestPhoneCode, verifyPhoneCode } = useAuth();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode() {
    setSubmitting(true);
    setError(null);
    try {
      await requestPhoneCode(phone.trim());
      setStep("code");
    } catch (err: any) {
      setError(getPhoneAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify() {
    setSubmitting(true);
    setError(null);
    try {
      await verifyPhoneCode(phone.trim(), code.trim());
      navigation.navigate("Main");
    } catch (err: any) {
      setError(getPhoneAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

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
            <Text style={styles.logoText}>📱</Text>
          </View>
          <Text style={styles.appName}>FF</Text>
          <Text style={styles.tagline}>
            {step === "phone" ? "Утасны дугаараар нэвтрэх" : "Ирсэн кодоо оруулна уу"}
          </Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {step === "phone" ? (
            <>
              <TextField
                label="Утасны дугаар"
                placeholder="99112233"
                autoCapitalize="none"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <Button
                title="Код авах"
                onPress={handleSendCode}
                loading={submitting}
                disabled={phone.trim().length < 8}
                style={{ marginTop: spacing.sm }}
              />
            </>
          ) : (
            <>
              <TextField
                label="6 оронтой код"
                placeholder="123456"
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
              />
              <Button
                title="Баталгаажуулах"
                onPress={handleVerify}
                loading={submitting}
                disabled={code.trim().length < 4}
                style={{ marginTop: spacing.sm }}
              />
              <Text
                style={styles.resend}
                onPress={() => {
                  setStep("phone");
                  setCode("");
                  setError(null);
                }}
              >
                Дугаараа буруу оруулсан уу? <Text style={styles.linkStrong}>Буцах</Text>
              </Text>
            </>
          )}
        </View>

        <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
          Email-ээр нэвтрэх
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
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontWeight: "600", fontSize: 14 },
  resend: { textAlign: "center", marginTop: spacing.lg, color: colors.textMuted, fontSize: 14 },
  link: { textAlign: "center", marginTop: spacing.xl, color: colors.textMuted, fontSize: 15 },
  linkStrong: { color: colors.primary, fontWeight: "700" },
});
