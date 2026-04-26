import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { colors, darkColors } from '../config/theme';

type ThemeColors = typeof colors;

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
