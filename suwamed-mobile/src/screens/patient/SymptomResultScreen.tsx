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
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
type Severity = 'mild' | 'moderate' | 'severe';

interface SymptomResult {
    assessment: string;
    severity: Severity;
    recommendations: string[];
    suggestedSpecializations?: string[];
}

const severityConfig: Record<Severity, { color: string; bg: string; icon: string; label: string }> = {
    mild: { color: '#10B981', bg: '#ECFDF5', icon: 'check-circle', label: 'Mild' },
    moderate: { color: '#F59E0B', bg: '#FFFBEB', icon: 'alert-circle', label: 'Moderate' },
    severe: { color: '#DC2626', bg: '#FEF2F2', icon: 'alert-octagon', label: 'Severe' },
};

const SymptomResultScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { t } = useTranslation();
    const { result, symptoms } = route.params as { result: SymptomResult; symptoms: string[] };

    const severity = result.severity || 'mild';
    const sevConfig = severityConfig[severity] || severityConfig.mild;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Symptom Analysis</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Severity Indicator */}
                <View style={[styles.severityCard, { backgroundColor: sevConfig.bg, borderColor: sevConfig.color + '40' }]}>
                    <MaterialCommunityIcons name={sevConfig.icon as any} size={40} color={sevConfig.color} />
                    <View style={styles.severityInfo}>
                        <Text style={styles.severityTitle}>Severity Level</Text>
                        <Text style={[styles.severityLabel, { color: sevConfig.color }]}>{sevConfig.label}</Text>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: sevConfig.color }]}>
                        <Text style={styles.severityBadgeText}>{sevConfig.label.toUpperCase()}</Text>
                    </View>
                </View>

                {/* Symptoms Entered */}
                {symptoms && symptoms.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Symptoms Reported</Text>
                        <View style={styles.symptomsWrap}>
                            {symptoms.map((sym, i) => (
                                <View key={i} style={styles.symptomChip}>
                                    <MaterialCommunityIcons name="circle-small" size={16} color={colors.primary} />
                                    <Text style={styles.symptomChipText}>{sym}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Assessment Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('patient.assessment')}</Text>
                    <View style={styles.assessmentCard}>
                        <Text style={styles.assessmentText}>{result.assessment}</Text>
                    </View>
                </View>

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('patient.recommendations')}</Text>
                        <View style={styles.recCard}>
                            {result.recommendations.map((rec, i) => (
                                <View key={i} style={styles.recItem}>
                                    <View style={styles.recIconWrap}>
                                        <MaterialCommunityIcons name="check" size={14} color={colors.success} />
                                    </View>
                                    <Text style={styles.recText}>{rec}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Suggested Specializations */}
                {result.suggestedSpecializations && result.suggestedSpecializations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('patient.suggestedSpecializations')}</Text>
                        <View style={styles.specGrid}>
                            {result.suggestedSpecializations.map((spec, i) => (
                                <View key={i} style={styles.specChip}>
                                    <MaterialCommunityIcons name="medical-bag" size={14} color={colors.primary} />
                                    <Text style={styles.specChipText}>{spec}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Warning for Severe */}
                {severity === 'severe' && (
                    <View style={styles.warningBanner}>
                        <MaterialCommunityIcons name="alert" size={20} color={colors.error} />
                        <Text style={styles.warningText}>
                            Your symptoms may require immediate medical attention. Please seek emergency care if needed.
                        </Text>
                    </View>
                )}

                {/* Find a Doctor Button */}
                <TouchableOpacity
                    style={styles.findDoctorBtn}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('DoctorSearchScreen')}
                >
                    <MaterialCommunityIcons name="magnify" size={20} color="#fff" />
                    <Text style={styles.findDoctorText}>Find a Doctor</Text>
                </TouchableOpacity>

                {/* Save Info */}
                <View style={styles.saveNote}>
                    <MaterialCommunityIcons name="content-save-outline" size={14} color={colors.textDisabled} />
                    <Text style={styles.saveNoteText}>This analysis has been saved to your symptom history</Text>
                </View>

                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                    <MaterialCommunityIcons name="information-outline" size={14} color={colors.textDisabled} />
                    <Text style={styles.disclaimerText}>
                        This assessment is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional.
                    </Text>
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
    headerTitle: { ...typography.h3, color: colors.textPrimary },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 60 },
    severityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        marginBottom: spacing.xxl,
        borderWidth: 1,
        gap: spacing.md,
    },
    severityInfo: { flex: 1 },
    severityTitle: { ...typography.caption, color: colors.textSecondary },
    severityLabel: { fontSize: 20, fontWeight: '700', marginTop: 2 },
    severityBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 8 },
    severityBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
    section: { marginBottom: spacing.xxl },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    symptomsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    symptomChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF5FF',
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    symptomChipText: { ...typography.bodySmall, color: colors.primary, fontWeight: '500' },
    assessmentCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    assessmentText: { ...typography.body, color: colors.textPrimary, lineHeight: 26 },
    recCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
    },
    recItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    recIconWrap: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    recText: { ...typography.bodySmall, color: colors.textPrimary, flex: 1, lineHeight: 22 },
    specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    specChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF5FF',
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.xs,
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    specChipText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FEF2F2',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.error + '30',
    },
    warningText: { ...typography.bodySmall, color: colors.error, flex: 1, lineHeight: 20 },
    findDoctorBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    findDoctorText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    saveNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    saveNoteText: { ...typography.caption, color: colors.textDisabled },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.xs,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    disclaimerText: { ...typography.caption, color: colors.textDisabled, flex: 1, lineHeight: 18 },
});

export default SymptomResultScreen;
