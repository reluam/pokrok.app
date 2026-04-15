import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export async function impactAsync(style?: string): Promise<void> {
  if (isWeb) return;
  const Haptics = await import('expo-haptics');
  const s = (style?.toLowerCase() ?? 'medium') as any;
  await Haptics.impactAsync(s);
}

export async function notificationSuccess(): Promise<void> {
  if (isWeb) return;
  const Haptics = await import('expo-haptics');
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function notificationError(): Promise<void> {
  if (isWeb) return;
  const Haptics = await import('expo-haptics');
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
