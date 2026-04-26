import React from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, typography } from '../../config/theme';

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

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const AppointmentConfirmationScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { t } = useTranslation();
    const { appointment, doctor } = route.params || {};

    // Extract data from appointment and doctor objects
    const doctorData = doctor || appointment?.doctorId;
    const firstName = doctorData?.userId?.firstName || '';
    const lastName = doctorData?.userId?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const initials = getInitials(firstName, lastName);
    const avatarColor = getAvatarColor(fullName || 'Doctor');
    const specializations = Array.isArray(doctorData?.specialization)
        ? doctorData.specialization.join(', ')
        : doctorData?.specialization || 'General Practitioner';

    const apptDate = appointment?.date || '';
    const startTime = appointment?.startTime || '';
    const endTime = appointment?.endTime || '';
    const apptType = appointment?.type || 'video';
    const fee = doctorData?.consultationFee || appointment?.consultationFee || 0;
    const apptId = appointment?._id || '';

    const typeLabel = apptType === 'video' ? 'Video Call' : 'Chat';
    const typeIcon = apptType === 'video' ? 'video' : 'chat';

    const handleViewAppointments = () => {
        navigation.reset({
            index: 0,
            routes: [
                {
                    name: 'PatientTabs',
                    state: {
                        routes: [{ name: 'Appointments' }],
                        index: 1,
                    },
                },
            ],
        });
    };

    const handleGoHome = () => {
        navigation.reset({
            index: 0,
            routes: [
                {
                    name: 'PatientTabs',
                    state: {
                        routes: [{ name: 'Home' }],
                        index: 0,
                    },
                },
            ],
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Success Icon */}
                <View style={styles.successSection}>
                    <View style={styles.checkCircleOuter}>
                        <View style={styles.checkCircleInner}>
                            <MaterialCommunityIcons name="check" size={52} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.successTitle}>{t('patient.appointmentConfirmed')}</Text>
                    <Text style={styles.successSubtitle}>
                        Your appointment has been successfully booked. You will receive a confirmation shortly.
                    </Text>
                    {apptId ? (
                        <View style={styles.apptIdBadge}>
                            <Text style={styles.apptIdLabel}>{t('patient.bookingId')}</Text>
                            <Text style={styles.apptIdValue}>#{apptId.slice(-8).toUpperCase()}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Appointment Details Card */}
                <View style={styles.detailsCard}>
                    <Text style={styles.cardTitle}>{t('patient.appointmentDetails')}</Text>
                    <View style={styles.cardDivider} />

                    {/* Doctor Info */}
                    <View style={styles.doctorRow}>
                        <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View style={styles.doctorInfo}>
                            <Text style={styles.doctorName}>Dr. {fullName}</Text>
                            <Text style={styles.doctorSpec}>{specializations}</Text>
                        </View>
                    </View>

                    <View style={styles.cardDivider} />

                    {/* Detail Items */}
                    <View style={styles.detailItem}>
                        <View style={[styles.detailIcon, { backgroundColor: '#EBF5FF' }]}>
                            <MaterialCommunityIcons name="calendar-check" size={18} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>{t('common.date')}</Text>
                            <Text style={styles.detailValue}>{formatDisplayDate(apptDate)}</Text>
                        </View>
                    </View>

                    <View style={styles.detailItem}>
                        <View style={[styles.detailIcon, { backgroundColor: '#ECFDF5' }]}>
                            <MaterialCommunityIcons name="clock-check-outline" size={18} color={colors.success} />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>{t('common.time')}</Text>
                            <Text style={styles.detailValue}>
                                {startTime}{endTime ? ` – ${endTime}` : ''}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailItem}>
                        <View style={[styles.detailIcon, { backgroundColor: '#F5F3FF' }]}>
                            <MaterialCommunityIcons name={typeIcon as any} size={18} color="#8B5CF6" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>{t('patient.consultationType')}</Text>
                            <Text style={styles.detailValue}>{typeLabel}</Text>
                        </View>
                    </View>

                    <View style={styles.detailItem}>
                        <View style={[styles.detailIcon, { backgroundColor: '#FFF7ED' }]}>
                            <MaterialCommunityIcons name="cash" size={18} color={colors.accent} />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>{t('patient.consultationFee')}</Text>
                            <Text style={styles.detailValue}>LKR {fee.toLocaleString()}</Text>
                        </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.paymentNoteRow}>
                        <MaterialCommunityIcons name="information-outline" size={15} color={colors.secondary} />
                        <Text style={styles.paymentNoteText}>
                            Payment is due at the time of your consultation (Cash on Consultation).
                        </Text>
                    </View>
                </View>

                {/* What's Next */}
                <View style={styles.nextCard}>
                    <Text style={styles.cardTitle}>What's Next?</Text>
                    <View style={styles.nextItem}>
                        <View style={styles.nextNumber}>
                            <Text style={styles.nextNumberText}>1</Text>
                        </View>
                        <Text style={styles.nextText}>
                            Wait for the doctor to review and confirm your appointment request.
                        </Text>
                    </View>
                    <View style={styles.nextItem}>
                        <View style={styles.nextNumber}>
                            <Text style={styles.nextNumberText}>2</Text>
                        </View>
                        <Text style={styles.nextText}>
                            You will receive a notification when your appointment is confirmed.
                        </Text>
                    </View>
                    <View style={styles.nextItem}>
                        <View style={styles.nextNumber}>
                            <Text style={styles.nextNumberText}>3</Text>
                        </View>
                        <Text style={styles.nextText}>
                            Join the {typeLabel.toLowerCase()} at the scheduled time from My Appointments.
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                    style={styles.viewApptsBtn}
                    activeOpacity={0.85}
                    onPress={handleViewAppointments}
                >
                    <MaterialCommunityIcons name="calendar-clock" size={20} color="#fff" />
                    <Text style={styles.viewApptsBtnText}>View My Appointments</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.homeBtn}
                    activeOpacity={0.85}
                    onPress={handleGoHome}
                >
                    <MaterialCommunityIcons name="home" size={20} color={colors.primary} />
                    <Text style={styles.homeBtnText}>{t('patient.backToHome')}</Text>
                </TouchableOpacity>

                <View style={{ height: spacing.xxxl }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xxxl,
        paddingBottom: spacing.xl,
    },
    successSection: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    checkCircleOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    checkCircleInner: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successTitle: {
        ...typography.h1,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    successSubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
    },
    apptIdBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: '#EBF5FF',
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    apptIdLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    apptIdValue: {
        ...typography.bodySmall,
        fontWeight: '700',
        color: colors.primary,
        fontFamily: 'monospace',
    },
    detailsCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xl,
    },
    cardTitle: {
        ...typography.body,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    cardDivider: {
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
        width: 36,
        height: 36,
        borderRadius: 10,
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
    paymentNoteRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
    },
    paymentNoteText: {
        ...typography.caption,
        color: colors.secondary,
        flex: 1,
        lineHeight: 18,
        fontWeight: '500',
    },
    nextCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xl,
    },
    nextItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        marginTop: spacing.md,
    },
    nextNumber: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    nextNumberText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
    },
    nextText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        flex: 1,
        lineHeight: 20,
    },
    viewApptsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    viewApptsBtnText: {
        ...typography.button,
        color: '#fff',
        textTransform: 'none',
        fontSize: 16,
    },
    homeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        borderWidth: 1.5,
        borderColor: colors.primary,
        gap: spacing.sm,
    },
    homeBtnText: {
        ...typography.button,
        color: colors.primary,
        textTransform: 'none',
        fontSize: 16,
    },
});

export default AppointmentConfirmationScreen;
