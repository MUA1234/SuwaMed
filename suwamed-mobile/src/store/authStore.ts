import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  role: 'patient' | 'doctor' | 'admin';
  avatar?: string;
  isVerified: boolean;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  loadStoredAuth: () => Promise<void>;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
  refreshToken: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

  setLoading: (isLoading) => set({ isLoading }),

  loadStoredAuth: async () => {
    try {
      const [accessToken, refreshToken, userStr] = await AsyncStorage.multiGet([
        'accessToken',
        'refreshToken',
        'user',
      ]);

      if (accessToken[1] && userStr[1]) {
        const user = JSON.parse(userStr[1]);
        set({
          user,
          accessToken: accessToken[1],
          refreshToken: refreshToken[1],
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (user, accessToken, refreshToken) => {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
    ]);
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'suwamed_push_token']);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  updateUser: (data) => {
    set((state) => {
      const nextUser = state.user ? { ...state.user, ...data } : null;
      // Persist back to AsyncStorage so changes survive app restart. The write
      // is fire-and-forget — Zustand state is the source of truth in-session;
      // AsyncStorage just rehydrates it on next launch.
      if (nextUser) {
        AsyncStorage.setItem('user', JSON.stringify(nextUser)).catch(() => undefined);
      }
      return { user: nextUser };
    });
  },
}));
