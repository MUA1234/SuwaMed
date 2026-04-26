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
import FadeIn from '../../components/common/FadeIn';
import { StatCardSkeleton, AppointmentCardSkeleton, SkeletonList } from '../../components/common/Skeleton';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import * as doctorApi from '../../api/doctor.api';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, typography, shadows, gradients } from '../../config/theme';

const { width } = Dimensions.get('window');


const DashboardScreen: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);

    const fetchData = async () => {
        try {
            const res = await doctorApi.getDashboardStats();
            setStats(res.data);
        } catch (err) {
            console.log('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('doctor.goodMorning');
        if (hour < 17) return t('doctor.goodAfternoon');
        return t('doctor.goodEvening');
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ padding: spacing.xl }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </View>
                    <View style={{ marginTop: spacing.lg }}>
                        <SkeletonList count={3} ItemSkeleton={AppointmentCardSkeleton} />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    const statsCards = [
        { label: t('doctor.todayAppts'), value: String(stats?.todayAppointmentsCount || 0), icon: 'calendar-check', gradient: gradients.primary },
        { label: t('doctor.totalPatients'), value: String(stats?.totalPatients || 0), icon: 'account-group', gradient: gradients.secondary },
        { label: t('doctor.todayEarnings'), value: `LKR ${((stats?.todayEarnings || 0) / 1000).toFixed(0)}K`, icon: 'cash', gradient: ['#F59E0B', '#D97706'] as [string, string] },
        { label: t('doctor.rating'), value: stats?.rating?.average?.toFixed(1) || '0', icon: 'star', gradient: ['#8B5CF6', '#7C3AED'] as [string, string] },
    ];

    const todayAppointments = stats?.todayAppointments || [];
    const recentAppointments = stats?.recentAppointments || [];

    const formatType = (type: string) => type === 'video' ? t('doctor.videoType') : type === 'chat' ? t('doctor.chatType') : t('doctor.followUpType');

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Header */}
                <FadeIn delay={0}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>{getGreeting()}</Text>
                            <Text style={styles.doctorName}>Dr. {user?.firstName} {user?.lastName}</Text>
                        </View>
                        <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('NotificationsScreen')} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textPrimary} />
                            <View style={styles.notifDot} />
                        </TouchableOpacity>
                    </View>
                </FadeIn>

                {/* Stats */}
                <FadeIn delay={100}>
                    <View style={styles.statsGrid}>
                        {statsCards.map((stat, i) => (
                            <View key={i} style={styles.statCard}>
                                <LinearGradient
                                    colors={stat.gradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.statIconWrap}
                                >
                                    <MaterialCommunityIcons name={stat.icon as any} size={18} color="#FFFFFF" />
                                </LinearGradient>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </FadeIn>

                {/* Quick Actions */}
                <FadeIn delay={150}>
                    <View style={styles.quickActions}>
                        <TouchableOpacity style={styles.quickAction} activeOpacity={0.7} onPress={() => navigation.navigate('AppointmentRequestsScreen')}>
                            <LinearGradient colors={gradients.primary} style={styles.quickIconWrap}>
                                <MaterialCommunityIcons name="video-outline" size={22} color="#FFFFFF" />
                            </LinearGradient>
                            <Text style={styles.quickText}>{t('doctor.requests')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickAction} activeOpacity={0.7} onPress={() => navigation.getParent()?.navigate('Schedule')}>
                            <LinearGradient colors={gradients.secondary} style={styles.quickIconWrap}>
                                <MaterialCommunityIcons name="calendar-edit" size={22} color="#FFFFFF" />
                            </LinearGradient>
                            <Text style={styles.quickText}>{t('doctor.schedule')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickAction} activeOpacity={0.7} onPress={() => navigation.getParent()?.navigate('Patients')}>
                            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.quickIconWrap}>
                                <MaterialCommunityIcons name="account-group-outline" size={22} color="#FFFFFF" />
                            </LinearGradient>
                            <Text style={styles.quickText}>{t('doctor.patients')}</Text>
                        </TouchableOpacity>
                    </View>
                </FadeIn>

                {/* Today's Appointments */}
                <FadeIn delay={200}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t('doctor.todayAppointments')}</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('AppointmentRequestsScreen')} activeOpacity={0.7}>
                                <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
                            </TouchableOpacity>
                        </View>
                        {todayAppointments.length === 0 && (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconWrap}>
                                    <MaterialCommunityIcons name="calendar-blank-outline" size={32} color={colors.textDisabled} />
                                </View>
                                <Text style={styles.emptyText}>{t('patient.noAppointmentsToday')}</Text>
                                <Text style={styles.emptySubtext}>{t('patient.enjoyFreeTime')}</Text>
                            </View>
                        )}
                        {todayAppointments.map((appt: any) => (
                            <TouchableOpacity key={appt._id} style={styles.appointmentCard} activeOpacity={0.7} onPress={() => navigation.navigate('AppointmentDetailScreen', { appointmentId: appt._id })}>
                                <View style={styles.apptLeft}>
                                    <View style={styles.apptAvatarWrap}>
                                        <Text style={styles.apptAvatarText}>
                                            {(appt.patientId?.firstName?.[0] || '').toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.apptInfo}>
                                        <Text style={styles.apptPatient} numberOfLines={1}>
                                            {appt.patientId?.firstName} {appt.patientId?.lastName}
                                        </Text>
                                        <Text style={styles.apptCondition} numberOfLines={1}>{appt.reason || t('patient.consultation')}</Text>
                                    </View>
                                </View>
                                <View style={styles.apptRight}>
                                    <Text style={styles.apptTime}>{appt.startTime}</Text>
                                    <View style={[styles.apptTypeBadge, appt.type === 'video' ? styles.videoBadge : styles.chatBadge]}>
                                        <MaterialCommunityIcons name={appt.type === 'video' ? 'video-outline' : 'chat-outline'} size={11} color={appt.type === 'video' ? colors.primary : colors.secondary} />
                                        <Text style={[styles.apptTypeText, { color: appt.type === 'video' ? colors.primary : colors.secondary }]}>{formatType(appt.type)}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </FadeIn>

                {/* Recent Activity */}
                <FadeIn delay={250}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('patient.recentActivity')}</Text>
                        {recentAppointments.length === 0 && (
                            <Text style={[styles.emptyText, { textAlign: 'left', paddingVertical: spacing.lg }]}>{t('patient.noRecentActivity')}</Text>
                        )}
                        {recentAppointments.map((act: any) => (
                            <View key={act._id} style={styles.activityRow}>
                                <View style={[styles.activityIconWrap, act.status === 'completed' && styles.activityCompleted]}>
                                    <MaterialCommunityIcons name={act.status === 'completed' ? 'check' : 'clock-outline'} size={14} color={act.status === 'completed' ? colors.success : colors.primary} />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityText} numberOfLines={1}>
                                        {act.status === 'completed' ? t('common.completed') : t('doctor.appointment')} {t('doctor.with')} {act.patientId?.firstName} {act.patientId?.lastName}
                                    </Text>
                                    <Text style={styles.activityTime}>{act.reason}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </FadeIn>
            </ScrollView>
        </SafeAreaView>
    );
};

const STAT_CARD_WIDTH = (width - spacing.xl * 2 - spacing.md) / 2;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 100 },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxl },
    greeting: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '500' },
    doctorName: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 2, letterSpacing: -0.3 },
    notifBtn: { width: 44, height: 44, borderRadius: borderRadius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.md },
    notifDot: { position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error, borderWidth: 1.5, borderColor: colors.surface },

    // Stats
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
    statCard: { width: STAT_CARD_WIDTH, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, ...shadows.sm },
    statIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    statValue: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 1 },
    statLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },

    // Quick Actions
    quickActions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    quickAction: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', ...shadows.sm },
    quickIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    quickText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600', textAlign: 'center' },

    // Section
    section: { marginBottom: spacing.xl },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2 },
    seeAll: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
    emptyIconWrap: { width: 64, height: 64, borderRadius: borderRadius.xl, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    emptyText: { ...typography.body, color: colors.textSecondary, fontWeight: '500' },
    emptySubtext: { ...typography.caption, color: colors.textDisabled, marginTop: 2 },

    // Appointments
    appointmentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.sm, ...shadows.sm },
    apptLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    apptAvatarWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    apptAvatarText: { fontSize: 16, fontWeight: '700', color: colors.primary },
    apptInfo: { flex: 1 },
    apptPatient: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    apptCondition: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    apptRight: { alignItems: 'flex-end', marginLeft: spacing.sm },
    apptTime: { ...typography.bodySmall, fontWeight: '700', color: colors.textPrimary },
    apptTypeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full, marginTop: 4, gap: 3 },
    videoBadge: { backgroundColor: colors.primaryLight },
    chatBadge: { backgroundColor: colors.secondaryLight },
    apptTypeText: { fontSize: 10, fontWeight: '600' },

    // Activity
    activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight },
    activityIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    activityCompleted: { backgroundColor: colors.successLight },
    activityInfo: { flex: 1 },
    activityText: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '500' },
    activityTime: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});

export default DashboardScreen;
