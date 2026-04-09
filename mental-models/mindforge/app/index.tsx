import { Redirect } from 'expo-router';
import { useUserStore } from '@/stores/user-store';

export default function Index() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/(auth)/login'} />;
}
