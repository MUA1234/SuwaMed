import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as notificationApi from '../../api/notification.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

type FilterTab = 'all' | 'unread';

const getNotifIcon = (type: string, colors: ThemeColors): { icon: string; color: string; bg: string } => {
    switch (type) {
        case 'appointment': return { icon: 'calendar-check', color: colors.primary, bg: colors.primaryLight };
        case 'prescription': return { icon: 'prescription', color: colors.success, bg: colors.successLight };
        case 'payment': return { icon: 'cash', color: colors.warning, bg: colors.warningLight };
        case 'review': return { icon: 'star', color: colors.warning, bg: colors.warningLight };
        case 'system': return { icon: 'cog', color: colors.textSecondary, bg: colors.borderLight };
        default: return { icon: 'bell', color: colors.primary, bg: colors.primaryLight };
    }
};

const timeAgo = (dateStr: string): string => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const NotificationsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [markingAll, setMarkingAll] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await notificationApi.getNotifications();
            setNotifications(res.data || res || []);
        } catch (err) {
            console.log('Notifications fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchNotifications(); }, []));

    const onRefresh = () => { setRefreshing(true); fetchNotifications(); };

    const handleMarkAsRead = async (item: any) => {
        if (item.isRead) return;
        try {
            await notificationApi.markAsRead(item._id);
            setNotifications((prev) =>
                prev.map((n) => n._id === item._id ? { ...n, isRead: true } : n)
            );
        } catch (err) {
            console.log('Mark as read error:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            setMarkingAll(true);
            await notificationApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (err) {
            Alert.alert('Error', 'Failed to mark all as read.');
        } finally {
            setMarkingAll(false);
        }
    };

    const handleDelete = (item: any) => {
        Alert.alert('Delete Notification', 'Remove this notification?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await notificationApi.deleteNotification(item._id);
                        setNotifications((prev) => prev.filter((n) => n._id !== item._id));
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete notification.');
                    }
                },
            },
        ]);
    };

    const filteredNotifications = activeTab === 'unread'
        ? notifications.filter((n) => !n.isRead)
        : notifications;

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('common.notifications')}</Text>
                    <View style={{ width: 80 }} />
                </View>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('common.notifications')}</Text>
                <TouchableOpacity
                    onPress={handleMarkAllRead}
                    disabled={markingAll || unreadCount === 0}
                    style={styles.markAllBtn}
                >
                    <Text style={[styles.markAllText, (markingAll || unreadCount === 0) && styles.markAllTextDisabled]}>
                        Mark all read
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabsRow}>
                {(['all', 'unread'] as FilterTab[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredNotifications}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                renderItem={({ item }) => {
                    const notifIcon = getNotifIcon(item.type, colors);
                    const timeStr = item.createdAt ? timeAgo(item.createdAt) : '';

                    return (
                        <TouchableOpacity
                            style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
                            onPress={() => handleMarkAsRead(item)}
                            onLongPress={() => handleDelete(item)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.notifIcon, { backgroundColor: notifIcon.bg }]}>
                                <MaterialCommunityIcons name={notifIcon.icon as any} size={20} color={notifIcon.color} />
                            </View>
                            <View style={styles.notifContent}>
                                <View style={styles.notifTopRow}>
                                    <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    {!item.isRead && <View style={styles.unreadDot} />}
                                </View>
                                <Text style={styles.notifBody} numberOfLines={2}>{item.body || item.message}</Text>
                                <Text style={styles.notifTime}>{timeStr}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="bell-off-outline" size={56} color={colors.textDisabled} />
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {activeTab === 'unread' ? 'You are all caught up' : 'Your notifications will appear here'}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    markAllBtn: { paddingHorizontal: spacing.sm },
    markAllText: { fontSize: 13, fontWeight: '600', color: colors.primary },
    markAllTextDisabled: { color: colors.textDisabled },
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.xl,
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    tab: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
    tabTextActive: { color: '#fff', fontWeight: '600' },
    listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    notifCard: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    notifCardUnread: { borderColor: colors.primary + '40', backgroundColor: '#EBF5FF' + '50' },
    notifIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    notifContent: { flex: 1 },
    notifTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    notifTitle: { flex: 1, ...typography.bodySmall, color: colors.textPrimary },
    notifTitleUnread: { fontWeight: '700' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: spacing.xs },
    notifBody: { ...typography.caption, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.xs },
    notifTime: { fontSize: 11, color: colors.textDisabled },
    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
    emptySubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});

export default NotificationsScreen;
