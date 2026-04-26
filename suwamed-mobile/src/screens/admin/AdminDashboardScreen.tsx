import React, { useState, useCallback } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import * as adminApi from '../../api/admin.api';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, typography } from '../../config/theme';

const AdminDashboardScreen: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);

    const fetchData = async () => {
        try {
            const res = await adminApi.getDashboard();
            setStats(res.data);
        } catch (err) {
            console.log('Admin dashboard error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const statCards = stats ? [
        { label: t('admin.totalUsers'), value: stats.totalUsers ?? 0, icon: 'account-group', color: '#1A73E8', bg: '#EBF5FF' },
        { label: t('admin.doctors'), value: stats.totalDoctors ?? 0, icon: 'doctor', color: '#10B981', bg: '#ECFDF5' },
        { label: t('admin.appointments'), value: stats.totalAppointments ?? 0, icon: 'calendar-check', color: '#8B5CF6', bg: '#F5F3FF' },
        { label: t('admin.pendingReview'), value: stats.pendingVerifications ?? 0, icon: 'clock-alert', color: '#F59E0B', bg: '#FFFBEB' },
    ] : [];

    const menuItems = [
        { label: t('admin.manageUsers'), icon: 'account-multiple', color: '#1A73E8', screen: 'Users' },
        { label: t('admin.pendingDoctors'), icon: 'doctor', color: '#F59E0B', screen: 'Users', subscreen: 'PendingDoctorsScreen' },
        { label: t('admin.reports'), icon: 'chart-bar', color: '#8B5CF6', screen: 'Reports' },
        { label: t('admin.management'), icon: 'cog-outline', color: '#10B981', screen: 'Management' },
    ];

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{t('admin.adminPanel')}</Text>
                        <Text style={styles.subtitle}>{t('admin.welcome', { name: user?.firstName })}</Text>
                    </View>
                    <View style={styles.adminBadge}>
                        <MaterialCommunityIcons name="shield-account" size={20} color={colors.primary} />
                        <Text style={styles.adminText}>{t('auth.admin')}</Text>
                    </View>
                </View>

                {stats && (
                    <View style={styles.revenueCard}>
                        <Text style={styles.revenueLabel}>{t('admin.totalRevenue')}</Text>
                        <Text style={styles.revenueAmount}>{t('common.lkr')} {(stats.totalRevenue ?? 0).toLocaleString()}</Text>
                        <Text style={styles.revenueSubtitle}>{t('admin.lifetimeEarnings')}</Text>
                    </View>
                )}

                <View style={styles.statsGrid}>
                    {statCards.map((card, i) => (
                        <View key={i} style={[styles.statCard, { borderTopColor: card.color }]}>
                            <View style={[styles.statIconWrap, { backgroundColor: card.bg }]}>
                                <MaterialCommunityIcons name={card.icon as any} size={22} color={card.color} />
                            </View>
                            <Text style={styles.statValue}>{card.value}</Text>
                            <Text style={styles.statLabel}>{card.label}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>{t('admin.quickActions')}</Text>
                <View style={styles.menuGrid}>
                    {menuItems.map((item, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.menuCard}
                            activeOpacity={0.7}
                            onPress={() => {
                                if (item.subscreen) {
                                    navigation.navigate(item.screen, { screen: item.subscreen });
                                } else {
                                    navigation.navigate(item.screen);
                                }
                            }}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                                <MaterialCommunityIcons name={item.icon as any} size={26} color={item.color} />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxl },
    greeting: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
    adminBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF5FF', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.xl, gap: 4 },
    adminText: { ...typography.bodySmall, fontWeight: '600', color: colors.primary },
    revenueCard: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: spacing.xxl, marginBottom: spacing.xxl },
    revenueLabel: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.xs },
    revenueAmount: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: spacing.xs },
    revenueSubtitle: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xxl },
    statCard: { width: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, borderTopWidth: 3, borderWidth: 1, borderColor: colors.border },
    statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    statValue: { ...typography.h2, color: colors.textPrimary },
    statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.lg },
    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    menuCard: { width: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    menuIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    menuLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
});

export default AdminDashboardScreen;
