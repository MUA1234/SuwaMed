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
import IconWrap, { IconWrapVariant } from '../../components/common/IconWrap';

const UserAnalyticsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);

    const fetchData = async () => {
        try {
            const res = await adminApi.getDashboard();
            setStats(res.data);
        } catch (err) {
            console.log('User analytics error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const totalUsers = stats ? (stats.totalUsers ?? 0) : 0;
    const totalDoctors = stats ? (stats.totalDoctors ?? 0) : 0;
    const totalPatients = totalUsers - totalDoctors > 0 ? totalUsers - totalDoctors : 0;

    type Role = { label: string; value: number; icon: string; variant: IconWrapVariant; barColor: string };
    const roleBreakdown: Role[] = [
        { label: 'Patients', value: totalPatients, icon: 'account-heart-outline', variant: 'tinted', barColor: colors.primary },
        { label: 'Doctors', value: totalDoctors, icon: 'doctor', variant: 'success', barColor: colors.success },
        { label: 'Admins', value: stats?.totalAdmins ?? 1, icon: 'shield-account-outline', variant: 'accent', barColor: colors.secondary },
    ];

    const overallTotal = roleBreakdown.reduce((sum, r) => sum + r.value, 0);

    type StatCard = { label: string; value: number; icon: string; variant: IconWrapVariant };
    const statCards: StatCard[] = [
        { label: 'Total Users', value: totalUsers, icon: 'account-group-outline', variant: 'tinted' },
        { label: 'Total Doctors', value: totalDoctors, icon: 'doctor', variant: 'tinted' },
        { label: 'Total Patients', value: totalPatients, icon: 'account-heart-outline', variant: 'tinted' },
        { label: 'Pending Verify', value: stats?.pendingVerifications ?? 0, icon: 'clock-alert-outline', variant: 'warning' },
    ];

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('admin.userAnalytics')}</Text>
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
                <Text style={styles.headerTitle}>{t('admin.userAnalytics')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Info note */}
                <View style={styles.infoBanner}>
                    <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary} />
                    <Text style={styles.infoText}>Analytics data from system inception</Text>
                </View>

                {/* Stats grid */}
                <View style={styles.statsGrid}>
                    {statCards.map((card, i) => (
                        <View key={i} style={styles.statCard}>
                            <IconWrap name={card.icon} variant={card.variant} size="md" />
                            <Text style={styles.statValue}>{card.value}</Text>
                            <Text style={styles.statLabel}>{card.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Role Breakdown */}
                <Text style={styles.sectionTitle}>{t('admin.roleBreakdown')}</Text>
                <View style={styles.breakdownCard}>
                    {roleBreakdown.map((role, i) => {
                        const pct = overallTotal > 0 ? (role.value / overallTotal) : 0;
                        return (
                            <View key={i} style={styles.roleRow}>
                                <IconWrap name={role.icon} variant={role.variant} size="md" />
                                <View style={styles.roleInfo}>
                                    <View style={styles.roleMeta}>
                                        <Text style={styles.roleName}>{role.label}</Text>
                                        <Text style={[styles.roleCount, { color: role.barColor }]}>{role.value}</Text>
                                    </View>
                                    <View style={styles.barTrack}>
                                        <View
                                            style={[
                                                styles.barFill,
                                                {
                                                    width: `${Math.round(pct * 100)}%` as any,
                                                    backgroundColor: role.barColor,
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.rolePct}>{Math.round(pct * 100)}% of total</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Total Summary */}
                <View style={styles.summaryCard}>
                    <IconWrap name="account-group-outline" variant="tinted" size="md" />
                    <View style={styles.summaryInfo}>
                        <Text style={styles.summaryLabel}>{t('admin.totalRegisteredUsers')}</Text>
                        <Text style={styles.summaryValue}>{totalUsers} users</Text>
                    </View>
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
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primaryLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    infoText: { ...typography.bodySmall, color: colors.primary, fontWeight: '500' },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.xxl,
    },
    statCard: {
        width: '47%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statValue: { ...typography.h2, color: colors.textPrimary },
    statLabel: { ...typography.caption, color: colors.textSecondary },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    breakdownCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.lg,
        marginBottom: spacing.xxl,
    },
    roleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    roleInfo: { flex: 1 },
    roleMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    roleName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    roleCount: { ...typography.body, fontWeight: '700' },
    barTrack: {
        height: 8,
        backgroundColor: colors.borderLight,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    barFill: { height: 8, borderRadius: 4 },
    rolePct: { ...typography.caption, color: colors.textSecondary },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.primaryLight,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    summaryInfo: { flex: 1 },
    summaryLabel: { ...typography.bodySmall, color: colors.textSecondary },
    summaryValue: { ...typography.h3, color: colors.primary, marginTop: 2 },
});

export default UserAnalyticsScreen;
