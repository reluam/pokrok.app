import { useState, useRef } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import { colors, radius, spacing } from "../lib/theme";

type Step = "idle" | "loading" | "sent" | "verifying";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(TextInput | null)[]>([]);

  async function handleMagicLink() {
    if (!email.trim()) return;
    setStep("loading");

    const redirectTo = Linking.createURL("/auth/callback");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      Alert.alert("Chyba", "Nepodařilo se odeslat odkaz. Zkus to znovu.");
      setStep("idle");
    } else {
      setCode(["", "", "", "", "", ""]);
      setStep("sent");
    }
  }

  function handleCodeChange(value: string, index: number) {
    // Paste celého kódu najednou
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      const digits = value.split("");
      setCode(digits);
      inputs.current[5]?.focus();
      verifyCode(digits.join(""));
      return;
    }

    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);

    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "")) {
      verifyCode(next.join(""));
    }
  }

  function handleCodeKeyPress(key: string, index: number) {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function verifyCode(token: string) {
    setStep("verifying");
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "magiclink",
    });

    if (error) {
      Alert.alert("Neplatný kód", "Kód je nesprávný nebo vypršela jeho platnost.");
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      setStep("sent");
    }
    // Správný kód → _layout.tsx zachytí session a přesměruje
  }

  if (step === "sent" || step === "verifying") {
    const filled = code.filter((d) => d !== "").length;
    const isVerifying = step === "verifying";
    const codeComplete = filled === 6;

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>Povídej</Text>
          </View>

          <Text style={styles.sentIcon}>📬</Text>
          <Text style={styles.sentTitle}>Zkontroluj e-mail</Text>
          <Text style={styles.sentText}>
            Poslali jsme odkaz a kód na{"\n"}
            <Text style={styles.sentEmail}>{email}</Text>
          </Text>

          {/* OTP vstupy */}
          <View style={styles.otpRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputs.current[i] = r; }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : null,
                  i === 2 ? styles.otpGap : null,
                ]}
                value={digit}
                onChangeText={(v) => handleCodeChange(v, i)}
                onKeyPress={({ nativeEvent }) => handleCodeKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
                editable={!isVerifying}
                autoFocus={i === 0}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btn, (!codeComplete || isVerifying) && styles.btnDisabled]}
            onPress={() => verifyCode(code.join(""))}
            disabled={!codeComplete || isVerifying}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>
              {isVerifying ? "Ověřuji…" : "Potvrdit kód"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep("idle")} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Jiný e-mail</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>Povídej</Text>
          <Text style={styles.logoSub}>AI průvodce tvým vnitřním světem</Text>
        </View>

        <Text style={styles.label}>Přihlaš se e-mailem</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="tvuj@email.cz"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="send"
          onSubmitEditing={handleMagicLink}
        />

        <TouchableOpacity
          style={[styles.btn, (!email.trim() || step === "loading") && styles.btnDisabled]}
          onPress={handleMagicLink}
          disabled={!email.trim() || step === "loading"}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>
            {step === "loading" ? "Odesílám…" : "Poslat přihlašovací odkaz"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          Přihlášením souhlasíš s podmínkami použití.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.border,
    gap: spacing.md,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  logoSub: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
    textAlign: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.3,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  terms: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
  },
  // Sent state
  sentIcon: {
    fontSize: 44,
    textAlign: "center",
  },
  sentTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  sentText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  sentEmail: {
    fontWeight: "600",
    color: colors.foreground,
  },
  // OTP
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 4,
  },
  otpInput: {
    width: 44,
    height: 54,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  otpGap: {
    marginRight: 8,
  },
  backBtn: {
    alignSelf: "center",
  },
  backBtnText: {
    fontSize: 14,
    color: colors.muted,
  },
});
