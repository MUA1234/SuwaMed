import React, { useState, useCallback } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as adminApi from '../../api/admin.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const ReportsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [monthlyAppts, setMonthlyAppts] = useState<Array<{ month: string; count: number }>>([]);

    const fetchData = async () => {
        try {
            const [dashRes, analyticsRes] = await Promise.all([
                adminApi.getDashboard(),
                adminApi.getAppointmentAnalytics(),
            ]);
            setStats(dashRes.data);
            setMonthlyAppts(analyticsRes.data?.monthlyAppointments || []);
        } catch (err) {
            console.log('Reports fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const quickLinks = [
        {
            label: 'Revenue Report',
            icon: 'cash-multiple',
            color: '#10B981',
            bg: '#ECFDF5',
            screen: 'RevenueReportScreen',
        },
        {
            label: 'User Analytics',
            icon: 'account-multiple-outline',
            color: '#1A73E8',
            bg: '#EBF5FF',
            screen: 'UserAnalyticsScreen',
        },
        {
            label: 'Appointment Analytics',
            icon: 'calendar-clock-outline',
            color: '#8B5CF6',
            bg: '#F5F3FF',
            screen: 'AppointmentAnalyticsScreen',
        },
    ];

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.heading}>{t('admin.reports')}</Text>
                </View>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.heading}>{t('admin.reports')}</Text>
                <Text style={styles.subtitle}>System analytics & insights</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Revenue summary */}
                {stats && (
                    <View style={styles.revenueCard}>
                        <View>
                            <Text style={styles.revenueLabel}>{t('admin.totalRevenue')}</Text>
                            <Text style={styles.revenueAmount}>
                                LKR {(stats.totalRevenue ?? 0).toLocaleString()}
                            </Text>
                            <Text style={styles.revenueSubtitle}>{t('doctor.lifetimeEarnings')}</Text>
                        </View>
                        <View style={styles.revenueIconWrap}>
                            <MaterialCommunityIcons name="cash-multiple" size={36} color="rgba(255,255,255,0.8)" />
                        </View>
                    </View>
                )}

                {/* Monthly Appointments Bar Chart */}
                {monthlyAppts.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('admin.monthlyAppointments')}</Text>
                        <View style={styles.barCard}>
                            {(() => {
                                const maxBar = Math.max(...monthlyAppts.map(m => m.count), 1);
                                return monthlyAppts.map((item, i) => {
                                    const pct = item.count / maxBar;
                                    return (
                                        <View key={i} style={styles.barRow}>
                                            <Text style={styles.barMonth}>{item.month}</Text>
                                            <View style={styles.barTrack}>
                                                <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` as any }]} />
                                            </View>
                                            <Text style={styles.barValue}>{item.count}</Text>
                                        </View>
                                    );
                                });
                            })()}
                        </View>
                    </View>
                )}

                {/* Quick links */}
                <Text style={styles.sectionTitle}>{t('admin.detailedReports')}</Text>
                <View style={styles.linksGrid}>
                    {quickLinks.map((link, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.linkCard}
                            activeOpacity={0.7}
                            onPress={() => {
                                if (link.screen) {
                                    navigation.navigate(link.screen);
                                }
                            }}
                        >
                            <View style={[styles.linkIcon, { backgroundColor: link.bg }]}>
                                <MaterialCommunityIcons name={link.icon as any} size={26} color={link.color} />
                            </View>
                            <Text style={styles.linkLabel}>{link.label}</Text>
                            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDisabled} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.lg,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    heading: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    scroll: { padding: spacing.xl, paddingBottom: 100 },
    revenueCard: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        padding: spacing.xxl,
        marginBottom: spacing.xxl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    revenueLabel: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.xs },
    revenueAmount: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: spacing.xs },
    revenueSubtitle: { ...typography.caption, color: 'rgba(255,255,255,0.65)' },
    revenueIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    section: { marginBottom: spacing.xxl },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    barCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
    },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    barMonth: { width: 32, ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    barTrack: {
        flex: 1,
        height: 10,
        backgroundColor: colors.border,
        borderRadius: 5,
        overflow: 'hidden',
    },
    barFill: {
        height: 10,
        backgroundColor: colors.primary,
        borderRadius: 5,
    },
    barValue: { width: 28, ...typography.caption, color: colors.textPrimary, fontWeight: '700', textAlign: 'right' },
    linksGrid: { gap: spacing.md, marginBottom: spacing.xl },
    linkCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
    },
    linkIcon: {
        width: 50,
        height: 50,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    linkLabel: { flex: 1, ...typography.body, fontWeight: '600', color: colors.textPrimary },
});

export default ReportsScreen;
