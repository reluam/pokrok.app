import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Brain, Mail } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/user-store';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const login = useUserStore((s) => s.login);

  const handleSendMagicLink = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Zadej svůj e-mail');
      return;
    }

    setLoading(true);
    setError('');

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: true,
      },
    });

    if (otpError) {
      setError(otpError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  const handleDemoLogin = () => {
    login('demo-user', 'demo@snaps.app', 'Demo');
    router.replace('/(tabs)/home');
  };

  if (sent) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Mail size={64} color={colors.primary} />
            <Text style={styles.title}>Zkontroluj e-mail</Text>
            <Text style={styles.subtitle}>
              Poslali jsme přihlašovací odkaz na{'\n'}
              <Text style={styles.emailHighlight}>{email.trim()}</Text>
            </Text>
          </View>

          <View style={styles.form}>
            <Button
              title="Zadat kód ručně"
              onPress={() =>
                router.push({
                  pathname: '/(auth)/verify',
                  params: { email: email.trim().toLowerCase() },
                })
              }
              size="lg"
            />

            <Button
              title="Poslat znovu"
              onPress={() => {
                setSent(false);
                setError('');
              }}
              variant="ghost"
            />

            <Button
              title="Použít jiný e-mail"
              onPress={() => {
                setSent(false);
                setEmail('');
                setError('');
              }}
              variant="ghost"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Brain size={64} color={colors.primary} />
          <Text style={styles.title}>Snaps</Text>
          <Text style={styles.subtitle}>Trénuj mysl. Ovládni modely.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>
            Zadej e-mail a pošleme ti přihlašovací odkaz. Žádné heslo.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="tvuj@email.cz"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            autoFocus
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Poslat magic link"
            onPress={handleSendMagicLink}
            loading={loading}
            size="lg"
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>nebo</Text>
            <View style={styles.line} />
          </View>

          <Button
            title="Vyzkoušet bez registrace"
            onPress={handleDemoLogin}
            variant="secondary"
            size="lg"
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
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.surface,
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
    backgroundColor: colors.surface,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
