import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import * as doctorApi from '../../api/doctor.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface DayAvailability {
    day: number;
    isAvailable: boolean;
    startTime: string;
    endTime: string;
    slotDuration: number;
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLOT_DURATIONS = [15, 30, 60];

const defaultSchedule = (): DayAvailability[] =>
    [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        isAvailable: day >= 1 && day <= 5,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
    }));

const SetAvailabilityScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [schedule, setSchedule] = useState<DayAvailability[]>(defaultSchedule());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Blocked slots state
    type BlockedSlot = { date: string; startTime: string; endTime: string; reason?: string };
    const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
    const [bsDate, setBsDate] = useState('');
    const [bsStart, setBsStart] = useState('');
    const [bsEnd, setBsEnd] = useState('');
    const [bsReason, setBsReason] = useState('');
    const [bsAdding, setBsAdding] = useState(false);

    const fetchBlockedSlots = async () => {
        try {
            const res = await doctorApi.getBlockedSlots();
            setBlockedSlots(res.data || []);
        } catch (err) {
            console.log('Blocked slots fetch error:', err);
        }
    };

    const fetchAvailability = async () => {
        try {
            const res = await doctorApi.getDoctorProfile();
            const profile = res.data;
            const availability: any[] = profile?.availability || [];
            if (availability.length > 0) {
                const merged = defaultSchedule().map((def) => {
                    const existing = availability.find((a: any) => a.day === def.day);
                    if (existing) {
                        return {
                            day: def.day,
                            isAvailable: existing.isAvailable !== undefined ? existing.isAvailable : true,
                            startTime: existing.startTime || def.startTime,
                            endTime: existing.endTime || def.endTime,
                            slotDuration: existing.slotDuration || def.slotDuration,
                        };
                    }
                    return def;
                });
                setSchedule(merged);
            }
        } catch (err) {
            console.log('Availability fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => {
        fetchAvailability();
        fetchBlockedSlots();
    }, []));

    const handleAddBlockedSlot = async () => {
        const dateRe = /^\d{4}-\d{2}-\d{2}$/;
        const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
        if (!dateRe.test(bsDate)) {
            Alert.alert(t('common.error') || 'Error', 'Date must be YYYY-MM-DD');
            return;
        }
        if (!timeRe.test(bsStart) || !timeRe.test(bsEnd)) {
            Alert.alert(t('common.error') || 'Error', 'Times must be HH:MM (24h)');
            return;
        }
        if (bsStart >= bsEnd) {
            Alert.alert(t('common.error') || 'Error', 'End time must be after start time');
            return;
        }
        setBsAdding(true);
        try {
            const res = await doctorApi.addBlockedSlot({
                date: bsDate,
                startTime: bsStart,
                endTime: bsEnd,
                reason: bsReason.trim() || undefined,
            });
            setBlockedSlots(res.data || []);
            setBsDate(''); setBsStart(''); setBsEnd(''); setBsReason('');
        } catch (err: any) {
            Alert.alert(t('common.error') || 'Error', err?.response?.data?.message || 'Failed to add blocked slot');
        } finally {
            setBsAdding(false);
        }
    };

    const handleRemoveBlockedSlot = (index: number) => {
        Alert.alert(
            'Remove Blocked Slot',
            'Are you sure you want to unblock this time?',
            [
                { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await doctorApi.removeBlockedSlot(index);
                            setBlockedSlots(res.data || []);
                        } catch (err: any) {
                            Alert.alert(t('common.error') || 'Error', err?.response?.data?.message || 'Failed to remove blocked slot');
                        }
                    },
                },
            ]
        );
    };

    const updateDay = (day: number, field: keyof DayAvailability, value: any) => {
        setSchedule((prev) =>
            prev.map((d) => (d.day === day ? { ...d, [field]: value } : d))
        );
    };

    const handleSave = async () => {
        // Validate time format HH:MM
        for (const day of schedule) {
            if (day.isAvailable) {
                const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
                if (!timeRegex.test(day.startTime)) {
                    Alert.alert('Invalid Time', `Invalid start time for ${DAY_LABELS[day.day]}. Use HH:MM format.`);
                    return;
                }
                if (!timeRegex.test(day.endTime)) {
                    Alert.alert('Invalid Time', `Invalid end time for ${DAY_LABELS[day.day]}. Use HH:MM format.`);
                    return;
                }
                if (day.startTime >= day.endTime) {
                    Alert.alert('Invalid Time', `End time must be after start time for ${DAY_LABELS[day.day]}.`);
                    return;
                }
            }
        }

        setSaving(true);
        try {
            await doctorApi.setAvailability({ availability: schedule });
            Alert.alert('Success', 'Availability schedule saved successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (err) {
            Alert.alert('Error', 'Failed to save availability. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.heading}>{t('doctor.setAvailability')}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.heading}>{t('doctor.setAvailability')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.infoCard}>
                    <MaterialCommunityIcons name="information" size={18} color={colors.primary} />
                    <Text style={styles.infoText}>
                        Set your weekly schedule. Patients can only book appointments during your available hours.
                    </Text>
                </View>

                {schedule.map((day) => (
                    <View key={day.day} style={[styles.dayCard, !day.isAvailable && styles.dayCardDisabled]}>
                        <View style={styles.dayHeader}>
                            <View style={styles.dayLabelWrap}>
                                <Text style={[styles.dayShort, { color: day.isAvailable ? colors.primary : colors.textDisabled }]}>
                                    {DAY_SHORT[day.day]}
                                </Text>
                                <Text style={[styles.dayLabel, { color: day.isAvailable ? colors.textPrimary : colors.textDisabled }]}>
                                    {DAY_LABELS[day.day]}
                                </Text>
                            </View>
                            <Switch
                                value={day.isAvailable}
                                onValueChange={(val) => updateDay(day.day, 'isAvailable', val)}
                                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                                thumbColor={day.isAvailable ? colors.primary : '#9CA3AF'}
                            />
                        </View>

                        {day.isAvailable && (
                            <View style={styles.dayBody}>
                                <View style={styles.timeRow}>
                                    <View style={styles.timeField}>
                                        <Text style={styles.fieldLabel}>{t('doctor.startTime')}</Text>
                                        <View style={styles.timeInputWrap}>
                                            <MaterialCommunityIcons name="clock-start" size={16} color={colors.primary} />
                                            <TextInput
                                                style={styles.timeInput}
                                                value={day.startTime}
                                                onChangeText={(val) => updateDay(day.day, 'startTime', val)}
                                                placeholder="09:00"
                                                placeholderTextColor={colors.textDisabled}
                                                keyboardType="numbers-and-punctuation"
                                                maxLength={5}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.timeSeparator}>
                                        <Text style={styles.timeSepText}>to</Text>
                                    </View>
                                    <View style={styles.timeField}>
                                        <Text style={styles.fieldLabel}>{t('doctor.endTime')}</Text>
                                        <View style={styles.timeInputWrap}>
                                            <MaterialCommunityIcons name="clock-end" size={16} color={colors.primary} />
                                            <TextInput
                                                style={styles.timeInput}
                                                value={day.endTime}
                                                onChangeText={(val) => updateDay(day.day, 'endTime', val)}
                                                placeholder="17:00"
                                                placeholderTextColor={colors.textDisabled}
                                                keyboardType="numbers-and-punctuation"
                                                maxLength={5}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.slotSection}>
                                    <Text style={styles.fieldLabel}>{t('doctor.slotDuration')}</Text>
                                    <View style={styles.slotRow}>
                                        {SLOT_DURATIONS.map((dur) => (
                                            <TouchableOpacity
                                                key={dur}
                                                style={[
                                                    styles.slotChip,
                                                    day.slotDuration === dur && styles.slotChipActive,
                                                ]}
                                                onPress={() => updateDay(day.day, 'slotDuration', dur)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[
                                                    styles.slotChipText,
                                                    day.slotDuration === dur && styles.slotChipTextActive,
                                                ]}>
                                                    {dur} min
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                ))}

                {/* Blocked Slots */}
                <View style={styles.bsSection}>
                    <View style={styles.bsHeader}>
                        <MaterialCommunityIcons name="calendar-remove" size={18} color={colors.warning} />
                        <Text style={styles.bsTitle}>Blocked Time Off</Text>
                    </View>
                    <Text style={styles.bsHelp}>
                        Block specific dates/times when you are unavailable (vacation, conferences, personal). Patients cannot book during these.
                    </Text>

                    {blockedSlots.length === 0 ? (
                        <Text style={styles.bsEmpty}>No blocked slots.</Text>
                    ) : (
                        blockedSlots.map((slot, idx) => {
                            const dateLabel = new Date(slot.date).toISOString().slice(0, 10);
                            return (
                                <View key={`${dateLabel}-${slot.startTime}-${idx}`} style={styles.bsItem}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.bsItemDate}>{dateLabel}</Text>
                                        <Text style={styles.bsItemTime}>{slot.startTime} – {slot.endTime}</Text>
                                        {slot.reason ? <Text style={styles.bsItemReason}>{slot.reason}</Text> : null}
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleRemoveBlockedSlot(idx)}
                                        style={styles.bsRemoveBtn}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    )}

                    <View style={styles.bsForm}>
                        <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
                        <View style={styles.timeInputWrap}>
                            <MaterialCommunityIcons name="calendar" size={16} color={colors.primary} />
                            <TextInput
                                style={styles.timeInput}
                                value={bsDate}
                                onChangeText={setBsDate}
                                placeholder="2026-06-15"
                                placeholderTextColor={colors.textDisabled}
                                maxLength={10}
                            />
                        </View>

                        <View style={[styles.timeRow, { marginTop: spacing.md }]}>
                            <View style={styles.timeField}>
                                <Text style={styles.fieldLabel}>Start (HH:MM)</Text>
                                <View style={styles.timeInputWrap}>
                                    <MaterialCommunityIcons name="clock-start" size={16} color={colors.primary} />
                                    <TextInput
                                        style={styles.timeInput}
                                        value={bsStart}
                                        onChangeText={setBsStart}
                                        placeholder="09:00"
                                        placeholderTextColor={colors.textDisabled}
                                        keyboardType="numbers-and-punctuation"
                                        maxLength={5}
                                    />
                                </View>
                            </View>
                            <View style={styles.timeSeparator}><Text style={styles.timeSepText}>to</Text></View>
                            <View style={styles.timeField}>
                                <Text style={styles.fieldLabel}>End (HH:MM)</Text>
                                <View style={styles.timeInputWrap}>
                                    <MaterialCommunityIcons name="clock-end" size={16} color={colors.primary} />
                                    <TextInput
                                        style={styles.timeInput}
                                        value={bsEnd}
                                        onChangeText={setBsEnd}
                                        placeholder="17:00"
                                        placeholderTextColor={colors.textDisabled}
                                        keyboardType="numbers-and-punctuation"
                                        maxLength={5}
                                    />
                                </View>
                            </View>
                        </View>

                        <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Reason (optional)</Text>
                        <View style={styles.timeInputWrap}>
                            <MaterialCommunityIcons name="text-short" size={16} color={colors.primary} />
                            <TextInput
                                style={styles.timeInput}
                                value={bsReason}
                                onChangeText={setBsReason}
                                placeholder="Vacation, conference, etc."
                                placeholderTextColor={colors.textDisabled}
                                maxLength={120}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.bsAddBtn, bsAdding && styles.saveBtnDisabled]}
                            onPress={handleAddBlockedSlot}
                            disabled={bsAdding}
                            activeOpacity={0.8}
                        >
                            {bsAdding ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                                    <Text style={styles.saveBtnText}>Add Blocked Slot</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                            <Text style={styles.saveBtnText}>{t('doctor.saveSchedule')}</Text>
                        </>
                    )}
                </TouchableOpacity>
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
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.primaryLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    infoText: { ...typography.caption, color: colors.primary, flex: 1, lineHeight: 18 },
    dayCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dayCardDisabled: { opacity: 0.6 },
    dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dayLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    dayShort: { fontSize: 16, fontWeight: '700', width: 36 },
    dayLabel: { ...typography.body, fontWeight: '500' },
    dayBody: { marginTop: spacing.md },
    timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.md },
    timeField: { flex: 1 },
    timeSeparator: { paddingBottom: spacing.sm },
    timeSepText: { ...typography.bodySmall, color: colors.textSecondary },
    fieldLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.xs },
    timeInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    timeInput: {
        flex: 1,
        paddingVertical: spacing.sm,
        ...typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    slotSection: {},
    slotRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    slotChip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    slotChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    slotChipText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
    slotChipTextActive: { color: '#fff' },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    bsSection: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
    },
    bsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    bsTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
    bsHelp: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 18 },
    bsEmpty: { ...typography.caption, color: colors.textDisabled, fontStyle: 'italic', paddingVertical: spacing.md },
    bsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    bsItemDate: { ...typography.bodySmall, fontWeight: '700', color: colors.textPrimary },
    bsItemTime: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
    bsItemReason: { ...typography.caption, color: colors.textDisabled, marginTop: 1, fontStyle: 'italic' },
    bsRemoveBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.sm },
    bsForm: { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    bsAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.warning,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
        marginTop: spacing.md,
    },
});

export default SetAvailabilityScreen;
