import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getLocales } from 'expo-localization';
import { router, useLocalSearchParams } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { requestOtp, verifyOtp } from '@/lib/auth-api';
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
  const isEn = useMemo(() => {
    const locale = getLocales()[0]?.languageCode ?? 'cs';
    return locale.startsWith('en');
  }, []);
  const t = (cs: string, en: string) => (isEn ? en : cs);

  const handleVerify = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length !== CODE_LENGTH) {
      setError(t(`Zadej ${CODE_LENGTH}místný kód`, `Enter the ${CODE_LENGTH}-digit code`));
      return;
    }

    if (!email) {
      setError(t('Chybí e-mail, vrať se zpět', 'Email missing — go back'));
      return;
    }

    setLoading(true);
    setError('');

    const result = await verifyOtp(email, trimmedCode);

    if (!result.success) {
      setError(result.error ?? t('Neplatný kód', 'Invalid code'));
      setLoading(false);
      return;
    }

    login(
      result.user_id!,
      email,
      email.split('@')[0]
    );
    router.replace('/(tabs)/home');
  };

  const handleResend = async () => {
    if (!email) return;

    setError('');
    const locale = getLocales()[0]?.languageCode ?? 'cs';
    const result = await requestOtp(email, locale);

    if (!result.success) {
      setError(result.error ?? t('Nepodařilo se odeslat kód', 'Failed to send the code'));
    } else {
      setCode('');
      setError('');
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
          <Text style={styles.title}>{t('Zadej kód', 'Enter the code')}</Text>
          <Text style={styles.subtitle}>
            {t(
              `Poslali jsme ${CODE_LENGTH}místný kód na`,
              `We sent a ${CODE_LENGTH}-digit code to`,
            )}
            {'\n'}
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
            title={t('Ověřit', 'Verify')}
            onPress={handleVerify}
            loading={loading}
            disabled={code.length !== CODE_LENGTH}
            size="lg"
          />

          <Button
            title={t('Poslat kód znovu', 'Send the code again')}
            onPress={handleResend}
            variant="ghost"
          />

          <Button
            title={t('Zpět', 'Back')}
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
