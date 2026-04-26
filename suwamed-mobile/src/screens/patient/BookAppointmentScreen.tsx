import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { getDoctorAvailability } from '../../api/doctor.api';

interface TimeSlot {
    startTime: string;
    endTime: string;
}

const generateSlots = (
    availability: Array<{ startTime: string; endTime: string; slotDuration: number }>,
    bookedSlots: Array<{ startTime: string; endTime: string }>
): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const bookedSet = new Set(bookedSlots.map((b) => b.startTime));

    for (const period of availability) {
        const { slotDuration } = period;
        const [startH, startM] = period.startTime.split(':').map(Number);
        const [endH, endM] = period.endTime.split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        for (let t = startMins; t + slotDuration <= endMins; t += slotDuration) {
            const sH = Math.floor(t / 60);
            const sM = t % 60;
            const slotStart = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`;
            if (!bookedSet.has(slotStart)) {
                const eT = t + slotDuration;
                const eH = Math.floor(eT / 60);
                const eM = eT % 60;
                const slotEnd = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;
                slots.push({ startTime: slotStart, endTime: slotEnd });
            }
        }
    }

    return slots;
};

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

const getDatesArray = (): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d);
    }
    return dates;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BookAppointmentScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { doctorId, doctor } = route.params || {};

    const [consultationType, setConsultationType] = useState<'video' | 'chat'>('video');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [reason, setReason] = useState('');
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    const dates = useMemo(() => getDatesArray(), []);

    const fetchSlots = useCallback(async (date: Date) => {
        if (!doctorId) return;
        setSlotsLoading(true);
        setAvailableSlots([]);
        setSelectedSlot(null);
        try {
            const dateStr = date.toISOString().split('T')[0];
            const res = await getDoctorAvailability(doctorId, dateStr);
            const slots = generateSlots(
                res.data?.availability || [],
                res.data?.bookedSlots || []
            );
            setAvailableSlots(slots);
        } catch {
            setAvailableSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    }, [doctorId]);

    useEffect(() => {
        if (selectedDate) {
            fetchSlots(selectedDate);
        }
    }, [selectedDate, fetchSlots]);

    const firstName = doctor?.userId?.firstName || '';
    const lastName = doctor?.userId?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const initials = getInitials(firstName, lastName);
    const avatarColor = getAvatarColor(fullName || doctorId);
    const specializations = Array.isArray(doctor?.specialization)
        ? doctor.specialization.join(', ')
        : doctor?.specialization || 'General Practitioner';
    const fee = doctor?.consultationFee || 0;

    const handleProceed = () => {
        if (!selectedDate) {
            Alert.alert(t('patient.missingInformation'), t('patient.pleaseSelectDate'));
            return;
        }
        if (!selectedSlot) {
            Alert.alert(t('patient.missingInformation'), t('patient.pleaseSelectTimeSlot'));
            return;
        }
        if (!reason.trim()) {
            Alert.alert(t('patient.missingInformation'), t('patient.pleaseEnterReason'));
            return;
        }

        navigation.navigate('PaymentScreen', {
            doctorId,
            doctor,
            date: selectedDate.toISOString().split('T')[0],
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            type: consultationType,
            reason: reason.trim(),
            amount: fee,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.bookAppointment')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Doctor Mini Card */}
                <View style={styles.doctorCard}>
                    <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.doctorInfo}>
                        <Text style={styles.doctorName}>Dr. {fullName}</Text>
                        <Text style={styles.doctorSpec}>{specializations}</Text>
                    </View>
                    <View style={styles.feeTag}>
                        <Text style={styles.feeLabel}>{t('patient.fee')}</Text>
                        <Text style={styles.feeAmount}>LKR {fee.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Step 1: Consultation Type */}
                <View style={styles.stepSection}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepNumber}>1</Text>
                        </View>
                        <Text style={styles.stepTitle}>{t('patient.selectConsultationType')}</Text>
                    </View>
                    <View style={styles.typeToggleRow}>
                        <TouchableOpacity
                            style={[
                                styles.typeBtn,
                                consultationType === 'video' && styles.typeBtnActive,
                            ]}
                            activeOpacity={0.8}
                            onPress={() => setConsultationType('video')}
                        >
                            <MaterialCommunityIcons
                                name="video"
                                size={22}
                                color={consultationType === 'video' ? '#fff' : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.typeBtnText,
                                    consultationType === 'video' && styles.typeBtnTextActive,
                                ]}
                            >
                                {t('patient.videoCall')}
                            </Text>
                            {consultationType === 'video' && (
                                <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.typeBtn,
                                consultationType === 'chat' && styles.typeBtnActive,
                            ]}
                            activeOpacity={0.8}
                            onPress={() => setConsultationType('chat')}
                        >
                            <MaterialCommunityIcons
                                name="chat"
                                size={22}
                                color={consultationType === 'chat' ? '#fff' : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.typeBtnText,
                                    consultationType === 'chat' && styles.typeBtnTextActive,
                                ]}
                            >
                                {t('patient.chat')}
                            </Text>
                            {consultationType === 'chat' && (
                                <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Step 2: Select Date */}
                <View style={styles.stepSection}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepNumber}>2</Text>
                        </View>
                        <Text style={styles.stepTitle}>{t('patient.selectDate')}</Text>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dateScroll}
                    >
                        {dates.map((date, i) => {
                            const isSelected =
                                selectedDate?.toDateString() === date.toDateString();
                            const isToday = i === 0;
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.dateChip,
                                        isSelected && styles.dateChipActive,
                                    ]}
                                    activeOpacity={0.75}
                                    onPress={() => setSelectedDate(date)}
                                >
                                    <Text
                                        style={[
                                            styles.dateDayName,
                                            isSelected && styles.dateDayNameActive,
                                        ]}
                                    >
                                        {isToday ? t('common.today') : DAY_NAMES[date.getDay()]}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.dateNumber,
                                            isSelected && styles.dateNumberActive,
                                        ]}
                                    >
                                        {date.getDate()}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.dateMonth,
                                            isSelected && styles.dateMonthActive,
                                        ]}
                                    >
                                        {MONTH_NAMES[date.getMonth()]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Step 3: Select Time Slot */}
                <View style={styles.stepSection}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepNumber}>3</Text>
                        </View>
                        <Text style={styles.stepTitle}>{t('patient.selectTimeSlot')}</Text>
                    </View>
                    {!selectedDate ? (
                        <Text style={styles.slotsHint}>{t('doctor.selectDateToSeeSlots')}</Text>
                    ) : slotsLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.lg }} />
                    ) : availableSlots.length === 0 ? (
                        <Text style={styles.slotsHint}>{t('doctor.noAvailableSlots')}</Text>
                    ) : (
                        <View style={styles.slotsGrid}>
                            {availableSlots.map((slot) => {
                                const isSelected = selectedSlot?.startTime === slot.startTime;
                                return (
                                    <TouchableOpacity
                                        key={slot.startTime}
                                        style={[styles.slotChip, isSelected && styles.slotChipActive]}
                                        activeOpacity={0.75}
                                        onPress={() => setSelectedSlot(slot)}
                                    >
                                        <MaterialCommunityIcons
                                            name="clock-outline"
                                            size={13}
                                            color={isSelected ? '#fff' : colors.textSecondary}
                                        />
                                        <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>
                                            {slot.startTime}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Step 4: Reason */}
                <View style={styles.stepSection}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepNumber}>4</Text>
                        </View>
                        <Text style={styles.stepTitle}>{t('patient.reasonForVisit')}</Text>
                    </View>
                    <TextInput
                        style={styles.reasonInput}
                        placeholder={t('patient.describeSymptomsOrReason')}
                        placeholderTextColor={colors.textDisabled}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={reason}
                        onChangeText={setReason}
                        maxLength={500}
                    />
                    <Text style={styles.charCount}>{reason.length}/500</Text>
                </View>

                <View style={{ height: spacing.xl }} />
            </ScrollView>

            {/* Proceed Button */}
            <View style={styles.bottomBar}>
                <View style={styles.feeRow}>
                    <Text style={styles.feeRowLabel}>{t('patient.consultationFee')}</Text>
                    <Text style={styles.feeRowAmount}>LKR {fee.toLocaleString()}</Text>
                </View>
                <TouchableOpacity
                    style={styles.proceedBtn}
                    activeOpacity={0.85}
                    onPress={handleProceed}
                >
                    <Text style={styles.proceedBtnText}>{t('patient.proceedToPayment')}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
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
        paddingBottom: 160,
    },
    doctorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xl,
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
    feeTag: {
        alignItems: 'flex-end',
    },
    feeLabel: {
        ...typography.caption,
        color: colors.textDisabled,
    },
    feeAmount: {
        ...typography.body,
        fontWeight: '700',
        color: colors.success,
    },
    stepSection: {
        marginBottom: spacing.xl,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    stepBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumber: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    stepTitle: {
        ...typography.body,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    typeToggleRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    typeBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    typeBtnText: {
        ...typography.body,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    typeBtnTextActive: {
        color: '#fff',
    },
    dateScroll: {
        gap: spacing.sm,
        paddingRight: spacing.sm,
    },
    dateChip: {
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
        minWidth: 64,
    },
    dateChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    dateDayName: {
        ...typography.caption,
        fontWeight: '500',
        color: colors.textSecondary,
        marginBottom: 2,
    },
    dateDayNameActive: {
        color: 'rgba(255,255,255,0.8)',
    },
    dateNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    dateNumberActive: {
        color: '#fff',
    },
    dateMonth: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    dateMonthActive: {
        color: 'rgba(255,255,255,0.8)',
    },
    slotsHint: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingVertical: spacing.lg,
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    slotChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    slotChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    slotText: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    slotTextActive: {
        color: '#fff',
    },
    reasonInput: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        ...typography.body,
        color: colors.textPrimary,
        minHeight: 100,
    },
    charCount: {
        ...typography.caption,
        color: colors.textDisabled,
        textAlign: 'right',
        marginTop: spacing.xs,
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
        paddingTop: spacing.md,
        paddingBottom: spacing.xl,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    feeRowLabel: {
        ...typography.body,
        color: colors.textSecondary,
    },
    feeRowAmount: {
        ...typography.body,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    proceedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        gap: spacing.sm,
    },
    proceedBtnText: {
        ...typography.button,
        color: '#fff',
        textTransform: 'none',
        fontSize: 16,
    },
});

export default BookAppointmentScreen;
