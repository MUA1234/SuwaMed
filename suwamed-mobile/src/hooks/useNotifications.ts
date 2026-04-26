import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useNotificationStore } from '../store/notificationStore';
import * as notificationApi from '../api/notification.api';
import { handleApiError } from '../utils/errorHandler';

export const useNotifications = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    setNotifications,
    markAsRead: markAsReadStore,
    markAllAsRead: markAllAsReadStore,
    setLoading,
  } = useNotificationStore();

  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await notificationApi.getNotifications({ page, limit: 20 });
      if (response.data) {
        if (page === 1) {
          setNotifications(response.data);
        } else {
          setNotifications([...notifications, ...response.data]);
        }
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [notifications, setNotifications, setLoading]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      markAsReadStore(id);
      await notificationApi.markAsRead(id);
    } catch (error) {
      handleApiError(error);
    }
  }, [markAsReadStore]);

  const markAllAsRead = useCallback(async () => {
    try {
      markAllAsReadStore();
      await notificationApi.markAllAsRead();
    } catch (error) {
      handleApiError(error);
    }
  }, [markAllAsReadStore]);

  const registerPushToken = useCallback(async (token: string) => {
    try {
      await notificationApi.registerToken(token);
    } catch (error) {
      handleApiError(error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    registerPushToken,
  };
};
