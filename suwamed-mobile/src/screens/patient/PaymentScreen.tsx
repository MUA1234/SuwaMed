import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import * as appointmentApi from '../../api/appointment.api';

const AVATAR_COLORS = [
    '#1A73E8', '#00BFA5', '#FF6D00', '#8B5CF6', '#DC2626',
    '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#0D47A1',
];

const getInitials = (firstName: string, lastName: string) =>
    `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();

const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatDisplayDate = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const PaymentScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { t } = useTranslation();
    const { doctorId, doctor, date, startTime, endTime, type, reason, amount } = route.params || {};

    const [processing, setProcessing] = useState(false);

    const firstName = doctor?.userId?.firstName || '';
    const lastName = doctor?.userId?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const initials = getInitials(firstName, lastName);
    const avatarColor = getAvatarColor(fullName || doctorId);
    const specializations = Array.isArray(doctor?.specialization)
        ? doctor.specialization.join(', ')
        : doctor?.specialization || 'General Practitioner';
    const fee = Number(amount) || 0;
    const tax = 0;
    const total = fee + tax;

    const typeLabel = type === 'video' ? 'Video Call' : 'Chat';
    const typeIcon = type === 'video' ? 'video' : 'chat';

    const handleConfirm = async () => {
        setProcessing(true);
        try {
            // Step 1: Create appointment
            const createRes = await appointmentApi.createAppointment({
                doctorId,
                date,
                startTime,
                endTime,
                type,
                reason,
                symptoms: [],
            });

            const appointment = createRes.data || createRes;
            const appointmentId = appointment._id;

            if (!appointmentId) {
                throw new Error('Failed to create appointment. No ID returned.');
            }

            // Step 2: Confirm appointment (mark payment as completed)
            await appointmentApi.confirmAppointment(appointmentId);

            // Navigate to confirmation screen
            navigation.navigate('AppointmentConfirmationScreen', {
                appointment,
                doctor,
            });
        } catch (err: any) {
            console.log('Payment/booking error:', err);
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to book appointment. Please try again.';
            Alert.alert('Booking Failed', message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    disabled={processing}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.payment')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Appointment Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>{t('patient.appointmentSummary')}</Text>
                    <View style={styles.summaryDivider} />

                    <View style={styles.doctorRow}>
                        <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View style={styles.doctorInfo}>
                            <Text style={styles.doctorName}>Dr. {fullName}</Text>
                            <Text style={styles.doctorSpec}>{specializations}</Text>
                        </View>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.detailItem}>
                        <View style={styles.detailIcon}>
                            <MaterialCommunityIcons name="calendar" size={16} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>{t('common.date')}</Text>
                            <Text style={styles.detailValue}>{formatDisplayDate(date)}</Text>
                        </View>
                    </View>

                    <View style={styles.detailItem}>
                        <View style={styles.detailIcon}>
                            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>{t('common.time')}</Text>
                            <Text style={styles.detailValue}>{startTime} – {endTime}</Text>
                        </View>
                    </View>

                    <View style={styles.detailItem}>
                        <View style={styles.detailIcon}>
                            <MaterialCommunityIcons name={typeIcon as any} size={16} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>{t('patient.consultationType')}</Text>
                            <Text style={styles.detailValue}>{typeLabel}</Text>
                        </View>
                    </View>

                    {reason ? (
                        <View style={styles.detailItem}>
                            <View style={styles.detailIcon}>
                                <MaterialCommunityIcons name="note-text-outline" size={16} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Reason</Text>
                                <Text style={styles.detailValue} numberOfLines={2}>{reason}</Text>
                            </View>
                        </View>
                    ) : null}
                </View>

                {/* Payment Method */}
                <Text style={styles.sectionTitle}>{t('patient.paymentMethod')}</Text>
                <View style={styles.paymentMethodCard}>
                    <View style={styles.paymentMethodIcon}>
                        <MaterialCommunityIcons name="cash" size={28} color={colors.success} />
                    </View>
                    <View style={styles.paymentMethodInfo}>
                        <Text style={styles.paymentMethodName}>{t('patient.cashOnConsultation')}</Text>
                        <Text style={styles.paymentMethodDesc}>
                            Pay in cash at the time of your consultation
                        </Text>
                    </View>
                    <MaterialCommunityIcons name="check-circle" size={22} color={colors.success} />
                </View>

                {/* Order Summary */}
                <Text style={styles.sectionTitle}>{t('patient.orderSummary')}</Text>
                <View style={styles.orderSummaryCard}>
                    <View style={styles.orderRow}>
                        <Text style={styles.orderLabel}>{t('patient.consultationFee')}</Text>
                        <Text style={styles.orderValue}>LKR {fee.toLocaleString()}</Text>
                    </View>
                    <View style={styles.orderRow}>
                        <Text style={styles.orderLabel}>{t('patient.tax')}</Text>
                        <Text style={styles.orderValue}>LKR 0.00</Text>
                    </View>
                    <View style={styles.orderDivider} />
                    <View style={styles.orderRow}>
                        <Text style={styles.totalLabel}>{t('patient.totalAmount')}</Text>
                        <Text style={styles.totalValue}>LKR {total.toLocaleString()}</Text>
                    </View>
                </View>

                <View style={styles.noteBox}>
                    <MaterialCommunityIcons name="information-outline" size={16} color={colors.info} />
                    <Text style={styles.noteText}>
                        Your appointment will be confirmed once you tap "Confirm &amp; Book". Payment is collected at the time of consultation.
                    </Text>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Confirm Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.confirmBtn, processing && styles.confirmBtnDisabled]}
                    activeOpacity={0.85}
                    onPress={handleConfirm}
                    disabled={processing}
                >
                    {processing ? (
                        <>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.confirmBtnText}>Processing...</Text>
                        </>
                    ) : (
                        <>
                            <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                            <Text style={styles.confirmBtnText}>Confirm &amp; Book Appointment</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
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
    headerTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
    },
    summaryCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xl,
    },
    summaryTitle: {
        ...typography.body,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.md,
    },
    doctorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        ...typography.body,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    doctorSpec: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    detailIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: 1,
    },
    detailValue: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    sectionTitle: {
        ...typography.body,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    paymentMethodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1.5,
        borderColor: colors.success,
        marginBottom: spacing.xl,
        gap: spacing.md,
    },
    paymentMethodIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentMethodInfo: {
        flex: 1,
    },
    paymentMethodName: {
        ...typography.body,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    paymentMethodDesc: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    orderSummaryCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.lg,
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    orderLabel: {
        ...typography.body,
        color: colors.textSecondary,
    },
    orderValue: {
        ...typography.body,
        color: colors.textPrimary,
    },
    orderDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: spacing.md,
    },
    totalLabel: {
        ...typography.body,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    totalValue: {
        ...typography.h3,
        color: colors.primary,
        fontWeight: '700',
    },
    noteBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        backgroundColor: '#EBF5FF',
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    noteText: {
        ...typography.caption,
        color: colors.info,
        flex: 1,
        lineHeight: 18,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        paddingBottom: spacing.xl,
    },
    confirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        gap: spacing.sm,
    },
    confirmBtnDisabled: {
        backgroundColor: colors.textDisabled,
    },
    confirmBtnText: {
        ...typography.button,
        color: '#fff',
        textTransform: 'none',
        fontSize: 15,
    },
});

export default PaymentScreen;
