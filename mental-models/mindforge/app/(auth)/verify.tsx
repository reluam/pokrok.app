import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/user-store';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);
  const login = useUserStore((s) => s.login);

  const handleVerify = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length !== CODE_LENGTH) {
      setError(`Zadej ${CODE_LENGTH}místný kód`);
      return;
    }

    if (!email) {
      setError('Chybí e-mail, vrať se zpět');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: trimmedCode,
      type: 'email',
    });

    if (verifyError) {
      setError('Neplatný kód. Zkus to znovu.');
      setLoading(false);
      return;
    }

    if (data.user) {
      login(
        data.user.id,
        email,
        data.user.user_metadata?.display_name ?? email.split('@')[0]
      );
      router.replace('/(tabs)/home');
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (!email) return;

    setError('');
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (otpError) {
      setError(otpError.message);
    } else {
      setError('');
      setCode('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <ShieldCheck size={56} color={colors.primary} />
          <Text style={styles.title}>Zadej kód</Text>
          <Text style={styles.subtitle}>
            Poslali jsme {CODE_LENGTH}místný kód na{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            ref={inputRef}
            style={styles.codeInput}
            value={code}
            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH))}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            placeholder="000000"
            placeholderTextColor={colors.surface}
            autoFocus
            textAlign="center"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Ověřit"
            onPress={handleVerify}
            loading={loading}
            disabled={code.length !== CODE_LENGTH}
            size="lg"
          />

          <Button
            title="Poslat kód znovu"
            onPress={handleResend}
            variant="ghost"
          />

          <Button
            title="Zpět"
            onPress={() => router.back()}
            variant="ghost"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  form: {
    gap: spacing.md,
  },
  codeInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 12,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
