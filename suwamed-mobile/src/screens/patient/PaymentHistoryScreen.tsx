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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as paymentApi from '../../api/payment.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface PaymentItem {
    _id: string;
    userId: string;
    appointmentId: {
        doctorId: {
            userId: {
                firstName: string;
                lastName: string;
            };
        };
        date: string;
        type: string;
    };
    amount: number;
    status: string;
    createdAt: string;
}

const PaymentHistoryScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [payments, setPayments] = useState<PaymentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async () => {
        try {
            const res = await paymentApi.getHistory();
            setPayments(res.data || []);
        } catch (err) {
            console.log('Payment history fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchHistory(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchHistory(); };

    const totalSpent = payments
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    const statusStyle = (status: string) => {
        if (status === 'completed') return { color: colors.success, bg: colors.successLight };
        if (status === 'pending') return { color: colors.warning, bg: colors.warningLight };
        if (status === 'failed') return { color: colors.error, bg: colors.errorLight };
        return { color: colors.textSecondary, bg: colors.borderLight };
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const renderItem = ({ item }: { item: PaymentItem }) => {
        const doctor = item.appointmentId?.doctorId?.userId;
        const doctorName = doctor
            ? `Dr. ${doctor.firstName} ${doctor.lastName}`
            : 'Doctor';
        const apptDate = item.appointmentId?.date
            ? formatDate(item.appointmentId.date)
            : formatDate(item.createdAt);
        const type = item.appointmentId?.type || '';
        const sStyle = statusStyle(item.status);

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={styles.iconWrap}>
                        <MaterialCommunityIcons name="receipt" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.doctorName}>{doctorName}</Text>
                        <Text style={styles.apptDate}>{apptDate}{type ? ` · ${type}` : ''}</Text>
                    </View>
                    <View>
                        <Text style={styles.amount}>LKR {item.amount?.toLocaleString()}</Text>
                        <View style={[styles.badge, { backgroundColor: sStyle.bg }]}>
                            <Text style={[styles.badgeText, { color: sStyle.color }]}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={styles.cardFooter}>
                    <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.createdAt}>{formatDate(item.createdAt)}</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('patient.paymentHistory')}</Text>
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
                <Text style={styles.headerTitle}>{t('patient.paymentHistory')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Stats Card */}
            <View style={styles.statsCard}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>LKR {totalSpent.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>{t('common.totalSpent')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{payments.length}</Text>
                    <Text style={styles.statLabel}>{t('common.totalConsultations')}</Text>
                </View>
            </View>

            <FlatList
                data={payments}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="receipt-outline" size={56} color={colors.textDisabled} />
                        <Text style={styles.emptyTitle}>{t('patient.noPayments')}</Text>
                        <Text style={styles.emptySubtitle}>{t('patient.paymentHistoryAppearHere')}</Text>
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
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        marginHorizontal: spacing.xl,
        marginTop: spacing.xl,
        marginBottom: spacing.lg,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.xl,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
    statLabel: { ...typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
    listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    cardInfo: { flex: 1 },
    doctorName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    apptDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    amount: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, textAlign: 'right' },
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: spacing.xs,
        alignSelf: 'flex-end',
    },
    badgeText: { fontSize: 11, fontWeight: '600' },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    createdAt: { ...typography.caption, color: colors.textSecondary },
    emptyState: { alignItems: 'center', paddingTop: spacing.xxxl * 2 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
    emptySubtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});

export default PaymentHistoryScreen;
