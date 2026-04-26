import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { colors, darkColors } from '../config/theme';

export type ThemeColors = typeof colors;

interface ThemeContextType {
  isDarkMode: boolean;
  theme: ThemeColors;
  toggleDarkMode: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  theme: colors,
  toggleDarkMode: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

// useThemedStyles lets a screen build a StyleSheet that automatically rebuilds
// when the theme flips. Pass a factory that takes the current theme colors and
// returns the styles object — the result is memoized on `colors` identity, so
// the StyleSheet is reused across renders within the same theme.
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { theme } = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { isDarkMode, toggleDarkMode, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  // Manual toggle takes precedence; if user hasn't toggled, follow OS
  const effectiveDark = isDarkMode || systemColorScheme === 'dark';
  const theme = effectiveDark ? darkColors : colors;

  return (
    <ThemeContext.Provider value={{ isDarkMode: effectiveDark, theme, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
