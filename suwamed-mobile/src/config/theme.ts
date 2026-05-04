import { MD3LightTheme } from 'react-native-paper';
import { Platform } from 'react-native';

// Calm Healing — restrained, premium, healthcare-luxury palette.
// One primary (deep teal), one accent (warm sand). Status colors are muted.
// Crimson is reserved for true emergency only.
export const colors = {
  primary: '#0F4C5C',
  primaryDark: '#0A3A47',
  primaryLight: '#E8F1F3',
  secondary: '#D4A056',
  secondaryLight: '#FAF1DF',
  accent: '#D4A056',
  accentLight: '#FAF1DF',
  background: '#FAF7F2',
  surface: '#FFFFFF',
  textPrimary: '#1F2A2E',
  textSecondary: '#5A6B70',
  textDisabled: '#A0AEB2',
  error: '#B85543',
  errorLight: '#F8E5E0',
  warning: '#C4923C',
  warningLight: '#FAEFDB',
  success: '#6FA88B',
  successLight: '#E5F0EB',
  info: '#0F4C5C',
  infoLight: '#E8F1F3',
  emergency: '#8E2A1F',
  emergencyLight: '#F2DDD9',
  border: '#E8E1D4',
  borderLight: '#F2EEE5',
  card: '#FFFFFF',
  overlay: 'rgba(31, 42, 46, 0.4)',
};

export const darkColors = {
  ...colors,
  // Charcoal base with a subtle green-grey undertone — feels editorial, not navy.
  background: '#0A0E10',
  surface: '#13191B',
  card: '#13191B',
  textPrimary: '#F2EEE5',
  textSecondary: '#9AA8AC',
  textDisabled: '#5A6B70',
  border: '#1F2A2E',
  borderLight: '#13191B',
  primary: '#5DA6B0',
  primaryLight: '#163942',
  secondary: '#E5C687',
  secondaryLight: '#3A2E1A',
  errorLight: '#3A1A14',
  warningLight: '#3A2E14',
  successLight: '#163328',
  infoLight: '#163942',
  emergencyLight: '#3A1410',
  overlay: 'rgba(0, 0, 0, 0.65)',
};

// Gradients are reserved for hero treatments — never decorative tiles.
export const gradients = {
  primary: ['#0F4C5C', '#0A3A47'] as [string, string],
  primarySoft: ['#E8F1F3', '#D5E5E9'] as [string, string],
  secondary: ['#D4A056', '#B58440'] as [string, string],
  accent: ['#D4A056', '#B58440'] as [string, string],
  warm: ['#FAF1DF', '#F1E0B8'] as [string, string],
  cool: ['#E8F1F3', '#D5E5E9'] as [string, string],
  success: ['#6FA88B', '#558870'] as [string, string],
  card: ['#FFFFFF', '#FAF7F2'] as [string, string],
  hero: ['#0F4C5C', '#1A6B7D'] as [string, string],
  heroSoft: ['#E8F1F3', '#FAF1DF'] as [string, string],
  dark: ['#1F2A2E', '#0A0E10'] as [string, string],
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
      shadowColor: '#1F2A2E',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
  }) as any,
  md: Platform.select({
    ios: {
      shadowColor: '#1F2A2E',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
  }) as any,
  lg: Platform.select({
    ios: {
      shadowColor: '#1F2A2E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    android: {
      elevation: 4,
    },
  }) as any,
  xl: Platform.select({
    ios: {
      shadowColor: '#1F2A2E',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
    },
    android: {
      elevation: 8,
    },
  }) as any,
  colored: (color: string) =>
    Platform.select({
      ios: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
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
    onSecondary: '#1F2A2E',
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
    primary: darkColors.primary,
    primaryContainer: darkColors.primaryLight,
    secondary: darkColors.secondary,
    secondaryContainer: darkColors.primaryLight,
    tertiary: darkColors.secondary,
    background: darkColors.background,
    surface: darkColors.surface,
    error: colors.error,
    onPrimary: '#FFFFFF',
    onSecondary: darkColors.textPrimary,
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
