import { MD3LightTheme } from 'react-native-paper';
import { Platform } from 'react-native';

export const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',
  secondary: '#0D9488',
  secondaryLight: '#CCFBF1',
  accent: '#F97316',
  accentLight: '#FFF7ED',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textDisabled: '#94A3B8',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  success: '#10B981',
  successLight: '#ECFDF5',
  info: '#3B82F6',
  infoLight: '#EFF6FF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  card: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.4)',
};

export const darkColors = {
  ...colors,
  background: '#0F172A',
  surface: '#1E293B',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textDisabled: '#475569',
  card: '#1E293B',
  border: '#334155',
  borderLight: '#1E293B',
  errorLight: '#3B1515',
  warningLight: '#3B2F0A',
  successLight: '#0D3B2E',
  infoLight: '#1E3A5F',
  primaryLight: '#1E3A5F',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const gradients = {
  primary: ['#2563EB', '#1D4ED8'] as [string, string],
  primarySoft: ['#EFF6FF', '#DBEAFE'] as [string, string],
  secondary: ['#0D9488', '#0F766E'] as [string, string],
  accent: ['#F97316', '#EA580C'] as [string, string],
  warm: ['#FEF3C7', '#FDE68A'] as [string, string],
  cool: ['#E0F2FE', '#BAE6FD'] as [string, string],
  success: ['#10B981', '#059669'] as [string, string],
  card: ['#FFFFFF', '#F8FAFC'] as [string, string],
  hero: ['#2563EB', '#7C3AED'] as [string, string],
  heroSoft: ['#EFF6FF', '#F5F3FF'] as [string, string],
  dark: ['#1E293B', '#0F172A'] as [string, string],
};

export const typography = {
  h1: {
    fontSize: 30,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const shadows = {
  none: {},
  sm: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
  }) as any,
  md: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 3,
    },
  }) as any,
  lg: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    android: {
      elevation: 6,
    },
  }) as any,
  xl: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: {
      elevation: 10,
    },
  }) as any,
  colored: (color: string) =>
    Platform.select({
      ios: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }) as any,
};

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    tertiary: colors.accent,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: colors.textPrimary,
    onSurface: colors.textPrimary,
    outline: colors.border,
    surfaceVariant: colors.card,
  },
};

export const darkPaperTheme = {
  ...MD3LightTheme,
  dark: true,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryDark,
    secondary: colors.secondary,
    secondaryContainer: colors.primaryDark,
    tertiary: colors.accent,
    background: darkColors.background,
    surface: darkColors.surface,
    error: colors.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: darkColors.textPrimary,
    onSurface: darkColors.textPrimary,
    outline: darkColors.border,
    surfaceVariant: darkColors.card,
  },
};

const theme = {
  colors,
  darkColors,
  gradients,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export default theme;
