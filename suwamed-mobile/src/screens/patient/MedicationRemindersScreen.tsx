import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    Switch,
    ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography } from '../../config/theme';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'suwamed_medication_reminders';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Reminder {
    id: string;
    medicationName: string;
    time: string;
    days: string[];
    notes: string;
    enabled: boolean;
}

const MedicationRemindersScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [medName, setMedName] = useState('');
    const [time, setTime] = useState('');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadReminders();
    }, []);

    const loadReminders = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) setReminders(JSON.parse(stored));
        } catch (err) {
            console.log('Load reminders error:', err);
        }
    };

    const saveReminders = async (data: Reminder[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            setReminders(data);
        } catch (err) {
            console.log('Save reminders error:', err);
        }
    };

    const resetForm = () => {
        setMedName('');
        setTime('');
        setSelectedDays([]);
        setNotes('');
    };

    const handleAdd = async () => {
        if (!medName.trim()) {
            Alert.alert('Validation', 'Please enter a medication name.');
            return;
        }
        if (!time.trim()) {
            Alert.alert('Validation', 'Please enter a time (HH:MM).');
            return;
        }
        if (selectedDays.length === 0) {
            Alert.alert('Validation', 'Please select at least one day.');
            return;
        }

        const newReminder: Reminder = {
            id: Date.now().toString(),
            medicationName: medName.trim(),
            time: time.trim(),
            days: selectedDays,
            notes: notes.trim(),
            enabled: true,
        };

        const updated = [...reminders, newReminder];
        await saveReminders(updated);
        resetForm();
        setShowForm(false);
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Reminder', 'Are you sure you want to delete this reminder?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const updated = reminders.filter((r) => r.id !== id);
                    await saveReminders(updated);
                },
            },
        ]);
    };

    const handleToggle = async (id: string) => {
        const updated = reminders.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
        );
        await saveReminders(updated);
    };

    const toggleDay = (day: string) => {
        setSelectedDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const renderReminder = ({ item }: { item: Reminder }) => (
        <View style={[styles.reminderCard, !item.enabled && styles.reminderDisabled]}>
            <View style={styles.reminderTop}>
                <View style={styles.reminderIcon}>
                    <MaterialCommunityIcons name="pill" size={22} color={item.enabled ? colors.primary : colors.textDisabled} />
                </View>
                <View style={styles.reminderInfo}>
                    <Text style={[styles.reminderName, !item.enabled && styles.disabledText]}>
                        {item.medicationName}
                    </Text>
                    <View style={styles.reminderMeta}>
                        <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textSecondary} />
                        <Text style={styles.reminderTime}>{item.time}</Text>
                        <Text style={styles.reminderDays}> · {item.days.join(', ')}</Text>
                    </View>
                    {item.notes ? (
                        <Text style={styles.reminderNotes}>{item.notes}</Text>
                    ) : null}
                </View>
                <View style={styles.reminderActions}>
                    <Switch
                        value={item.enabled}
                        onValueChange={() => handleToggle(item.id)}
                        trackColor={{ false: colors.border, true: colors.primary + '60' }}
                        thumbColor={item.enabled ? colors.primary : '#f4f3f4'}
                    />
                    <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        style={styles.deleteBtn}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.medicationReminders')}</Text>
                <TouchableOpacity
                    onPress={() => { resetForm(); setShowForm(!showForm); }}
                    style={styles.addBtn}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name={showForm ? 'close' : 'plus'} size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Info Banner */}
            <View style={styles.infoBanner}>
                <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} />
                <Text style={styles.infoBannerText}>Set reminders for your medications to stay on track</Text>
            </View>

            {/* Add Reminder Form */}
            {showForm && (
                <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>{t('patient.newReminder')}</Text>

                        <Text style={styles.formLabel}>{t('patient.medicationName')}</Text>
                        <TextInput
                            style={styles.formInput}
                            value={medName}
                            onChangeText={setMedName}
                            placeholder="e.g. Paracetamol 500mg"
                            placeholderTextColor={colors.textDisabled}
                        />

                        <Text style={styles.formLabel}>Time (HH:MM)</Text>
                        <TextInput
                            style={styles.formInput}
                            value={time}
                            onChangeText={setTime}
                            placeholder="e.g. 08:00"
                            placeholderTextColor={colors.textDisabled}
                            keyboardType="numbers-and-punctuation"
                        />

                        <Text style={styles.formLabel}>Days</Text>
                        <View style={styles.daysRow}>
                            {DAYS.map((day) => (
                                <TouchableOpacity
                                    key={day}
                                    style={[styles.dayChip, selectedDays.includes(day) && styles.dayChipActive]}
                                    onPress={() => toggleDay(day)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.dayChipText, selectedDays.includes(day) && styles.dayChipTextActive]}>
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.formLabel}>Notes (optional)</Text>
                        <TextInput
                            style={[styles.formInput, styles.notesInput]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="e.g. Take after meals"
                            placeholderTextColor={colors.textDisabled}
                            multiline
                        />

                        <View style={styles.formBtns}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => { resetForm(); setShowForm(false); }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd} activeOpacity={0.8}>
                                <Text style={styles.submitBtnText}>{t('patient.addReminder')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            )}

            {!showForm && (
                <FlatList
                    data={reminders}
                    keyExtractor={(item) => item.id}
                    renderItem={renderReminder}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="pill" size={56} color={colors.textDisabled} />
                            <Text style={styles.emptyTitle}>{t('patient.noRemindersSet')}</Text>
                            <Text style={styles.emptySubtitle}>Tap the + button to add a medication reminder</Text>
                            <TouchableOpacity
                                style={styles.addFirstBtn}
                                onPress={() => setShowForm(true)}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                                <Text style={styles.addFirstBtnText}>{t('patient.addReminder')}</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
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
    addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF5FF',
        marginHorizontal: spacing.xl,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    infoBannerText: { ...typography.bodySmall, color: colors.primary, flex: 1 },
    formScroll: { flex: 1 },
    formCard: {
        backgroundColor: colors.surface,
        marginHorizontal: spacing.xl,
        marginTop: spacing.md,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xl,
    },
    formTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.lg },
    formLabel: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    formInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        ...typography.body,
        color: colors.textPrimary,
        backgroundColor: colors.background,
    },
    notesInput: { minHeight: 70, textAlignVertical: 'top' },
    daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    dayChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    dayChipText: { ...typography.caption, color: colors.textPrimary, fontWeight: '500' },
    dayChipTextActive: { color: '#fff', fontWeight: '700' },
    formBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
    cancelBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    cancelBtnText: { ...typography.body, fontWeight: '600', color: colors.textSecondary },
    submitBtn: {
        flex: 2,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    listContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 100 },
    reminderCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    reminderDisabled: { opacity: 0.6 },
    reminderTop: { flexDirection: 'row', alignItems: 'flex-start' },
    reminderIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    reminderInfo: { flex: 1 },
    reminderName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    disabledText: { color: colors.textDisabled },
    reminderMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: 3 },
    reminderTime: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    reminderDays: { ...typography.caption, color: colors.textSecondary },
    reminderNotes: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, fontStyle: 'italic' },
    reminderActions: { alignItems: 'center', gap: spacing.sm },
    deleteBtn: { padding: spacing.xs },
    emptyState: { alignItems: 'center', paddingTop: spacing.xxxl * 2 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
    emptySubtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
    addFirstBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        marginTop: spacing.xl,
        gap: spacing.sm,
    },
    addFirstBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default MedicationRemindersScreen;
