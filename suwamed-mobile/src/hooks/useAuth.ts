import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../api/auth.api';
import { handleApiError } from '../utils/errorHandler';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setTokens,
    logout: storeLogout,
    setLoading,
  } = useAuthStore();

  const login = useCallback(async (emailOrPhone: string, password: string) => {
    try {
      setLoading(true);
      const isEmail = emailOrPhone.includes('@');
      const response = await authApi.login({
        ...(isEmail ? { email: emailOrPhone } : { phone: emailOrPhone }),
        password,
      });
      if (response.data) {
        setUser(response.data.user);
        setTokens(response.data.accessToken, response.data.refreshToken);
      }
      return response;
    } catch (error) {
      throw new Error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [setUser, setTokens, setLoading]);

  const register = useCallback(async (data: any) => {
    try {
      setLoading(true);
      const response = await authApi.register(data);
      if (response.data) {
        setUser(response.data.user);
        setTokens(response.data.accessToken, response.data.refreshToken);
      }
      return response;
    } catch (error) {
      throw new Error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [setUser, setTokens, setLoading]);

  const verifyOTP = useCallback(async (phone: string, otp: string) => {
    try {
      setLoading(true);
      const response = await authApi.verifyOTP({ phone, otp });
      return response;
    } catch (error) {
      throw new Error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const forgotPassword = useCallback(async (emailOrPhone: string) => {
    try {
      setLoading(true);
      const response = await authApi.forgotPassword({ emailOrPhone });
      return response;
    } catch (error) {
      throw new Error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const resetPassword = useCallback(async (data: any) => {
    try {
      setLoading(true);
      const response = await authApi.resetPassword(data);
      return response;
    } catch (error) {
      throw new Error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (_) {
    } finally {
      storeLogout();
    }
  }, [storeLogout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    verifyOTP,
    forgotPassword,
    resetPassword,
    logout,
  };
};
