import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from './src/store/settingsStore';
import { useAuthStore } from './src/store/authStore';
import { paperTheme, darkPaperTheme } from './src/config/theme';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ToastProvider } from './src/components/common/Toast';
import './src/config/i18n';
import RootNavigator from './src/navigation/RootNavigator';
import {
  registerForPushNotifications,
  extractNotificationData,
  type RemoteNotificationData,
} from './src/services/pushNotifications';
import { navigationRef } from './src/navigation/navigationRef';

function handleNotificationTap(data: RemoteNotificationData) {
  if (!navigationRef.isReady()) return;
  // Route by `type` — the server-side notification.service tags every
  // payload with its NotificationType, so the client can deep-link.
  const type = data.type as string | undefined;
  switch (type) {
    case 'appointment_reminder':
    case 'appointment_confirmed':
    case 'appointment_cancelled':
    case 'consultation_started':
      if (data.appointmentId) {
        navigationRef.navigate('AppointmentDetailScreen' as never, { appointmentId: data.appointmentId } as never);
      }
      break;
    case 'prescription_ready':
      if (data.prescriptionId) {
        navigationRef.navigate('PrescriptionDetailScreen' as never, { prescriptionId: data.prescriptionId } as never);
      }
      break;
    case 'review_request':
      if (data.appointmentId) {
        navigationRef.navigate('ReviewDoctorScreen' as never, { appointmentId: data.appointmentId } as never);
      }
      break;
    case 'doctor_verified':
    case 'doctor_rejected':
      navigationRef.navigate('Notifications' as never);
      break;
    default:
      navigationRef.navigate('Notifications' as never);
  }
}

function AppContent() {
  const { isDarkMode } = useSettingsStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fgListener = useRef<Notifications.EventSubscription | null>(null);
  const tapListener = useRef<Notifications.EventSubscription | null>(null);

  // Acquire + persist the Expo push token whenever the user becomes
  // authenticated. The service no-ops on permission denial / simulator,
  // and is idempotent (cached in AsyncStorage) so re-runs are cheap.
  useEffect(() => {
    if (!isAuthenticated) return;
    registerForPushNotifications();
  }, [isAuthenticated]);

  // Wire foreground + tap listeners exactly once.
  useEffect(() => {
    fgListener.current = Notifications.addNotificationReceivedListener(() => {
      // Foreground notifications already surface the OS banner via the
      // setNotificationHandler config in pushNotifications.ts. We don't need
      // to do anything else here — the in-app inbox refresh is handled when
      // the notification screen is next mounted.
    });
    tapListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = extractNotificationData(response);
      handleNotificationTap(data);
    });

    // If the app cold-launched from a notification, route to the deep link
    // after the navigator is ready.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = extractNotificationData(response);
        setTimeout(() => handleNotificationTap(data), 500);
      }
    });

    return () => {
      fgListener.current?.remove();
      tapListener.current?.remove();
    };
  }, []);

  return (
    <PaperProvider theme={isDarkMode ? darkPaperTheme : paperTheme}>
      <ToastProvider>
        <RootNavigator />
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      </ToastProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
