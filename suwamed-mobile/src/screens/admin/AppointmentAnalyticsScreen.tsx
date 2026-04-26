import React, { useState, useCallback } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAppointmentAnalytics } from '../../api/admin.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    pending:    { label: 'Pending',     color: '#F59E0B', icon: 'clock-outline' },
    confirmed:  { label: 'Confirmed',  color: '#1A73E8', icon: 'calendar-check' },
    in_progress:{ label: 'In Progress',color: '#8B5CF6', icon: 'progress-clock' },
    completed:  { label: 'Completed',  color: '#10B981', icon: 'check-circle-outline' },
    cancelled:  { label: 'Cancelled',  color: '#DC2626', icon: 'close-circle-outline' },
    no_show:    { label: 'No Show',    color: '#6B7280', icon: 'account-off-outline' },
};

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    video:      { label: 'Video Call', color: '#1A73E8', icon: 'video-outline' },
    chat:       { label: 'Chat',       color: '#10B981', icon: 'chat-outline' },
    follow_up:  { label: 'Follow-up',  color: '#8B5CF6', icon: 'refresh' },
};

const AppointmentAnalyticsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<any>(null);

    const fetchData = async () => {
        try {
            const res = await getAppointmentAnalytics();
            setData(res.data);
        } catch (err) {
            console.log('Analytics fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const monthly: Array<{ month: string; count: number }> = data?.monthlyAppointments || [];
    const statusMap: Record<string, number> = data?.statusBreakdown || {};
    const typeMap: Record<string, number> = data?.typeBreakdown || {};
    const maxCount = Math.max(...monthly.map(m => m.count), 1);
    const totalAll = Object.values(statusMap).reduce((a, b) => a + b, 0);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('admin.appointmentAnalytics')}</Text>
                    <View style={{ width: 40 }} />
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
                <Text style={styles.headerTitle}>{t('admin.appointmentAnalytics')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Total summary */}
                <View style={styles.totalCard}>
                    <MaterialCommunityIcons name="calendar-month" size={36} color="rgba(255,255,255,0.8)" />
                    <View style={{ marginLeft: spacing.lg }}>
                        <Text style={styles.totalLabel}>{t('admin.totalAppointments')}</Text>
                        <Text style={styles.totalNumber}>{totalAll.toLocaleString()}</Text>
                        <Text style={styles.totalSub}>{t('patient.allTimeRecords')}</Text>
                    </View>
                </View>

                {/* Monthly trend bar chart */}
                <Text style={styles.sectionTitle}>Monthly Trend (Last 6 Months)</Text>
                <View style={styles.chartCard}>
                    {monthly.map((item, i) => {
                        const pct = item.count / maxCount;
                        return (
                            <View key={i} style={styles.barRow}>
                                <Text style={styles.barLabel}>{item.month}</Text>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` as any }]} />
                                </View>
                                <Text style={styles.barValue}>{item.count}</Text>
                            </View>
                        );
                    })}
                    {monthly.length === 0 && (
                        <Text style={styles.emptyText}>{t('common.noData')}</Text>
                    )}
                </View>

                {/* Status breakdown */}
                <Text style={styles.sectionTitle}>{t('admin.byStatus')}</Text>
                <View style={styles.breakdownCard}>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                        const count = statusMap[key] || 0;
                        const pct = totalAll > 0 ? Math.round((count / totalAll) * 100) : 0;
                        return (
                            <View key={key} style={styles.breakdownRow}>
                                <View style={[styles.breakdownIcon, { backgroundColor: cfg.color + '18' }]}>
                                    <MaterialCommunityIcons name={cfg.icon as any} size={18} color={cfg.color} />
                                </View>
                                <Text style={styles.breakdownLabel}>{cfg.label}</Text>
                                <View style={styles.breakdownBarWrap}>
                                    <View style={[styles.breakdownBar, { width: `${pct}%` as any, backgroundColor: cfg.color }]} />
                                </View>
                                <Text style={[styles.breakdownCount, { color: cfg.color }]}>{count}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Type breakdown */}
                <Text style={styles.sectionTitle}>{t('admin.byType')}</Text>
                <View style={styles.typeRow}>
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                        const count = typeMap[key] || 0;
                        const pct = totalAll > 0 ? Math.round((count / totalAll) * 100) : 0;
                        return (
                            <View key={key} style={[styles.typeCard, { borderColor: cfg.color + '40' }]}>
                                <View style={[styles.typeIcon, { backgroundColor: cfg.color + '15' }]}>
                                    <MaterialCommunityIcons name={cfg.icon as any} size={22} color={cfg.color} />
                                </View>
                                <Text style={styles.typeCount}>{count}</Text>
                                <Text style={styles.typeLabel}>{cfg.label}</Text>
                                <Text style={[styles.typePct, { color: cfg.color }]}>{pct}%</Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
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
    scroll: { padding: spacing.xl, paddingBottom: 100 },
    totalCard: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        padding: spacing.xxl,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    totalLabel: { ...typography.caption, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
    totalNumber: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    totalSub: { ...typography.caption, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md, marginTop: spacing.sm },
    chartCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
        marginBottom: spacing.xxl,
    },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    barLabel: { width: 30, ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    barTrack: { flex: 1, height: 12, backgroundColor: colors.border, borderRadius: 6, overflow: 'hidden' },
    barFill: { height: 12, backgroundColor: colors.primary, borderRadius: 6 },
    barValue: { width: 28, ...typography.caption, fontWeight: '700', color: colors.textPrimary, textAlign: 'right' },
    breakdownCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
        marginBottom: spacing.xxl,
    },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    breakdownIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    breakdownLabel: { width: 90, ...typography.bodySmall, color: colors.textPrimary, fontWeight: '500' },
    breakdownBarWrap: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
    breakdownBar: { height: 8, borderRadius: 4, minWidth: 4 },
    breakdownCount: { width: 30, ...typography.caption, fontWeight: '700', textAlign: 'right' },
    typeRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    typeCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1.5,
    },
    typeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    typeCount: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
    typeLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
    typePct: { ...typography.caption, fontWeight: '700', marginTop: 4 },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
});

export default AppointmentAnalyticsScreen;
