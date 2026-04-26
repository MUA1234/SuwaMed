import { AxiosError } from 'axios';
import { Alert } from 'react-native';

interface ApiErrorResponse {
  success: false;
  message: string;
  error?: {
    code: string;
    details?: string;
  };
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.message) return data.message;
    if (error.response?.status === 401) return 'Session expired. Please login again.';
    if (error.response?.status === 403) return 'You do not have permission to perform this action.';
    if (error.response?.status === 404) return 'Resource not found.';
    if (error.response?.status === 429) return 'Too many requests. Please try again later.';
    if (error.response?.status && error.response.status >= 500) return 'Server error. Please try again later.';
    if (error.code === 'ERR_NETWORK') return 'Network error. Please check your internet connection.';
    return 'Something went wrong. Please try again.';
  }
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred.';
};

export const handleApiError = (error: unknown, showAlert = false): string => {
  const message = getErrorMessage(error);
  if (showAlert) {
    Alert.alert('Error', message);
  }
  return message;
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.code === 'ERR_NETWORK' || !error.response;
  }
  return false;
};

export const isAuthError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
};
