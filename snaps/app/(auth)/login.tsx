import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { getLocales } from 'expo-localization';
import { router } from 'expo-router';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { Calibrate } from '@/components/mascot/Calibrate';
import { Button } from '@/components/ui/Button';
import { requestOtp, verifyOtp } from '@/lib/auth-api';
import { useUserStore } from '@/stores/user-store';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';

const CODE_LENGTH = 6;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const codeInputRef = useRef<TextInput>(null);
  const login = useUserStore((s) => s.login);
  // Pre-login: language is whatever the device locale suggests, falling back
  // to Czech (the app's primary language).
  const isEn = useMemo(() => {
    const locale = getLocales()[0]?.languageCode ?? 'cs';
    return locale.startsWith('en');
  }, []);
  const t = (cs: string, en: string) => (isEn ? en : cs);

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError(t('Zadej platný e-mail', 'Enter a valid email'));
      return;
    }

    setLoading(true);
    setError('');

    const locale = getLocales()[0]?.languageCode ?? 'cs';
    const result = await requestOtp(trimmed, locale);

    if (!result.success) {
      setError(result.error ?? t('Nepodařilo se odeslat kód', 'Failed to send the code'));
      setLoading(false);
      return;
    }

    setStep('code');
    setLoading(false);
    setTimeout(() => codeInputRef.current?.focus(), 100);
  };

  const handleVerify = useCallback(
    async (fullCode: string) => {
      if (verifying) return;
      const trimmedEmail = email.trim().toLowerCase();

      setVerifying(true);
      setError('');

      const result = await verifyOtp(trimmedEmail, fullCode);

      if (!result.success) {
        setError(result.error ?? t('Neplatný kód', 'Invalid code'));
        setVerifying(false);
        setCode('');
        return;
      }

      login(result.user_id!, trimmedEmail, trimmedEmail.split('@')[0]);
      router.replace('/(tabs)/home');
    },
    [email, verifying, login, isEn]
  );

  const handleCodeChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
      setCode(cleaned);
      setError('');

      if (cleaned.length === CODE_LENGTH) {
        handleVerify(cleaned);
      }
    },
    [handleVerify]
  );

  const handleResend = async () => {
    setError('');
    setCode('');
    const locale = getLocales()[0]?.languageCode ?? 'cs';
    const result = await requestOtp(email.trim().toLowerCase(), locale);
    if (!result.success) {
      setError(result.error ?? t('Nepodařilo se odeslat kód', 'Failed to send the code'));
    }
  };

  const handleDemoLogin = () => {
    login('demo-user', 'demo@calibrate.app', 'Demo');
    router.replace('/(tabs)/home');
  };

  if (step === 'code') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Mail size={56} color={colors.primary} />
            <Text style={styles.title}>{t('Zadej kód', 'Enter the code')}</Text>
            <Text style={styles.subtitle}>
              {t('Poslali jsme 6místný kód na', 'We sent a 6-digit code to')}
              {'\n'}
              <Text style={styles.emailHighlight}>{email.trim()}</Text>
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              ref={codeInputRef}
              style={styles.codeInput}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              placeholder="000000"
              placeholderTextColor={colors.textMuted}
              autoFocus
              textAlign="center"
              editable={!verifying}
            />

            {verifying && (
              <View style={styles.verifyingRow}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.verifyingText}>{t('Ověřuji...', 'Verifying...')}</Text>
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title={t('Poslat kód znovu', 'Send the code again')}
              onPress={handleResend}
              variant="ghost"
            />

            <Button
              title={t('Změnit e-mail', 'Change email')}
              onPress={() => {
                setStep('email');
                setCode('');
                setError('');
              }}
              variant="ghost"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Calibrate size={120} mood="happy" static />
          <Text style={styles.title}>Calibrate</Text>
          <Text style={styles.subtitle}>
            {t('Trénuj mysl. Ovládni modely.', 'Train your mind. Master the models.')}
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>
            {t(
              'Zadej e-mail a pošleme ti přihlašovací kód. Žádné heslo.',
              "Enter your email and we'll send you a login code. No password.",
            )}
          </Text>

          <TextInput
            style={styles.input}
            placeholder={t('tvuj@email.cz', 'you@example.com')}
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={(txt) => { setEmail(txt); setError(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            onSubmitEditing={handleSendCode}
            returnKeyType="go"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title={t('Poslat kód', 'Send code')}
            onPress={handleSendCode}
            loading={loading}
            size="lg"
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>{t('nebo', 'or')}</Text>
            <View style={styles.line} />
          </View>

          <Button
            title={t('Vyzkoušet bez registrace', 'Try without signing up')}
            onPress={handleDemoLogin}
            variant="secondary"
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 36,
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
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md + 2,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  codeInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  verifyingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
