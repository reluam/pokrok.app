'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWebUserStore, useStoreHydrated } from '@web/lib/user-store';

/** Redirects authenticated users to /dashboard. Renders nothing. */
export function AuthRedirect() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const isAuthenticated = useWebUserStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace('/dashboard');
  }, [hydrated, isAuthenticated, router]);

  return null;
}
