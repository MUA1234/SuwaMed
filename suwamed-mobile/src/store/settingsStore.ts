import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../config/i18n';

interface SettingsStore {
  language: string;
  isDarkMode: boolean;
  notificationsEnabled: boolean;
  hasAcceptedConsent: boolean;
  isLoaded: boolean;
  setLanguage: (language: string) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  toggleNotifications: () => Promise<void>;
  acceptConsent: () => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  language: 'en',
  isDarkMode: false,
  notificationsEnabled: true,
  hasAcceptedConsent: false,
  isLoaded: false,

  setLanguage: async (language) => {
    await AsyncStorage.setItem('suwamed_language', language);
    i18n.changeLanguage(language);
    set({ language });
  },

  toggleDarkMode: async () => {
    const newValue = !get().isDarkMode;
    await AsyncStorage.setItem('suwamed_darkMode', JSON.stringify(newValue));
    set({ isDarkMode: newValue });
  },

  toggleNotifications: async () => {
    const newValue = !get().notificationsEnabled;
    await AsyncStorage.setItem('suwamed_notifications', JSON.stringify(newValue));
    set({ notificationsEnabled: newValue });
  },

  acceptConsent: async () => {
    await AsyncStorage.setItem('suwamed_consentAccepted', 'true');
    set({ hasAcceptedConsent: true });
  },

  loadSettings: async () => {
    try {
      const [lang, darkMode, notifications, consent] = await AsyncStorage.multiGet([
        'suwamed_language',
        'suwamed_darkMode',
        'suwamed_notifications',
        'suwamed_consentAccepted',
      ]);
      const language = lang[1] || 'en';
      if (lang[1]) {
        i18n.changeLanguage(language);
      }
      set({
        language,
        isDarkMode: lang[1] ? JSON.parse(darkMode[1] || 'false') : false,
        notificationsEnabled: notifications[1] ? JSON.parse(notifications[1]) : true,
        hasAcceptedConsent: consent[1] === 'true',
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },
}));
