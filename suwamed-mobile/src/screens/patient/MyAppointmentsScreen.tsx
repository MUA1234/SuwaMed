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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as appointmentApi from '../../api/appointment.api';
import { colors, spacing, borderRadius, typography, shadows, gradients } from '../../config/theme';
import { AppointmentCardSkeleton, SkeletonList } from '../../components/common/Skeleton';

type TabKey = 'upcoming' | 'past' | 'cancelled';

const statusStyles: Record<string, { color: string; bg: string }> = {
    confirmed: { color: '#10B981', bg: '#ECFDF5' },
    pending: { color: '#F59E0B', bg: '#FFFBEB' },
    completed: { color: '#64748B', bg: '#F1F5F9' },
    cancelled: { color: '#EF4444', bg: '#FEF2F2' },
    in_progress: { color: '#2563EB', bg: '#EFF6FF' },
    no_show: { color: '#64748B', bg: '#F1F5F9' },
};

const getStatusLabel = (t: any): Record<string, string> => ({
    confirmed: t('common.confirmed'), pending: t('common.pending'), completed: t('common.completed'),
    cancelled: t('common.cancelled'), in_progress: t('common.inProgress'), no_show: 'No Show',
});

const MyAppointmentsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
    const [allAppointments, setAllAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAppointments = async () => {
        try {
            const res = await appointmentApi.getAppointments();
            setAllAppointments(res.data || []);
        } catch (err) {
            console.log('Appointments fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchAppointments(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchAppointments(); };

    const now = new Date();
    const getFiltered = (tab: TabKey) => allAppointments.filter((a: any) => {
        if (tab === 'upcoming') return ['confirmed', 'pending', 'in_progress'].includes(a.status) && new Date(a.date) >= new Date(now.toDateString());
        if (tab === 'past') return a.status === 'completed';
        return a.status === 'cancelled';
    });

    const filteredAppointments = getFiltered(activeTab);

    const statusLabels = getStatusLabel(t);
    const tabs: { key: TabKey; label: string; icon: string }[] = [
        { key: 'upcoming', label: t('patient.upcoming'), icon: 'clock-outline' },
        { key: 'past', label: t('patient.past'), icon: 'check-circle-outline' },
        { key: 'cancelled', label: t('common.cancelled'), icon: 'close-circle-outline' },
    ];

    const renderAppointment = ({ item }: { item: any }) => {
        const sStyle = statusStyles[item.status] || statusStyles.pending;
        const doctorUser = item.doctorId?.userId;
        const doctorName = doctorUser ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}` : 'Doctor';
        const specialty = item.doctorId?.specialization?.[0] || '';
        const dateStr = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const typeLabel = item.type === 'video' ? t('patient.videoCall') : item.type === 'chat' ? t('patient.chat') : t('patient.followUp');
        const initials = doctorUser ? `${(doctorUser.firstName?.[0] || '').toUpperCase()}${(doctorUser.lastName?.[0] || '').toUpperCase()}` : 'DR';

        return (
            <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate('AppointmentDetailScreen', { appointmentId: item._id })}>
                <View style={styles.cardHeader}>
                    <LinearGradient colors={gradients.primary} style={styles.docAvatar}>
                        <Text style={styles.docAvatarText}>{initials}</Text>
                    </LinearGradient>
                    <View style={styles.docInfo}>
                        <Text style={styles.docName} numberOfLines={1}>{doctorName}</Text>
                        <Text style={styles.docSpec}>{specialty}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: sStyle.bg }]}>
                        <Text style={[styles.statusText, { color: sStyle.color }]}>{statusLabels[item.status] || item.status}</Text>
                    </View>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.cardFooter}>
                    <View style={styles.cardDetail}>
                        <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{dateStr}</Text>
                    </View>
                    <View style={styles.cardDetail}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{item.startTime}</Text>
                    </View>
                    <View style={styles.cardDetail}>
                        <MaterialCommunityIcons name={item.type === 'video' ? 'video-outline' : 'chat-outline'} size={14} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{typeLabel}</Text>
                    </View>
                </View>
                {item.status === 'confirmed' && activeTab === 'upcoming' && (
                    <TouchableOpacity style={styles.joinBtn} activeOpacity={0.8} onPress={() => navigation.navigate('AppointmentDetailScreen', { appointmentId: item._id })}>
                        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.joinGradient}>
                            <MaterialCommunityIcons name="video-outline" size={18} color="#fff" />
                            <Text style={styles.joinText}>{t('doctor.joinConsultation')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
                {item.status === 'completed' && (
                    <TouchableOpacity style={styles.reviewBtn} activeOpacity={0.7} onPress={() => navigation.navigate('ReviewDoctorScreen', { appointment: item })}>
                        <MaterialCommunityIcons name="star-outline" size={16} color={colors.primary} />
                        <Text style={styles.reviewText}>{t('patient.leaveReview')}</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}><Text style={styles.heading}>{t('patient.myAppointments')}</Text></View>
                <View style={{ padding: spacing.xl }}>
                    <SkeletonList count={4} ItemSkeleton={AppointmentCardSkeleton} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}><Text style={styles.heading}>{t('patient.myAppointments')}</Text></View>

            <View style={styles.tabs}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const count = getFiltered(tab.key).length;
                    return isActive ? (
                        <LinearGradient
                            key={tab.key}
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.tabGradient}
                        >
                            <TouchableOpacity onPress={() => setActiveTab(tab.key)} activeOpacity={0.8} style={styles.tabInner}>
                                <Text style={styles.tabTextActive}>{tab.label} ({count})</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    ) : (
                        <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => setActiveTab(tab.key)} activeOpacity={0.7}>
                            <Text style={styles.tabText}>{tab.label} ({count})</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <FlatList
                data={filteredAppointments}
                renderItem={renderAppointment}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconWrap}>
                            <MaterialCommunityIcons name="calendar-blank-outline" size={36} color={colors.textDisabled} />
                        </View>
                        <Text style={styles.emptyTitle}>{t('patient.noAppointments')}</Text>
                        <Text style={styles.emptySubtext}>
                            {activeTab === 'upcoming' ? t('patient.bookAppointment') : t('patient.noAppointments')}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
    heading: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },

    // Tabs
    tabs: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
    tab: { flex: 1, paddingVertical: spacing.sm + 1, borderRadius: borderRadius.full, backgroundColor: colors.surface, alignItems: 'center', ...shadows.sm },
    tabGradient: { flex: 1, borderRadius: borderRadius.full, ...shadows.md },
    tabInner: { paddingVertical: spacing.sm + 1, alignItems: 'center' },
    tabText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
    tabTextActive: { ...typography.caption, color: '#fff', fontWeight: '700' },

    // Card
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadows.sm },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    docAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    docAvatarText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
    docInfo: { flex: 1 },
    docName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    docSpec: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
    statusBadge: { paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: borderRadius.full },
    statusText: { fontSize: 11, fontWeight: '700' },
    cardDivider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.md },
    cardFooter: { flexDirection: 'row', gap: spacing.xl },
    cardDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },

    // Actions
    joinBtn: { marginTop: spacing.md, borderRadius: borderRadius.sm, overflow: 'hidden' },
    joinGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm + 2, gap: spacing.xs },
    joinText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    reviewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight, borderRadius: borderRadius.sm, paddingVertical: spacing.sm + 1, marginTop: spacing.md, gap: spacing.xs },
    reviewText: { color: colors.primary, fontWeight: '600', fontSize: 13 },

    // Empty
    empty: { alignItems: 'center', paddingVertical: spacing.xxxxl },
    emptyIconWrap: { width: 72, height: 72, borderRadius: borderRadius.xxl, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
    emptySubtext: { ...typography.bodySmall, color: colors.textSecondary },
});

export default MyAppointmentsScreen;
