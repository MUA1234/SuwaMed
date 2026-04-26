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
import { useNotificationStore } from '../../store/notificationStore';
import { colors, spacing, borderRadius, typography } from '../../config/theme';
import { useTranslation } from 'react-i18next';

type FilterTab = 'all' | 'unread' | 'read';

const TYPE_ICONS: Record<string, string> = {
    appointment: 'calendar-clock',
    prescription: 'pill',
    lab_report: 'flask',
    general: 'bell',
    emergency: 'alert',
};

const getTimeAgo = (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const TYPE_COLORS: Record<string, string> = {
    appointment: colors.primary,
    prescription: '#8B5CF6',
    lab_report: colors.success,
    general: colors.textSecondary,
    emergency: colors.error,
};

const NotificationsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { notifications, setNotifications, markAsRead, markAllAsRead, removeNotification, isLoading, setLoading } =
        useNotificationStore();

    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await notificationApi.getNotifications();
            setNotifications(res.data || []);
        } catch (err) {
            console.log('Notifications fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchNotifications(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchNotifications(); };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            markAllAsRead();
        } catch (err) {
            console.log('Mark all read error:', err);
        }
    };

    const handlePress = async (item: any) => {
        if (!item.isRead) {
            try {
                await notificationApi.markAsRead(item._id);
                markAsRead(item._id);
            } catch (err) {
                console.log('Mark read error:', err);
            }
        }
    };

    const handleLongPress = (item: any) => {
        Alert.alert('Delete Notification', 'Remove this notification?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await notificationApi.deleteNotification(item._id);
                        removeNotification(item._id);
                    } catch (err) {
                        console.log('Delete notification error:', err);
                    }
                },
            },
        ]);
    };

    const filteredNotifications = notifications.filter((n) => {
        if (activeTab === 'unread') return !n.isRead;
        if (activeTab === 'read') return n.isRead;
        return true;
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const tabs: { key: FilterTab; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'unread', label: `Unread (${unreadCount})` },
        { key: 'read', label: 'Read' },
    ];

    const renderItem = ({ item }: { item: any }) => {
        const iconName = TYPE_ICONS[item.type] || 'bell';
        const iconColor = TYPE_COLORS[item.type] || colors.textSecondary;

        return (
            <TouchableOpacity
                style={[styles.card, !item.isRead && styles.cardUnread]}
                onPress={() => handlePress(item)}
                onLongPress={() => handleLongPress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconWrap, { backgroundColor: iconColor + '15' }]}>
                    <MaterialCommunityIcons name={iconName as any} size={22} color={iconColor} />
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleBold]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={styles.timeAgo}>{getTimeAgo(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.cardBody} numberOfLines={2}>
                        {item.body}
                    </Text>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    if (isLoading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('common.notifications')}</Text>
                {unreadCount > 0 ? (
                    <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn} activeOpacity={0.7}>
                        <Text style={styles.markAllText}>{t('common.markAllRead')}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 80 }} />
                )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabsRow}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredNotifications}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="bell-off-outline" size={56} color={colors.textDisabled} />
                        <Text style={styles.emptyTitle}>{t('common.noNotifications')}</Text>
                        <Text style={styles.emptySubtitle}>
                            {activeTab === 'unread'
                                ? "You're all caught up!"
                                : 'No notifications to show'}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    markAllBtn: { paddingHorizontal: spacing.sm },
    markAllText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { ...typography.caption, fontWeight: '500', color: colors.textSecondary },
    tabTextActive: { color: '#fff', fontWeight: '600' },
    listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardUnread: { borderColor: colors.primary + '40', backgroundColor: '#F0F7FF' },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        flexShrink: 0,
    },
    cardContent: { flex: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
    cardTitle: { ...typography.bodySmall, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
    cardTitleBold: { fontWeight: '700' },
    timeAgo: { ...typography.caption, color: colors.textSecondary, flexShrink: 0 },
    cardBody: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 18 },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        marginLeft: spacing.sm,
        marginTop: spacing.xs,
        flexShrink: 0,
    },
    emptyState: { alignItems: 'center', paddingTop: spacing.xxxl * 2 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
    emptySubtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});

export default NotificationsScreen;
