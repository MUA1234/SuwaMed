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
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import IconWrap from '../../components/common/IconWrap';
import type { IconWrapVariant } from '../../components/common/IconWrap';
const AdminDashboardScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
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

    const statCards: Array<{ label: string; value: number; icon: string; variant: IconWrapVariant }> = stats ? [
        { label: t('admin.totalUsers'), value: stats.totalUsers ?? 0, icon: 'account-group-outline', variant: 'tinted' },
        { label: t('admin.doctors'), value: stats.totalDoctors ?? 0, icon: 'doctor', variant: 'tinted' },
        { label: t('admin.appointments'), value: stats.totalAppointments ?? 0, icon: 'calendar-check-outline', variant: 'tinted' },
        { label: t('admin.pendingReview'), value: stats.pendingVerifications ?? 0, icon: 'clock-alert-outline', variant: 'warning' },
    ] : [];

    const menuItems: Array<{ label: string; icon: string; variant: IconWrapVariant; screen: string; subscreen?: string }> = [
        { label: t('admin.manageUsers'), icon: 'account-multiple-outline', variant: 'tinted', screen: 'Users' },
        { label: t('admin.pendingDoctors'), icon: 'account-clock-outline', variant: 'warning', screen: 'Users', subscreen: 'PendingDoctorsScreen' },
        { label: t('admin.reports'), icon: 'chart-line', variant: 'tinted', screen: 'Reports' },
        { label: t('admin.management'), icon: 'cog-outline', variant: 'accent', screen: 'Management' },
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
                        <View key={i} style={styles.statCard}>
                            <IconWrap name={card.icon} variant={card.variant} size="md" />
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
                            <IconWrap name={item.icon} variant={item.variant} size="lg" />
                            <Text style={styles.menuLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxl },
    greeting: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
    adminBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.xl, gap: 4 },
    adminText: { ...typography.bodySmall, fontWeight: '600', color: colors.primary },
    revenueCard: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: spacing.xxl, marginBottom: spacing.xxl },
    revenueLabel: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.xs },
    revenueAmount: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: spacing.xs },
    revenueSubtitle: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xxl },
    statCard: { width: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
    statValue: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.xs },
    statLabel: { ...typography.caption, color: colors.textSecondary },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.lg },
    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    menuCard: { width: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
    menuLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
});

export default AdminDashboardScreen;
