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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as appointmentApi from '../../api/appointment.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { AppointmentCardSkeleton, SkeletonList } from '../../components/common/Skeleton';

type TabKey = 'upcoming' | 'past' | 'cancelled';

const getStatusStyles = (colors: ThemeColors): Record<string, { color: string; bg: string }> => ({
    confirmed:   { color: colors.success,        bg: colors.successLight },
    pending:     { color: colors.warning,        bg: colors.warningLight },
    completed:   { color: colors.textSecondary,  bg: colors.borderLight },
    cancelled:   { color: colors.error,          bg: colors.errorLight },
    in_progress: { color: colors.primary,        bg: colors.primaryLight },
    no_show:     { color: colors.textSecondary,  bg: colors.borderLight },
});

const getStatusLabel = (t: any): Record<string, string> => ({
    confirmed: t('common.confirmed'), pending: t('common.pending'), completed: t('common.completed'),
    cancelled: t('common.cancelled'), in_progress: t('common.inProgress'), no_show: 'No Show',
});

const MyAppointmentsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
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

    const statusStyles = getStatusStyles(colors);

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
                    <View style={styles.docAvatar}>
                        <Text style={styles.docAvatarText}>{initials}</Text>
                    </View>
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
                        <MaterialCommunityIcons name="video-outline" size={18} color="#fff" />
                        <Text style={styles.joinText}>{t('doctor.joinConsultation')}</Text>
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
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, isActive && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label} ({count})</Text>
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

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
    heading: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },

    // Tabs
    tabs: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
    tab: { flex: 1, paddingVertical: spacing.sm + 1, borderRadius: borderRadius.full, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
    tabTextActive: { color: '#fff', fontWeight: '700' },

    // Card
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    docAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, backgroundColor: colors.primary },
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
    joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginTop: spacing.md, borderRadius: borderRadius.sm, paddingVertical: spacing.sm + 2, gap: spacing.xs },
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
