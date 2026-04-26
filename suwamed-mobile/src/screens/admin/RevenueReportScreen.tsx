import React, { useState, useCallback } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface MonthRevenue {
    month: number;
    year: number;
    amount: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const RevenueReportScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<MonthRevenue[]>([]);

    const fetchData = async () => {
        try {
            const res = await client.get('/admin/revenue');
            setData(res.data?.data || []);
        } catch (err) {
            console.log('Revenue report error:', err);
            setData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const totalRevenue = data.reduce((sum, item) => sum + (item.amount ?? 0), 0);
    const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0;
    const maxAmount = data.length > 0 ? Math.max(...data.map(d => d.amount)) : 1;

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('admin.revenueReport')}</Text>
                    <View style={{ width: 40 }} />
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
                <Text style={styles.headerTitle}>{t('admin.revenueReport')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Total Revenue Card */}
                <View style={styles.totalCard}>
                    <MaterialCommunityIcons name="cash-multiple" size={32} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.totalLabel}>{t('admin.totalRevenue')}</Text>
                    <Text style={styles.totalAmount}>LKR {totalRevenue.toLocaleString()}</Text>
                    {data.length > 0 && (
                        <Text style={styles.totalPeriod}>Last {data.length} months</Text>
                    )}
                </View>

                {/* Average Card */}
                {data.length > 0 && (
                    <View style={styles.avgCard}>
                        <MaterialCommunityIcons name="trending-up" size={22} color={colors.success} />
                        <View style={styles.avgInfo}>
                            <Text style={styles.avgLabel}>{t('admin.averageMonthlyRevenue')}</Text>
                            <Text style={styles.avgAmount}>LKR {Math.round(avgRevenue).toLocaleString()}</Text>
                        </View>
                    </View>
                )}

                {/* Monthly Breakdown */}
                <Text style={styles.sectionTitle}>{t('doctor.monthlyBreakdown')}</Text>

                {data.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="cash-remove" size={56} color={colors.textDisabled} />
                        <Text style={styles.emptyTitle}>{t('admin.noRevenueData')}</Text>
                        <Text style={styles.emptySubtitle}>{t('admin.revenueAppearHere')}</Text>
                    </View>
                ) : (
                    <View style={styles.monthList}>
                        {data.map((item, i) => {
                            const pct = maxAmount > 0 ? (item.amount / maxAmount) : 0;
                            const monthName = MONTH_NAMES[(item.month - 1) % 12] || `M${item.month}`;
                            return (
                                <View key={i} style={styles.monthRow}>
                                    <View style={styles.monthLabel}>
                                        <Text style={styles.monthName}>{monthName}</Text>
                                        <Text style={styles.monthYear}>{item.year}</Text>
                                    </View>
                                    <View style={styles.barContainer}>
                                        <View style={styles.barTrack}>
                                            <View
                                                style={[
                                                    styles.barFill,
                                                    { width: `${Math.round(pct * 100)}%` as any },
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.monthAmount}>
                                            LKR {item.amount.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
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
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    totalLabel: { ...typography.body, color: 'rgba(255,255,255,0.85)', marginTop: spacing.sm },
    totalAmount: { fontSize: 34, fontWeight: 'bold', color: '#fff', marginTop: spacing.xs },
    totalPeriod: { ...typography.caption, color: 'rgba(255,255,255,0.65)', marginTop: spacing.xs },
    avgCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success + '12',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.success + '30',
        marginBottom: spacing.xxl,
        gap: spacing.md,
    },
    avgInfo: { flex: 1 },
    avgLabel: { ...typography.bodySmall, color: colors.textSecondary },
    avgAmount: { ...typography.h3, color: colors.success, marginTop: 2 },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    monthList: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.lg,
    },
    monthRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    monthLabel: { width: 48, alignItems: 'center' },
    monthName: { ...typography.bodySmall, fontWeight: '700', color: colors.textPrimary },
    monthYear: { ...typography.caption, color: colors.textSecondary },
    barContainer: { flex: 1, gap: spacing.xs },
    barTrack: {
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
    monthAmount: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl * 2 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
    emptySubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
});

export default RevenueReportScreen;
