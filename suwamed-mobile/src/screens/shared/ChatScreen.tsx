import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import { SOCKET_URL } from '../../config/constants';
import { useAuthStore } from '../../store/authStore';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { spacing, borderRadius, typography } from '../../config/theme';

interface ChatMessage {
  _id: string;
  consultationId: string;
  senderId: string;
  receiverId: string;
  type: 'text' | 'image' | 'file' | 'system';
  content?: string;
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

type RouteParams = { appointmentId: string; doctorName?: string; patientName?: string };

const ChatScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params || {}) as RouteParams;
  const appointmentId = String(params.appointmentId || '');
  const counterpartyLabel = params.doctorName || params.patientName || t('common.chat');

  const { accessToken, user } = useAuthStore();
  const selfId = user?._id || (user as any)?.id || '';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [counterpartyTyping, setCounterpartyTyping] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Load history once ---------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await client.get(`/chat/${appointmentId}`);
        if (cancelled) return;
        const data: ChatMessage[] = res.data?.data ?? [];
        setMessages(data);
      } catch {
        // No history is fine — first message of the consultation.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  // ---- Connect socket ------------------------------------------------------
  useEffect(() => {
    if (!accessToken || !appointmentId) return;
    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_consultation', appointmentId);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('new_message', (msg: ChatMessage) => {
      // Dedupe — the sender's optimistic message will already have an _id
      // matching the persisted one (server replays the same row).
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Mark inbound messages as read immediately (we're on the screen).
      if (msg.receiverId === selfId) {
        socket.emit('mark_read', { consultationId: appointmentId, messageId: msg._id });
      }
    });

    socket.on('user_typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (userId !== selfId) setCounterpartyTyping(isTyping);
    });

    socket.on('message_read', ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isRead: true, readAt: new Date().toISOString() } : m)),
      );
    });

    return () => {
      socket.emit('leave_consultation', appointmentId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, appointmentId, selfId]);

  // ---- Auto-scroll on new message -----------------------------------------
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  // ---- Send ----------------------------------------------------------------
  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content || sending) return;
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    setSending(true);
    socket.emit(
      'send_message',
      { consultationId: appointmentId, content, type: 'text' },
      (ack: { ok: boolean; message?: ChatMessage; error?: string }) => {
        setSending(false);
        if (ack?.ok) {
          setInput('');
          if (ack.message) {
            setMessages((prev) => {
              if (prev.find((m) => m._id === ack.message!._id)) return prev;
              return [...prev, ack.message!];
            });
          }
        }
      },
    );
  }, [input, appointmentId, sending]);

  // ---- Typing indicator ----------------------------------------------------
  const handleInputChange = useCallback(
    (text: string) => {
      setInput(text);
      const socket = socketRef.current;
      if (!socket) return;
      socket.emit('typing_start', appointmentId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', appointmentId);
      }, 1500);
    },
    [appointmentId],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isMine = item.senderId === selfId;
      const time = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return (
        <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
          <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
            {item.type === 'text' && (
              <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.content}</Text>
            )}
            {item.type !== 'text' && (
              <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                {item.fileName || (item.type === 'image' ? '[image]' : '[attachment]')}
              </Text>
            )}
            <View style={styles.bubbleFooter}>
              <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>{time}</Text>
              {isMine && (
                <MaterialCommunityIcons
                  name={item.isRead ? 'check-all' : 'check'}
                  size={14}
                  color={item.isRead ? '#4FC3F7' : 'rgba(255,255,255,0.7)'}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        </View>
      );
    },
    [selfId, styles, colors],
  );

  const keyExtractor = useCallback((m: ChatMessage) => m._id, []);

  const empty = useMemo(
    () => (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="message-text-outline" size={48} color={colors.textDisabled} />
        <Text style={styles.emptyTitle}>{t('common.noMessagesYet')}</Text>
        <Text style={styles.emptySubtitle}>{t('common.startConversation')}</Text>
      </View>
    ),
    [styles, colors, t],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{counterpartyLabel}</Text>
          <Text style={styles.headerSubtitle}>
            {connected ? t('common.online') : t('common.connecting')}
            {counterpartyTyping ? ` · ${t('common.typing')}` : ''}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={messages.length === 0 ? styles.listEmpty : styles.list}
            ListEmptyComponent={empty}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            value={input}
            onChangeText={handleInputChange}
            placeholder={t('common.typeAMessage')}
            placeholderTextColor={colors.textDisabled}
            multiline
            maxLength={4000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.5 }]}
            disabled={!input.trim() || sending}
            onPress={handleSend}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerBtn: { padding: spacing.xs, marginRight: spacing.xs },
    headerTitle: { ...typography.h3, color: colors.textPrimary },
    headerSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: spacing.md, paddingBottom: spacing.lg },
    listEmpty: { flex: 1 },
    bubbleRow: { flexDirection: 'row', marginBottom: spacing.sm },
    bubbleRowMine: { justifyContent: 'flex-end' },
    bubbleRowTheirs: { justifyContent: 'flex-start' },
    bubble: {
      maxWidth: '80%',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
    },
    bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: spacing.xs },
    bubbleTheirs: { backgroundColor: colors.surface, borderBottomLeftRadius: spacing.xs, borderWidth: 1, borderColor: colors.border },
    bubbleText: { ...typography.body, color: colors.textPrimary },
    bubbleTextMine: { color: '#fff' },
    bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
    bubbleTime: { ...typography.caption, color: colors.textSecondary, fontSize: 10 },
    bubbleTimeMine: { color: 'rgba(255,255,255,0.85)' },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: spacing.sm,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    composerInput: {
      flex: 1,
      maxHeight: 100,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary,
      ...typography.body,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md },
    emptySubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  });

export default ChatScreen;
