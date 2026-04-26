import React, { useState, useCallback } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as adminApi from '../../api/admin.api';
import { colors, spacing, borderRadius, typography } from '../../config/theme';
import { useTranslation } from 'react-i18next';

const UserAnalyticsScreen: React.FC = () => {
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

    const roleBreakdown = [
        { label: 'Patients', value: totalPatients, color: '#1A73E8', icon: 'account-heart-outline' },
        { label: 'Doctors', value: totalDoctors, color: '#10B981', icon: 'doctor' },
        { label: 'Admins', value: stats?.totalAdmins ?? 1, color: '#8B5CF6', icon: 'shield-account-outline' },
    ];

    const overallTotal = roleBreakdown.reduce((sum, r) => sum + r.value, 0);

    const statCards = [
        {
            label: 'Total Users',
            value: totalUsers,
            icon: 'account-group',
            color: '#1A73E8',
            bg: '#EBF5FF',
        },
        {
            label: 'Total Doctors',
            value: totalDoctors,
            icon: 'doctor',
            color: '#10B981',
            bg: '#ECFDF5',
        },
        {
            label: 'Total Patients',
            value: totalPatients,
            icon: 'account-heart-outline',
            color: '#8B5CF6',
            bg: '#F5F3FF',
        },
        {
            label: 'Pending Verify',
            value: stats?.pendingVerifications ?? 0,
            icon: 'clock-alert-outline',
            color: '#F59E0B',
            bg: '#FFFBEB',
        },
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
                        <View key={i} style={[styles.statCard, { borderTopColor: card.color }]}>
                            <View style={[styles.statIcon, { backgroundColor: card.bg }]}>
                                <MaterialCommunityIcons name={card.icon as any} size={22} color={card.color} />
                            </View>
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
                                <View style={[styles.roleIconWrap, { backgroundColor: role.color + '15' }]}>
                                    <MaterialCommunityIcons name={role.icon as any} size={20} color={role.color} />
                                </View>
                                <View style={styles.roleInfo}>
                                    <View style={styles.roleMeta}>
                                        <Text style={styles.roleName}>{role.label}</Text>
                                        <Text style={[styles.roleCount, { color: role.color }]}>{role.value}</Text>
                                    </View>
                                    <View style={styles.barTrack}>
                                        <View
                                            style={[
                                                styles.barFill,
                                                {
                                                    width: `${Math.round(pct * 100)}%` as any,
                                                    backgroundColor: role.color,
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
                    <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
                    <View style={styles.summaryInfo}>
                        <Text style={styles.summaryLabel}>{t('admin.totalRegisteredUsers')}</Text>
                        <Text style={styles.summaryValue}>{totalUsers} users</Text>
                    </View>
                </View>
            </ScrollView>
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
    scroll: { padding: spacing.xl, paddingBottom: 100 },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primary + '10',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.primary + '25',
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
        borderTopWidth: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    statValue: { ...typography.h2, color: colors.textPrimary },
    statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
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
    roleIconWrap: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    roleInfo: { flex: 1 },
    roleMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    roleName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    roleCount: { ...typography.body, fontWeight: '700' },
    barTrack: {
        height: 8,
        backgroundColor: colors.border,
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
        backgroundColor: colors.primary + '10',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.primary + '25',
    },
    summaryInfo: { flex: 1 },
    summaryLabel: { ...typography.bodySmall, color: colors.textSecondary },
    summaryValue: { ...typography.h3, color: colors.primary, marginTop: 2 },
});

export default UserAnalyticsScreen;
