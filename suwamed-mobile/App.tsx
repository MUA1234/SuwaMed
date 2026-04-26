import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSettingsStore } from './src/store/settingsStore';
import { paperTheme, darkPaperTheme } from './src/config/theme';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ToastProvider } from './src/components/common/Toast';
import './src/config/i18n';
import RootNavigator from './src/navigation/RootNavigator';

function AppContent() {
  const { isDarkMode } = useSettingsStore();

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
