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
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const PrescriptionDetailScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation();
    const { t } = useTranslation();
    const route = useRoute<any>();
    const { prescription } = route.params;

    const doctorUser = prescription.doctorId?.userId;
    const doctorName = doctorUser
        ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`
        : 'Unknown Doctor';
    const specialty = prescription.doctorId?.specialization || '';
    const dateStr = prescription.createdAt
        ? new Date(prescription.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    const initials = doctorUser
        ? `${(doctorUser.firstName || '?')[0]}${(doctorUser.lastName || '?')[0]}`
        : 'DR';

    const medications: any[] = prescription.medications || [];

    const followUpDate = prescription.followUpDate
        ? new Date(prescription.followUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Prescription</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.doctorCard}>
                    <View style={styles.doctorAvatar}>
                        <Text style={styles.doctorInitials}>{initials}</Text>
                    </View>
                    <View style={styles.doctorInfo}>
                        <Text style={styles.doctorName}>{doctorName}</Text>
                        {specialty ? <Text style={styles.specialty}>{specialty}</Text> : null}
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>{t('patient.dateIssued')}</Text>
                            <Text style={styles.infoValue}>{dateStr || 'Unknown date'}</Text>
                        </View>
                    </View>
                    {prescription.diagnosis ? (
                        <View style={[styles.infoRow, { marginTop: spacing.md }]}>
                            <MaterialCommunityIcons name="stethoscope" size={18} color={colors.primary} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{t('patient.diagnosis')}</Text>
                                <Text style={styles.infoValue}>{prescription.diagnosis}</Text>
                            </View>
                        </View>
                    ) : null}
                </View>

                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="pill" size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Medications</Text>
                    <View style={styles.medCountBadge}>
                        <Text style={styles.medCountText}>{medications.length}</Text>
                    </View>
                </View>

                {medications.map((med: any, index: number) => (
                    <View key={index} style={styles.medCard}>
                        <View style={styles.medHeader}>
                            <View style={styles.medNumberBadge}>
                                <Text style={styles.medNumber}>{index + 1}</Text>
                            </View>
                            <Text style={styles.medName}>{med.name || 'Unnamed Medication'}</Text>
                        </View>
                        <View style={styles.medDetails}>
                            {med.dosage ? (
                                <View style={styles.medDetail}>
                                    <Text style={styles.medDetailLabel}>{t('patient.dosage')}</Text>
                                    <Text style={styles.medDetailValue}>{med.dosage}</Text>
                                </View>
                            ) : null}
                            {med.frequency ? (
                                <View style={styles.medDetail}>
                                    <Text style={styles.medDetailLabel}>{t('patient.frequency')}</Text>
                                    <Text style={styles.medDetailValue}>{med.frequency}</Text>
                                </View>
                            ) : null}
                            {med.duration ? (
                                <View style={styles.medDetail}>
                                    <Text style={styles.medDetailLabel}>{t('patient.duration')}</Text>
                                    <Text style={styles.medDetailValue}>{med.duration}</Text>
                                </View>
                            ) : null}
                            {med.quantity ? (
                                <View style={styles.medDetail}>
                                    <Text style={styles.medDetailLabel}>{t('patient.quantity')}</Text>
                                    <Text style={styles.medDetailValue}>{med.quantity}</Text>
                                </View>
                            ) : null}
                        </View>
                        {med.instructions ? (
                            <View style={styles.medInstructions}>
                                <MaterialCommunityIcons name="information-outline" size={14} color={colors.textSecondary} />
                                <Text style={styles.medInstructionsText}>{med.instructions}</Text>
                            </View>
                        ) : null}
                    </View>
                ))}

                {prescription.additionalNotes ? (
                    <View style={styles.notesCard}>
                        <Text style={styles.notesTitle}>{t('patient.additionalNotes')}</Text>
                        <Text style={styles.notesText}>{prescription.additionalNotes}</Text>
                    </View>
                ) : null}

                {(followUpDate || prescription.followUpInstructions) ? (
                    <View style={styles.followUpCard}>
                        <View style={styles.followUpHeader}>
                            <MaterialCommunityIcons name="calendar-clock" size={20} color='#F59E0B' />
                            <Text style={styles.followUpTitle}>{t('patient.followUp')}</Text>
                        </View>
                        {followUpDate ? (
                            <View style={styles.followUpRow}>
                                <Text style={styles.followUpLabel}>{t('common.date')}</Text>
                                <Text style={styles.followUpValue}>{followUpDate}</Text>
                            </View>
                        ) : null}
                        {prescription.followUpInstructions ? (
                            <View style={styles.followUpRow}>
                                <Text style={styles.followUpLabel}>{t('patient.instructions')}</Text>
                                <Text style={styles.followUpValue}>{prescription.followUpInstructions}</Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                {prescription.digitalSignature ? (
                    <View style={styles.signatureBadge}>
                        <MaterialCommunityIcons name="shield-check" size={18} color={colors.success} />
                        <Text style={styles.signatureText}>{t('patient.digitallySigned')}</Text>
                    </View>
                ) : null}
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
    doctorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginTop: spacing.sm,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    doctorAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    doctorInitials: { fontSize: 18, fontWeight: '700', color: colors.primary },
    doctorInfo: { flex: 1 },
    doctorName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
    specialty: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    infoCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
    infoContent: { flex: 1, marginLeft: spacing.md },
    infoLabel: { ...typography.caption, color: colors.textSecondary },
    infoValue: { ...typography.body, color: colors.textPrimary, fontWeight: '500', marginTop: 2 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, flex: 1 },
    medCountBadge: { backgroundColor: '#EBF5FF', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 12 },
    medCountText: { fontSize: 12, fontWeight: '700', color: colors.primary },
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
    medHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
    medNumberBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    medNumber: { color: '#fff', fontSize: 12, fontWeight: '700' },
    medName: { ...typography.body, fontWeight: '700', color: colors.textPrimary, flex: 1 },
    medDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    medDetail: { backgroundColor: '#F3F4F6', borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
    medDetailLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '500' },
    medDetailValue: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
    medInstructions: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm, gap: spacing.xs },
    medInstructionsText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
    notesCard: {
        backgroundColor: '#FFFBEB',
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginTop: spacing.sm,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    notesTitle: { ...typography.bodySmall, fontWeight: '700', color: '#92400E', marginBottom: spacing.sm },
    notesText: { ...typography.body, color: '#78350F', lineHeight: 22 },
    followUpCard: {
        backgroundColor: '#FFFBEB',
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    followUpHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    followUpTitle: { ...typography.body, fontWeight: '700', color: '#92400E' },
    followUpRow: { flexDirection: 'row', marginBottom: spacing.sm },
    followUpLabel: { ...typography.bodySmall, color: '#92400E', width: 100, fontWeight: '600' },
    followUpValue: { ...typography.bodySmall, color: '#78350F', flex: 1 },
    signatureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ECFDF5',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        gap: spacing.sm,
        marginTop: spacing.sm,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    signatureText: { ...typography.bodySmall, fontWeight: '600', color: colors.success },
});

export default PrescriptionDetailScreen;
