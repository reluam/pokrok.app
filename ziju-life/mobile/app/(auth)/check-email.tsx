import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { sendMagicLink, verifyCode } from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/constants/theme";

const CODE_LENGTH = 6;

export default function CheckEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const { login } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleDigitChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    const fullCode = newDigits.join("");
    if (fullCode.length === CODE_LENGTH) {
      handleVerify(fullCode);
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
    }
  };

  const handlePaste = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
    if (cleaned.length === CODE_LENGTH) {
      const newDigits = cleaned.split("");
      setDigits(newDigits);
      inputRefs.current[CODE_LENGTH - 1]?.focus();
      handleVerify(cleaned);
    }
  };

  const handleVerify = async (code: string) => {
    if (!email || code.length !== CODE_LENGTH) return;
    setVerifying(true);
    try {
      const result = await verifyCode(email, code);
      await login(result.accessToken, result.user.email);
    } catch {
      Alert.alert("Chyba", "Neplatný nebo vypršelý kód. Zkus to znovu.");
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await sendMagicLink(email);
      setResent(true);
      setDigits(Array(CODE_LENGTH).fill(""));
      setTimeout(() => setResent(false), 3000);
    } catch {}
    setResending(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.flex}
      >
        <View style={s.container}>
          <Text style={s.icon}>📬</Text>
          <Text style={s.title}>Zkontroluj e-mail</Text>
          <Text style={s.text}>Poslali jsme přihlašovací kód na</Text>
          <Text style={s.email}>{email}</Text>

          <Text style={s.codeLabel}>Zadej 6místný kód:</Text>
          <View style={s.codeRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                style={[s.codeInput, digit ? s.codeInputFilled : null]}
                value={digit}
                onChangeText={(v) => {
                  if (v.length > 1) {
                    handlePaste(v);
                  } else {
                    handleDigitChange(i, v);
                  }
                }}
                onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
                selectTextOnFocus
                editable={!verifying}
                autoFocus={i === 0}
              />
            ))}
          </View>

          {verifying && (
            <Text style={s.verifyingText}>Ověřuji...</Text>
          )}

          <Text style={s.hint}>
            Kód je platný 5 minut.{"\n"}
            Můžeš taky kliknout na odkaz v e-mailu.
          </Text>

          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={handleResend}
            disabled={resending}
          >
            <Text style={s.secondaryBtnText}>
              {resent ? "Odesláno znovu!" : resending ? "Odesílám..." : "Odeslat nový kód"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.linkBtn} onPress={() => router.back()}>
            <Text style={s.linkText}>Zpět na přihlášení</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
  icon: { fontSize: 48, textAlign: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", color: colors.foreground, marginBottom: 12 },
  text: { fontSize: 16, textAlign: "center", color: colors.muted, marginBottom: 4 },
  email: { fontSize: 16, textAlign: "center", fontWeight: "bold", color: colors.foreground, marginBottom: 28 },
  codeLabel: { fontSize: 15, fontWeight: "600", color: colors.foreground, textAlign: "center", marginBottom: 16 },
  codeRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 },
  codeInput: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.foreground,
  },
  codeInputFilled: {
    borderColor: colors.accent,
    backgroundColor: "rgba(255,140,66,0.06)",
  },
  verifyingText: { fontSize: 14, color: colors.accent, textAlign: "center", marginBottom: 8 },
  hint: { fontSize: 13, textAlign: "center", color: colors.muted, marginBottom: 28, lineHeight: 20 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  secondaryBtnText: { color: colors.foreground, fontWeight: "500", fontSize: 14 },
  linkBtn: { paddingVertical: 12, alignItems: "center" },
  linkText: { color: colors.muted, fontSize: 14 },
});
