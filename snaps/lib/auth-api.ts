const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export async function requestOtp(email: string, locale: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, locale }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { success: false, error: data.error ?? 'Failed to send code' };
  }

  return { success: true };
}

export async function verifyOtp(email: string, code: string): Promise<{
  success: boolean;
  error?: string;
  user_id?: string;
  is_new_user?: boolean;
  token_hash?: string;
}> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { success: false, error: data.error ?? 'Verification failed' };
  }

  return { success: true, ...data };
}
