import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useNotificationStore } from '../store/notificationStore';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, isAuthenticated } = useAuthStore();
  const { addMessage, setTyping, setConnected } = useChatStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('new_message', (message) => {
      addMessage(message);
    });

    socket.on('user_typing', ({ userId, isTyping: typing }) => {
      setTyping(typing, userId);
    });

    socket.on('notification', (notification) => {
      addNotification(notification);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken]);

  const joinConsultation = useCallback((consultationId: string) => {
    socketRef.current?.emit('join_consultation', consultationId);
  }, []);

  const leaveConsultation = useCallback((consultationId: string) => {
    socketRef.current?.emit('leave_consultation', consultationId);
  }, []);

  const sendMessage = useCallback((data: { consultationId: string; content: string; type: string }) => {
    socketRef.current?.emit('send_message', data);
  }, []);

  const startTyping = useCallback((consultationId: string) => {
    socketRef.current?.emit('typing_start', consultationId);
  }, []);

  const stopTyping = useCallback((consultationId: string) => {
    socketRef.current?.emit('typing_stop', consultationId);
  }, []);

  const markRead = useCallback((data: { consultationId: string; messageId: string }) => {
    socketRef.current?.emit('mark_read', data);
  }, []);

  return {
    socket: socketRef.current,
    joinConsultation,
    leaveConsultation,
    sendMessage,
    startTyping,
    stopTyping,
    markRead,
  };
};
