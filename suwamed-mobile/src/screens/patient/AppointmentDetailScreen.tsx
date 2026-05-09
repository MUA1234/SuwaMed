import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as appointmentApi from '../../api/appointment.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import IconWrap from '../../components/common/IconWrap';

const getStatusStyles = (colors: ThemeColors): Record<string, { color: string; bg: string }> => ({
    confirmed:   { color: colors.success,        bg: colors.successLight },
    pending:     { color: colors.warning,        bg: colors.warningLight },
    completed:   { color: colors.textSecondary,  bg: colors.borderLight },
    cancelled:   { color: colors.error,          bg: colors.errorLight },
    in_progress: { color: colors.primary,        bg: colors.primaryLight },
    no_show:     { color: colors.textSecondary,  bg: colors.borderLight },
});

const AppointmentDetailScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { t } = useTranslation();
    const { appointmentId } = route.params as { appointmentId: string };

    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const fetchAppointment = async () => {
        try {
            const res = await appointmentApi.getAppointmentById(appointmentId);
            setAppointment(res.data);
        } catch (err) {
            console.log('Appointment detail fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchAppointment(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchAppointment(); };

    const handleJoinConsultation = () => {
        Alert.alert(
            t('patient.consultationInProgress') || 'Consultation In Progress',
            t('patient.consultationInProgressBody') || 'Your doctor has started the consultation. Please be available — they will contact you shortly via the in-app chat or by phone using the contact number on file.'
        );
    };

    const handleLeaveReview = () => {
        navigation.navigate('ReviewDoctorScreen', { appointment });
    };

    const handleCancelAppointment = () => {
        let cancelReason = '';
        Alert.alert(
            t('patient.cancelAppointment'),
            t('patient.cancelAppointmentReason'),
            [
                { text: t('patient.keepAppointment'), style: 'cancel' },
                {
                    text: t('patient.cancelAppointment'),
                    style: 'destructive',
                    onPress: () => {
                        Alert.prompt
                            ? Alert.prompt(
                                t('patient.reasonForCancellation'),
                                t('patient.enterReason'),
                                [
                                    { text: t('common.back'), style: 'cancel' },
                                    {
                                        text: t('common.confirm'),
                                        style: 'destructive',
                                        onPress: async (reason: any) => {
                                            if (!reason) return;
                                            await doCancelAppointment(reason);
                                        },
                                    },
                                ],
                                'plain-text'
                            )
                            : confirmCancelWithReason();
                    },
                },
            ]
        );
    };

    const confirmCancelWithReason = () => {
        Alert.alert(
            t('patient.confirmCancellation'),
            t('patient.confirmCancelMessage'),
            [
                { text: t('common.no'), style: 'cancel' },
                {
                    text: t('patient.yesCancel'),
                    style: 'destructive',
                    onPress: () => doCancelAppointment('Cancelled by patient'),
                },
            ]
        );
    };

    const doCancelAppointment = async (reason: string) => {
        setCancelling(true);
        try {
            await appointmentApi.cancelAppointment(appointmentId, reason);
            Alert.alert(t('patient.appointmentCancelled'), t('patient.appointmentCancelledMessage'), [
                { text: t('common.ok'), onPress: () => navigation.goBack() },
            ]);
        } catch (err) {
            Alert.alert(t('common.error'), t('patient.failedCancelAppointment'));
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('patient.appointmentDetails')}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    if (!appointment) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('patient.appointmentDetails')}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.errorState}>
                    <MaterialCommunityIcons name="calendar-remove" size={56} color={colors.textDisabled} />
                    <Text style={styles.errorText}>{t('doctor.appointmentNotFound')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const statusStylesBase = getStatusStyles(colors);
    const sStyle = statusStylesBase[appointment.status] || statusStylesBase.pending;
    const statusLabels: Record<string, string> = {
        confirmed: t('common.confirmed'), pending: t('common.pending'), completed: t('common.completed'),
        cancelled: t('common.cancelled'), in_progress: t('common.inProgress'), no_show: 'No Show',
    };
    const doctorUser = appointment.doctorId?.userId;
    const doctorName = doctorUser ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}` : 'Doctor';
    const specialty = appointment.doctorId?.specialization?.[0] || 'General Practitioner';
    const hospital = appointment.doctorId?.hospital || '';
    const dateStr = appointment.date
        ? new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';
    const typeLabel = appointment.type === 'video' ? t('patient.videoCall') : appointment.type === 'chat' ? t('patient.chat') : t('patient.followUp');
    const typeIcon = appointment.type === 'video' ? 'video' : 'chat';

    const canJoin = ['confirmed', 'in_progress'].includes(appointment.status);
    const canReview = appointment.status === 'completed';
    const canCancel = ['confirmed', 'pending'].includes(appointment.status);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.appointmentDetails')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Status Badge */}
                <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: sStyle.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: sStyle.color }]} />
                        <Text style={[styles.statusText, { color: sStyle.color }]}>{statusLabels[appointment.status] || appointment.status}</Text>
                    </View>
                </View>

                {/* Doctor Info Card */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>{t('auth.doctor')}</Text>
                    <View style={styles.doctorRow}>
                        <View style={styles.doctorAvatar}>
                            <MaterialCommunityIcons name="doctor" size={32} color={colors.primary} />
                        </View>
                        <View style={styles.doctorInfo}>
                            <Text style={styles.doctorName}>{doctorName}</Text>
                            <Text style={styles.doctorSpec}>{specialty}</Text>
                            {hospital ? <Text style={styles.doctorHospital}>{hospital}</Text> : null}
                        </View>
                    </View>
                </View>

                {/* Appointment Info */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>{t('patient.appointmentInfo')}</Text>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoRow}>
                            <IconWrap name="calendar-outline" variant="outlined" size="sm" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{t('common.date')}</Text>
                                <Text style={styles.infoValue}>{dateStr}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <IconWrap name="clock-outline" variant="outlined" size="sm" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{t('common.time')}</Text>
                                <Text style={styles.infoValue}>{appointment.startTime || 'N/A'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <IconWrap name="timer-outline" variant="outlined" size="sm" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{t('patient.duration')}</Text>
                                <Text style={styles.infoValue}>{appointment.duration ? `${appointment.duration} minutes` : 'N/A'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <IconWrap name={typeIcon} variant="outlined" size="sm" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{t('patient.consultationType')}</Text>
                                <Text style={styles.infoValue}>{typeLabel}</Text>
                            </View>
                        </View>
                        {appointment.reason ? (
                            <>
                                <View style={styles.infoDivider} />
                                <View style={styles.infoRow}>
                                    <IconWrap name="text-box-outline" variant="outlined" size="sm" />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>{t('patient.reasonForVisit')}</Text>
                                        <Text style={styles.infoValue}>{appointment.reason}</Text>
                                    </View>
                                </View>
                            </>
                        ) : null}
                    </View>
                </View>

                {/* Payment Info */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>{t('patient.payment')}</Text>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoRow}>
                            <IconWrap name="cash" variant="success" size="sm" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{t('patient.amount')}</Text>
                                <Text style={styles.infoValue}>
                                    {appointment.payment?.amount ? `LKR ${appointment.payment.amount.toLocaleString()}` : appointment.doctorId?.consultationFee ? `LKR ${appointment.doctorId.consultationFee.toLocaleString()}` : 'N/A'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <IconWrap name="credit-card-outline" variant="success" size="sm" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{t('patient.paymentStatus')}</Text>
                                <Text style={[styles.infoValue, { color: appointment.payment?.status === 'completed' ? colors.success : colors.warning }]}>
                                    {appointment.payment?.status ? appointment.payment.status.charAt(0).toUpperCase() + appointment.payment.status.slice(1) : 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                {canJoin && (
                    <TouchableOpacity style={styles.joinBtn} activeOpacity={0.8} onPress={handleJoinConsultation}>
                        <MaterialCommunityIcons name="video" size={20} color="#fff" />
                        <Text style={styles.joinBtnText}>{t('doctor.joinConsultation')}</Text>
                    </TouchableOpacity>
                )}

                {canReview && (
                    <TouchableOpacity style={styles.reviewBtn} activeOpacity={0.8} onPress={handleLeaveReview}>
                        <MaterialCommunityIcons name="star-outline" size={20} color={colors.primary} />
                        <Text style={styles.reviewBtnText}>{t('patient.leaveReview')}</Text>
                    </TouchableOpacity>
                )}

                {canCancel && (
                    <TouchableOpacity
                        style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
                        activeOpacity={0.8}
                        onPress={handleCancelAppointment}
                        disabled={cancelling}
                    >
                        {cancelling ? (
                            <ActivityIndicator size="small" color={colors.error} />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="calendar-remove" size={20} color={colors.error} />
                                <Text style={styles.cancelBtnText}>{t('patient.cancelAppointment')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
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
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    headerTitle: { ...typography.h3, color: colors.textPrimary },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 60 },
    statusRow: { alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.sm },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        gap: spacing.xs,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 14, fontWeight: '700' },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.md },
    doctorRow: { flexDirection: 'row', alignItems: 'center' },
    doctorAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    doctorInfo: { flex: 1 },
    doctorName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
    doctorSpec: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    doctorHospital: { ...typography.caption, color: colors.textDisabled, marginTop: 2 },
    infoGrid: {},
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm, gap: spacing.md },
    infoContent: { flex: 1, justifyContent: 'center' },
    infoLabel: { ...typography.caption, color: colors.textSecondary },
    infoValue: { ...typography.body, fontWeight: '600', color: colors.textPrimary, marginTop: 1 },
    infoDivider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
    joinBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    reviewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryLight,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    reviewBtnText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.error,
    },
    cancelBtnDisabled: { opacity: 0.6 },
    cancelBtnText: { color: colors.error, fontSize: 16, fontWeight: '700' },
    errorState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    errorText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
});

export default AppointmentDetailScreen;
