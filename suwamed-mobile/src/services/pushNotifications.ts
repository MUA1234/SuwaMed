import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerToken } from '../api/notification.api';

const STORAGE_KEY = 'suwamed_push_token';

// Foreground behaviour — show the OS banner + sound + badge update even when
// the app is in foreground. Without this, foreground pushes are silently
// dropped by Expo SDK 53+.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SuwaMed Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1A73E8',
      sound: 'default',
    });
  } catch {
    /* non-fatal — older Android versions reject some fields */
  }
}

async function requestPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  if (!settings.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

function getProjectId(): string | undefined {
  // Try every shape Expo has exposed across SDK versions.
  return (
    (Constants?.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    (Constants?.easConfig as { projectId?: string } | undefined)?.projectId ??
    (Constants as unknown as { manifest?: { extra?: { eas?: { projectId?: string } } } })?.manifest?.extra?.eas?.projectId
  );
}

/**
 * Acquire a push token and POST it to the backend so the user can receive
 * pushes. Safe to call repeatedly — we cache the last registered token in
 * AsyncStorage and skip the network round trip when it hasn't changed.
 *
 * Returns the token on success, null when the device cannot receive pushes
 * (permission denied, simulator, no project id).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    await ensureAndroidChannel();
    const granted = await requestPermission();
    if (!granted) return null;

    const projectId = getProjectId();
    if (!projectId) {
      // No EAS project id means getExpoPushTokenAsync will reject. Skip
      // silently — this happens in test rigs and local web previews.
      return null;
    }

    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = result?.data;
    if (!token) return null;

    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached === token) return token;

    await registerToken(token);
    await AsyncStorage.setItem(STORAGE_KEY, token);
    return token;
  } catch {
    // Network failure / no native module / Expo Go on iOS in SDK 53+: just
    // return null. The in-app inbox still works because notifications are
    // persisted server-side.
    return null;
  }
}

/**
 * Clear the cached push token. Call on logout so a different user signing in
 * on the same device gets their own subscription registered.
 */
export async function clearPushTokenCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* non-fatal */
  }
}

export type RemoteNotificationData = {
  type?: string;
  appointmentId?: string;
  prescriptionId?: string;
  doctorId?: string;
  reminder?: '24h' | '1h';
  [key: string]: unknown;
};

/**
 * Decode the structured `data` payload from a remote notification (Expo +
 * FCM agree on the `request.content.data` location for both delivery paths).
 */
export function extractNotificationData(
  notification: Notifications.Notification | Notifications.NotificationResponse,
): RemoteNotificationData {
  const content =
    'notification' in notification
      ? notification.notification.request.content
      : notification.request.content;
  return (content?.data ?? {}) as RemoteNotificationData;
}
