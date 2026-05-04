import React, { useState } from 'react';
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
import client from '../../api/client';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

const emptyMedication = (): Medication => ({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
});

const WritePrescriptionScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation();
    const { t } = useTranslation();
    const route = useRoute<any>();
    const { appointment } = route.params;

    const patientUser = appointment?.patientId?.userId || appointment?.patientId;
    const patientName = patientUser
        ? `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim()
        : 'Patient';
    const appointmentDate = appointment?.date
        ? new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

    const [diagnosis, setDiagnosis] = useState('');
    const [medications, setMedications] = useState<Medication[]>([emptyMedication()]);
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpInstructions, setFollowUpInstructions] = useState('');
    const [loading, setLoading] = useState(false);

    const updateMedication = (index: number, field: keyof Medication, value: string) => {
        setMedications((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const addMedication = () => {
        setMedications((prev) => [...prev, emptyMedication()]);
    };

    const removeMedication = (index: number) => {
        if (medications.length === 1) {
            Alert.alert('Cannot Remove', 'At least one medication is required.');
            return;
        }
        setMedications((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!diagnosis.trim()) {
            Alert.alert('Validation Error', 'Please enter a diagnosis.');
            return;
        }
        const validMeds = medications.filter((m) => m.name.trim());
        if (validMeds.length === 0) {
            Alert.alert('Validation Error', 'Please add at least one medication with a name.');
            return;
        }

        const patientId = appointment?.patientId?._id || appointment?.patientId;

        try {
            setLoading(true);
            await client.post('/prescriptions', {
                appointmentId: appointment._id,
                patientId,
                diagnosis: diagnosis.trim(),
                medications: validMeds,
                additionalNotes: additionalNotes.trim() || undefined,
                followUpDate: followUpDate.trim() || undefined,
                followUpInstructions: followUpInstructions.trim() || undefined,
            });
            Alert.alert('Success', 'Prescription issued successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to issue prescription. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('doctor.writePrescription')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.patientCard}>
                    <View style={styles.patientAvatar}>
                        <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.patientInfo}>
                        <Text style={styles.patientName}>{patientName}</Text>
                        {appointmentDate ? (
                            <Text style={styles.appointmentDate}>Appointment: {appointmentDate}</Text>
                        ) : null}
                        <Text style={styles.appointmentType}>
                            {appointment?.type === 'video' ? 'Video Consultation' : appointment?.type === 'chat' ? 'Chat Consultation' : 'Consultation'}
                        </Text>
                    </View>
                    <View style={styles.rxBadge}>
                        <Text style={styles.rxText}>Rx</Text>
                    </View>
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Diagnosis <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={diagnosis}
                        onChangeText={setDiagnosis}
                        placeholder="e.g. Acute pharyngitis, Viral fever"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <View style={styles.medsSection}>
                    <View style={styles.medsSectionHeader}>
                        <Text style={styles.medsSectionTitle}>Medications</Text>
                        <TouchableOpacity style={styles.addMedBtn} onPress={addMedication} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                            <Text style={styles.addMedText}>{t('doctor.addMedication')}</Text>
                        </TouchableOpacity>
                    </View>

                    {medications.map((med, index) => (
                        <View key={index} style={styles.medCard}>
                            <View style={styles.medCardHeader}>
                                <View style={styles.medNumberBadge}>
                                    <Text style={styles.medNumber}>{index + 1}</Text>
                                </View>
                                <Text style={styles.medCardTitle}>Medication {index + 1}</Text>
                                <TouchableOpacity onPress={() => removeMedication(index)} style={styles.removeMedBtn}>
                                    <MaterialCommunityIcons name="close" size={18} color={colors.error} />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.input}
                                value={med.name}
                                onChangeText={(v) => updateMedication(index, 'name', v)}
                                placeholder="Medication name *"
                                placeholderTextColor={colors.textDisabled}
                            />
                            <View style={styles.medRow}>
                                <TextInput
                                    style={[styles.input, styles.halfInput]}
                                    value={med.dosage}
                                    onChangeText={(v) => updateMedication(index, 'dosage', v)}
                                    placeholder="e.g. 500mg"
                                    placeholderTextColor={colors.textDisabled}
                                />
                                <TextInput
                                    style={[styles.input, styles.halfInput]}
                                    value={med.frequency}
                                    onChangeText={(v) => updateMedication(index, 'frequency', v)}
                                    placeholder="e.g. Twice daily"
                                    placeholderTextColor={colors.textDisabled}
                                />
                            </View>
                            <TextInput
                                style={styles.input}
                                value={med.duration}
                                onChangeText={(v) => updateMedication(index, 'duration', v)}
                                placeholder="Duration e.g. 7 days"
                                placeholderTextColor={colors.textDisabled}
                            />
                            <TextInput
                                style={styles.input}
                                value={med.instructions}
                                onChangeText={(v) => updateMedication(index, 'instructions', v)}
                                placeholder="Instructions e.g. After meals"
                                placeholderTextColor={colors.textDisabled}
                            />
                        </View>
                    ))}
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{t('patient.additionalNotes')}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={additionalNotes}
                        onChangeText={setAdditionalNotes}
                        placeholder="Any additional instructions or notes..."
                        placeholderTextColor={colors.textDisabled}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Follow-up Date <Text style={styles.optional}>(optional)</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={followUpDate}
                        onChangeText={setFollowUpDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Follow-up Instructions <Text style={styles.optional}>(optional)</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={followUpInstructions}
                        onChangeText={setFollowUpInstructions}
                        placeholder="e.g. Return if fever persists beyond 3 days"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="prescription" size={20} color="#fff" />
                            <Text style={styles.submitBtnText}>{t('doctor.issuePrescription')}</Text>
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
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    patientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    patientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    patientInfo: { flex: 1 },
    patientName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
    appointmentDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    appointmentType: { ...typography.caption, color: colors.primary, fontWeight: '500' },
    rxBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    rxText: { color: '#fff', fontSize: 14, fontWeight: '700', fontStyle: 'italic' },
    fieldGroup: { marginBottom: spacing.lg },
    label: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
    required: { color: colors.error },
    optional: { color: colors.textSecondary, fontWeight: '400' },
    input: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        ...typography.body,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    textArea: { minHeight: 80, paddingTop: spacing.md, marginBottom: 0 },
    halfInput: { flex: 1 },
    medRow: { flexDirection: 'row', gap: spacing.sm },
    medsSection: { marginBottom: spacing.lg },
    medsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    medsSectionTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
    addMedBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, gap: spacing.xs },
    addMedText: { fontSize: 13, fontWeight: '600', color: colors.primary },
    medCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
    },
    medCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
    medNumberBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    medNumber: { color: '#fff', fontSize: 12, fontWeight: '700' },
    medCardTitle: { flex: 1, ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary },
    removeMedBtn: { padding: spacing.xs },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        gap: spacing.sm,
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default WritePrescriptionScreen;
