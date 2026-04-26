import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius, typography, shadows } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

const getToastConfig = (colors: ThemeColors): Record<ToastType, { icon: string; bg: string; accent: string; iconColor: string }> => ({
  success: { icon: 'check-circle', bg: colors.successLight, accent: colors.success, iconColor: colors.success },
  error: { icon: 'alert-circle', bg: colors.errorLight, accent: colors.error, iconColor: colors.error },
  warning: { icon: 'alert', bg: colors.warningLight, accent: colors.warning, iconColor: colors.warning },
  info: { icon: 'information', bg: colors.infoLight, accent: colors.info, iconColor: colors.info },
});

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = getToastConfig(colors)[toast.type];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 5 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => dismiss(), toast.duration || 3000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -80, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss(toast.id));
  };

  return (
    <Animated.View style={[styles.toast, { backgroundColor: config.bg, transform: [{ translateY }], opacity }]}>
      <View style={[styles.accentBar, { backgroundColor: config.accent }]} />
      <View style={styles.toastContent}>
        <MaterialCommunityIcons name={config.icon as any} size={22} color={config.iconColor} />
        <View style={styles.toastText}>
          <Text style={styles.toastTitle}>{toast.title}</Text>
          {toast.message && <Text style={styles.toastMessage}>{toast.message}</Text>}
        </View>
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
        >
          <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const idCounter = useRef(0);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = ++idCounter.current;
    setToasts((prev) => [...prev.slice(-2), { id, type, title, message, duration }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={[styles.container, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    width: SCREEN_WIDTH - spacing.lg * 2,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.lg,
  },
  accentBar: {
    width: 4,
  },
  toastContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingLeft: spacing.md,
    gap: spacing.md,
  },
  toastText: {
    flex: 1,
  },
  toastTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  toastMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
