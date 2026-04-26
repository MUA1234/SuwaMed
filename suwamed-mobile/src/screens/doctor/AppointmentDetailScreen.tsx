import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import * as appointmentApi from '../../api/appointment.api';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
const AppointmentDetailScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { appointmentId } = route.params;
    const { t } = useTranslation();

    const statusStyles: Record<string, { color: string; bg: string; label: string }> = {
        pending: { color: '#F59E0B', bg: '#FFFBEB', label: t('common.pending') },
        confirmed: { color: colors.primary, bg: '#EBF5FF', label: t('common.confirmed') },
        in_progress: { color: '#8B5CF6', bg: '#F5F3FF', label: t('common.inProgress') },
        completed: { color: colors.success, bg: '#ECFDF5', label: t('common.completed') },
        cancelled: { color: colors.error, bg: '#FEF2F2', label: t('common.cancelled') },
        no_show: { color: '#6B7280', bg: '#F3F4F6', label: t('doctor.noShow') },
    };

    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchDetail = async () => {
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

    useFocusEffect(useCallback(() => { fetchDetail(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchDetail(); };

    const handleConfirm = async () => {
        setActionLoading('confirm');
        try {
            await appointmentApi.confirmAppointment(appointmentId);
            fetchDetail();
            Alert.alert(t('common.success'), t('doctor.appointmentConfirmedSuccess'));
        } catch {
            Alert.alert(t('common.error'), t('doctor.failedConfirmAppointment'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = () => {
        Alert.prompt(
            t('doctor.cancelAppointment'),
            t('doctor.provideCancellationReason'),
            [
                { text: t('doctor.keep'), style: 'cancel' },
                {
                    text: t('doctor.cancelAppointment'),
                    style: 'destructive',
                    onPress: async (reason?: string) => {
                        if (!reason?.trim()) {
                            Alert.alert(t('common.error'), t('doctor.reasonRequired'));
                            return;
                        }
                        setActionLoading('cancel');
                        try {
                            await appointmentApi.cancelAppointment(appointmentId, reason.trim());
                            fetchDetail();
                        } catch {
                            Alert.alert(t('common.error'), t('doctor.failedCancelAppointment'));
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ],
            'plain-text'
        );
    };

    const handleStartConsultation = async () => {
        setActionLoading('start');
        try {
            await appointmentApi.startConsultation(appointmentId);
            fetchDetail();
            Alert.alert('Coming Soon', 'Video calls are coming soon. The appointment has been marked as in progress.');
        } catch {
            Alert.alert('Error', 'Failed to start consultation.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEndConsultation = async () => {
        Alert.alert('End Consultation', 'Are you sure you want to end this consultation?', [
            { text: 'Continue', style: 'cancel' },
            {
                text: 'End Consultation',
                onPress: async () => {
                    setActionLoading('end');
                    try {
                        await appointmentApi.endConsultation(appointmentId);
                        fetchDetail();
                    } catch {
                        Alert.alert('Error', 'Failed to end consultation.');
                    } finally {
                        setActionLoading(null);
                    }
                },
            },
        ]);
    };

    const handleWritePrescription = () => {
        navigation.navigate('WritePrescriptionScreen', { appointment });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.heading}>{t('patient.appointmentDetails')}</Text>
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
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.heading}>{t('patient.appointmentDetails')}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.emptyWrap}>
                    <MaterialCommunityIcons name="calendar-remove" size={56} color={colors.textDisabled} />
                    <Text style={styles.emptyText}>Appointment not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const status = appointment.status || 'pending';
    const sStyle = statusStyles[status] || statusStyles.pending;
    const patient = appointment.patientId || {};
    const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient';
    const patientInitials = `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase();
    const dateStr = appointment.date
        ? new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        : 'N/A';
    const typeLabel = appointment.type === 'video' ? 'Video Consultation' : appointment.type === 'chat' ? 'Chat Consultation' : 'Follow-up';
    const typeIcon = appointment.type === 'video' ? 'video' : appointment.type === 'chat' ? 'chat' : 'calendar-refresh';
    const symptoms: string[] = appointment.symptoms || [];
    const paymentStatus = appointment.payment?.status || 'pending';
    const paymentAmount = appointment.payment?.amount || appointment.doctorId?.consultationFee || 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.heading}>{t('patient.appointmentDetails')}</Text>
                <View style={[styles.statusBadge, { backgroundColor: sStyle.bg }]}>
                    <Text style={[styles.statusText, { color: sStyle.color }]}>{sStyle.label}</Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Patient Info Card */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('doctor.patientInfo')}</Text>
                    <View style={styles.card}>
                        <View style={styles.patientRow}>
                            <View style={styles.avatarLarge}>
                                <Text style={styles.avatarText}>{patientInitials}</Text>
                            </View>
                            <View style={styles.patientDetails}>
                                <Text style={styles.patientName}>{patientName}</Text>
                                {patient.phone && (
                                    <View style={styles.contactRow}>
                                        <MaterialCommunityIcons name="phone" size={14} color={colors.textSecondary} />
                                        <Text style={styles.contactText}>{patient.phone}</Text>
                                    </View>
                                )}
                                {patient.email && (
                                    <View style={styles.contactRow}>
                                        <MaterialCommunityIcons name="email" size={14} color={colors.textSecondary} />
                                        <Text style={styles.contactText}>{patient.email}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Appointment Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('patient.appointmentInfo')}</Text>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconWrap}>
                                <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>{t('common.date')}</Text>
                                <Text style={styles.infoValue}>{dateStr}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconWrap}>
                                <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>{t('common.time')}</Text>
                                <Text style={styles.infoValue}>{appointment.startTime || 'N/A'} - {appointment.endTime || 'N/A'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconWrap}>
                                <MaterialCommunityIcons name={typeIcon as any} size={18} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Type</Text>
                                <Text style={styles.infoValue}>{typeLabel}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconWrap}>
                                <MaterialCommunityIcons name="clipboard-text" size={18} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Reason</Text>
                                <Text style={styles.infoValue}>{appointment.reason || 'Not specified'}</Text>
                            </View>
                        </View>
                        {symptoms.length > 0 && (
                            <>
                                <View style={styles.infoDivider} />
                                <View>
                                    <Text style={styles.infoLabel}>Symptoms</Text>
                                    <View style={styles.symptomsList}>
                                        {symptoms.map((symptom: string, idx: number) => (
                                            <View key={idx} style={styles.symptomChip}>
                                                <Text style={styles.symptomText}>{symptom}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Payment Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('patient.paymentInfo')}</Text>
                    <View style={styles.card}>
                        <View style={styles.paymentRow}>
                            <View>
                                <Text style={styles.infoLabel}>{t('patient.amount')}</Text>
                                <Text style={styles.paymentAmount}>LKR {paymentAmount.toLocaleString()}</Text>
                            </View>
                            <View style={[
                                styles.paymentStatusBadge,
                                { backgroundColor: paymentStatus === 'completed' ? '#ECFDF5' : '#FFFBEB' }
                            ]}>
                                <Text style={[
                                    styles.paymentStatusText,
                                    { color: paymentStatus === 'completed' ? colors.success : '#F59E0B' }
                                ]}>
                                    {paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Notes */}
                {appointment.notes && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('common.notes')}</Text>
                        <View style={styles.card}>
                            <Text style={styles.notesText}>{appointment.notes}</Text>
                        </View>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionsSection}>
                    {status === 'pending' && (
                        <>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.confirmBtn, actionLoading === 'confirm' && styles.btnDisabled]}
                                onPress={handleConfirm}
                                disabled={!!actionLoading}
                                activeOpacity={0.8}
                            >
                                {actionLoading === 'confirm' ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                                        <Text style={styles.actionBtnText}>{t('doctor.confirmAppointment')}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.cancelBtn, actionLoading === 'cancel' && styles.btnDisabled]}
                                onPress={handleCancel}
                                disabled={!!actionLoading}
                                activeOpacity={0.8}
                            >
                                {actionLoading === 'cancel' ? (
                                    <ActivityIndicator size="small" color={colors.error} />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.error} />
                                        <Text style={[styles.actionBtnText, { color: colors.error }]}>{t('patient.cancelAppointment')}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    {status === 'confirmed' && (
                        <>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.startBtn, actionLoading === 'start' && styles.btnDisabled]}
                                onPress={handleStartConsultation}
                                disabled={!!actionLoading}
                                activeOpacity={0.8}
                            >
                                {actionLoading === 'start' ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="video" size={20} color="#fff" />
                                        <Text style={styles.actionBtnText}>{t('doctor.startConsultation')}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.prescriptionBtn]}
                                onPress={handleWritePrescription}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons name="prescription" size={20} color={colors.primary} />
                                <Text style={[styles.actionBtnText, { color: colors.primary }]}>{t('doctor.writePrescription')}</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {status === 'completed' && (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.prescriptionBtn]}
                            onPress={handleWritePrescription}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons name="prescription" size={20} color={colors.primary} />
                            <Text style={[styles.actionBtnText, { color: colors.primary }]}>{t('doctor.writePrescription')}</Text>
                        </TouchableOpacity>
                    )}

                    {status === 'in_progress' && (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.endBtn, actionLoading === 'end' && styles.btnDisabled]}
                            onPress={handleEndConsultation}
                            disabled={!!actionLoading}
                            activeOpacity={0.8}
                        >
                            {actionLoading === 'end' ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="stop-circle" size={20} color="#fff" />
                                    <Text style={styles.actionBtnText}>{t('doctor.endConsultation')}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
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
    heading: { ...typography.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' },
    statusBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: '700' },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    section: { marginBottom: spacing.lg },
    sectionTitle: { ...typography.bodySmall, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
    patientRow: { flexDirection: 'row', alignItems: 'center' },
    avatarLarge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: { fontSize: 20, fontWeight: '700', color: colors.primary },
    patientDetails: { flex: 1 },
    patientName: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    contactText: { ...typography.caption, color: colors.textSecondary },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
    infoIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    infoLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
    infoValue: { ...typography.bodySmall, fontWeight: '500', color: colors.textPrimary },
    infoDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
    symptomsList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
    symptomChip: {
        backgroundColor: '#EBF5FF',
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: 12,
    },
    symptomText: { ...typography.caption, color: colors.primary, fontWeight: '500' },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    paymentAmount: { ...typography.h3, color: colors.textPrimary, marginTop: 2 },
    paymentStatusBadge: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 12 },
    paymentStatusText: { fontSize: 13, fontWeight: '700' },
    notesText: { ...typography.body, color: colors.textPrimary, lineHeight: 24 },
    actionsSection: { gap: spacing.sm, marginBottom: spacing.xxl },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    confirmBtn: { backgroundColor: colors.success },
    cancelBtn: { borderWidth: 1.5, borderColor: colors.error, backgroundColor: '#FEF2F2' },
    startBtn: { backgroundColor: colors.primary },
    endBtn: { backgroundColor: colors.error },
    prescriptionBtn: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: '#EBF5FF' },
    actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    btnDisabled: { opacity: 0.6 },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
});

export default AppointmentDetailScreen;
