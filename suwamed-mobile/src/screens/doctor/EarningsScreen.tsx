import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as doctorApi from '../../api/doctor.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const EarningsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<any>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

    const fetchData = async () => {
        try {
            const res = await doctorApi.getEarnings();
            setData(res.data);
        } catch (err) {
            console.log('Earnings fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}><Text style={styles.heading}>{t('doctor.earnings')}</Text></View>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    const monthlyEarnings = data?.monthlyEarnings || [];
    const maxAmount = Math.max(...monthlyEarnings.map((e: any) => e.amount), 1);
    const totalEarnings = data?.totalEarnings || 0;
    const pendingWithdrawal = data?.pendingWithdrawal || 0;
    const recentTransactions = data?.recentTransactions || [];

    // Calculate this month's earnings
    const thisMonthEarnings = monthlyEarnings.length > 0 ? monthlyEarnings[monthlyEarnings.length - 1].amount : 0;
    const lastMonthEarnings = monthlyEarnings.length > 1 ? monthlyEarnings[monthlyEarnings.length - 2].amount : 0;
    const percentChange = lastMonthEarnings > 0 ? (((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100).toFixed(1) : '0';

    const periods = [
        { key: 'week' as const, label: 'This Week' },
        { key: 'month' as const, label: 'This Month' },
        { key: 'year' as const, label: 'This Year' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
                <View style={styles.header}><Text style={styles.heading}>{t('doctor.earnings')}</Text></View>

                <View style={styles.mainCard}>
                    <View style={styles.mainCardBg}>
                        <Text style={styles.mainLabel}>{t('doctor.totalEarnings')}</Text>
                        <Text style={styles.mainAmount}>LKR {totalEarnings.toLocaleString()}</Text>
                        <View style={styles.mainRow}>
                            <View style={styles.mainStat}>
                                <MaterialCommunityIcons name={Number(percentChange) >= 0 ? 'trending-up' : 'trending-down'} size={16} color={Number(percentChange) >= 0 ? '#10B981' : '#DC2626'} />
                                <Text style={[styles.mainStatText, { color: Number(percentChange) >= 0 ? '#A7F3D0' : '#FCA5A5' }]}>
                                    {Number(percentChange) >= 0 ? '+' : ''}{percentChange}% from last month
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.mainSubCards}>
                        <View style={styles.subCard}>
                            <Text style={styles.subLabel}>This Month</Text>
                            <Text style={styles.subAmount}>LKR {thisMonthEarnings.toLocaleString()}</Text>
                        </View>
                        <View style={[styles.subCard, styles.subCardRight]}>
                            <Text style={styles.subLabel}>{t('common.pending')}</Text>
                            <Text style={[styles.subAmount, { color: '#F59E0B' }]}>LKR {pendingWithdrawal.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.periodRow}>
                    {periods.map((p) => (
                        <TouchableOpacity key={p.key} style={[styles.periodBtn, selectedPeriod === p.key && styles.periodBtnActive]} onPress={() => setSelectedPeriod(p.key)} activeOpacity={0.7}>
                            <Text style={[styles.periodText, selectedPeriod === p.key && styles.periodTextActive]}>{p.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.chartSection}>
                    <Text style={styles.chartTitle}>{t('admin.monthlyTrend')}</Text>
                    <View style={styles.chart}>
                        {monthlyEarnings.map((item: any, i: number) => (
                            <View key={i} style={styles.barWrap}>
                                <View style={styles.barContainer}>
                                    <View style={[styles.bar, { height: `${(item.amount / maxAmount) * 100}%`, backgroundColor: i === monthlyEarnings.length - 1 ? colors.primary : '#E0E7FF' }]} />
                                </View>
                                <Text style={styles.barLabel}>{item.month}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.withdrawBtn} activeOpacity={0.8} onPress={() => navigation.navigate('WithdrawScreen', { pendingAmount: pendingWithdrawal })}>
                    <MaterialCommunityIcons name="bank-transfer-out" size={22} color="#fff" />
                    <Text style={styles.withdrawText}>{t('doctor.withdrawToBank')}</Text>
                </TouchableOpacity>

                <View style={styles.transSection}>
                    <View style={styles.transSectionHeader}>
                        <Text style={styles.transTitle}>{t('doctor.recentTransactions')}</Text>
                        <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
                    </View>
                    {recentTransactions.length === 0 && (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="cash-remove" size={36} color={colors.textDisabled} />
                            <Text style={styles.emptyText}>{t('doctor.noTransactions')}</Text>
                        </View>
                    )}
                    {recentTransactions.map((tx: any) => {
                        const patientName = tx.patientId ? `${tx.patientId.firstName} ${tx.patientId.lastName}` : 'Patient';
                        const typeLabel = tx.type === 'follow_up' ? 'Follow-up' : tx.type === 'chat' ? 'Chat' : 'Video Consultation';
                        const dateStr = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        return (
                            <View key={tx._id} style={styles.txCard}>
                                <View style={styles.txIconWrap}>
                                    <MaterialCommunityIcons name="cash-plus" size={20} color="#10B981" />
                                </View>
                                <View style={styles.txInfo}>
                                    <Text style={styles.txPatient}>{patientName}</Text>
                                    <Text style={styles.txType}>{typeLabel} · {dateStr}</Text>
                                </View>
                                <Text style={styles.txAmount}>+LKR {(tx.payment?.amount || 0).toLocaleString()}</Text>
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
    header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
    heading: { ...typography.h2, color: colors.textPrimary },
    mainCard: { marginHorizontal: spacing.xl, marginBottom: spacing.xxl },
    mainCardBg: { backgroundColor: colors.primary, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.xxl },
    mainLabel: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)' },
    mainAmount: { fontSize: 32, fontWeight: '700', color: '#fff', marginVertical: spacing.xs },
    mainRow: { flexDirection: 'row', alignItems: 'center' },
    mainStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    mainStatText: { ...typography.caption },
    mainSubCards: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomLeftRadius: borderRadius.lg, borderBottomRightRadius: borderRadius.lg, borderWidth: 1, borderTopWidth: 0, borderColor: colors.border },
    subCard: { flex: 1, padding: spacing.lg, alignItems: 'center' },
    subCardRight: { borderLeftWidth: 1, borderLeftColor: colors.border },
    subLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
    subAmount: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
    periodRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.xxl },
    periodBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    periodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    periodText: { ...typography.bodySmall, fontWeight: '500', color: colors.textSecondary },
    periodTextActive: { color: '#fff', fontWeight: '600' },
    chartSection: { paddingHorizontal: spacing.xl, marginBottom: spacing.xxl },
    chartTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.lg },
    chart: { flexDirection: 'row', justifyContent: 'space-between', height: 140, alignItems: 'flex-end' },
    barWrap: { alignItems: 'center', flex: 1 },
    barContainer: { height: 120, width: 28, justifyContent: 'flex-end', borderRadius: 6, overflow: 'hidden' },
    bar: { width: '100%', borderRadius: 6 },
    barLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    withdrawBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', marginHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md, gap: spacing.sm, marginBottom: spacing.xxl },
    withdrawText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    transSection: { paddingHorizontal: spacing.xl },
    transSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    transTitle: { ...typography.h3, color: colors.textPrimary },
    seeAll: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
    emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
    emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
    txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
    txIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    txInfo: { flex: 1 },
    txPatient: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    txType: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    txAmount: { ...typography.body, fontWeight: '700', color: '#10B981' },
});

export default EarningsScreen;
