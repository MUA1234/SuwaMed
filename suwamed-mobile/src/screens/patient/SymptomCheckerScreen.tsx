import React, { useState, useCallback } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import IconWrap from '../../components/common/IconWrap';
const languages = [
    { key: 'en', label: 'English', flag: '🇬🇧' },
    { key: 'si', label: 'සිංහල', flag: '🇱🇰' },
    { key: 'ta', label: 'தமிழ்', flag: '🇱🇰' },
];

const bodyAreas = [
    { id: 'head', label: 'Head & Brain', icon: 'head-outline' },
    { id: 'eyes', label: 'Eyes & Vision', icon: 'eye-outline' },
    { id: 'chest', label: 'Chest & Lungs', icon: 'lungs' },
    { id: 'heart', label: 'Heart', icon: 'heart-pulse' },
    { id: 'stomach', label: 'Stomach', icon: 'stomach' },
    { id: 'skin', label: 'Skin', icon: 'hand-heart-outline' },
    { id: 'bones', label: 'Bones & Joints', icon: 'bone' },
    { id: 'general', label: 'General / Other', icon: 'account-question-outline' },
];

const commonSymptoms = [
    'Fever', 'Headache', 'Cough', 'Fatigue', 'Body Pain',
    'Nausea', 'Dizziness', 'Rash', 'Shortness of Breath', 'Sore Throat',
    'Chest Pain', 'Stomach Ache',
];

const SymptomCheckerScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const [selectedLang, setSelectedLang] = useState('en');
    const [selectedBodyArea, setSelectedBodyArea] = useState<string>('');
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [recentChecks, setRecentChecks] = useState<any[]>([]);

    const fetchRecentChecks = async () => {
        try {
            const res = await client.get('/symptoms/history');
            setRecentChecks((res.data?.data || []).slice(0, 3));
        } catch {
            // silently fail
        }
    };

    useFocusEffect(useCallback(() => { fetchRecentChecks(); }, []));

    const toggleSymptom = (s: string) => {
        setSelectedSymptoms(prev =>
            prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
        );
    };

    const handleAnalyze = async () => {
        const trimmedNotes = additionalNotes.trim();
        if (selectedSymptoms.length === 0 && trimmedNotes.length === 0) {
            Alert.alert(t('patient.selectSymptoms'), t('patient.selectAtLeastOneSymptom'));
            return;
        }
        // If only free-text was provided, synthesize a single symptom row from
        // it so the server's "at least one symptom" guard still passes.
        const symptomsToSend = selectedSymptoms.length > 0
            ? selectedSymptoms
            : [trimmedNotes.split(/[\.\n,;]/)[0].slice(0, 80) || 'Free text symptom'];
        setAnalyzing(true);
        try {
            const res = await client.post('/symptoms/check', {
                symptoms: symptomsToSend,
                bodyArea: selectedBodyArea || 'general',
                language: selectedLang,
                additionalNotes: trimmedNotes || undefined,
            });
            const result = res.data?.data;
            navigation.navigate('SymptomResultScreen', {
                result: {
                    assessment: result?.assessment || 'Analysis complete.',
                    severity: result?.severity || 'mild',
                    recommendations: result?.selfCareAdvice ? [result.selfCareAdvice] : ['Please consult a doctor.'],
                    suggestedSpecializations: result?.suggestedSpecializations || [],
                    possibleConditions: result?.possibleConditions || [],
                    recommendation: result?.recommendation || 'consult_doctor',
                    disclaimer: result?.disclaimer || '',
                },
                symptoms: selectedSymptoms,
            });
            // Reset selections after navigation
            setSelectedSymptoms([]);
            setSelectedBodyArea('');
            setAdditionalNotes('');
        } catch (err: any) {
            Alert.alert(t('common.error'), err?.response?.data?.message || t('patient.failedAnalyzeSymptoms'));
        } finally {
            setAnalyzing(false);
        }
    };

    const severityVariant = (s: string): 'warning' | 'success' =>
        s === 'severe' || s === 'moderate' ? 'warning' : 'success';

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.header}>
                    <Text style={styles.heading}>{t('patient.symptomChecker')}</Text>
                    <Text style={styles.subtitle}>{t('patient.aiPoweredAssessment')}</Text>
                </View>

                <View style={styles.langRow}>
                    {languages.map(lang => (
                        <TouchableOpacity
                            key={lang.key}
                            style={[styles.langBtn, selectedLang === lang.key && styles.langBtnActive]}
                            onPress={() => setSelectedLang(lang.key)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.langFlag}>{lang.flag}</Text>
                            <Text style={[styles.langText, selectedLang === lang.key && styles.langTextActive]}>{lang.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.infoBanner}>
                    <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
                    <Text style={styles.infoText}>
                        {t('patient.symptomCheckerDisclaimer')}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('patient.whatAreaAffected')}</Text>
                    <View style={styles.areaGrid}>
                        {bodyAreas.map(area => {
                            const selected = selectedBodyArea === area.id;
                            return (
                                <TouchableOpacity
                                    key={area.id}
                                    style={[styles.areaCard, selected && styles.areaCardActive]}
                                    activeOpacity={0.7}
                                    onPress={() => setSelectedBodyArea(prev => prev === area.id ? '' : area.id)}
                                >
                                    <IconWrap name={area.icon} variant={selected ? 'tinted' : 'outlined'} size="lg" />
                                    <Text style={[styles.areaLabel, selected && styles.areaLabelActive]}>{area.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('patient.commonSymptoms')}</Text>
                    <Text style={styles.sectionSubtitle}>{t('patient.selectAllApply')}</Text>
                    <View style={styles.symptomGrid}>
                        {commonSymptoms.map(sym => (
                            <TouchableOpacity
                                key={sym}
                                style={[styles.symptomChip, selectedSymptoms.includes(sym) && styles.symptomChipActive]}
                                onPress={() => toggleSymptom(sym)}
                                activeOpacity={0.7}
                            >
                                {selectedSymptoms.includes(sym) && (
                                    <MaterialCommunityIcons name="check" size={14} color={colors.primary} />
                                )}
                                <Text style={[styles.symptomText, selectedSymptoms.includes(sym) && styles.symptomTextActive]}>
                                    {sym}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('patient.describeMore')}</Text>
                    <Text style={styles.sectionSubtitle}>{t('patient.describeMoreHint')}</Text>
                    <TextInput
                        style={styles.notesInput}
                        value={additionalNotes}
                        onChangeText={setAdditionalNotes}
                        placeholder={t('patient.symptomNotesPlaceholder')}
                        placeholderTextColor={colors.textDisabled}
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                        textAlignVertical="top"
                    />
                    <Text style={styles.notesCounter}>{additionalNotes.length}/500</Text>
                </View>

                {(selectedSymptoms.length > 0 || additionalNotes.trim().length > 0) && (
                    <TouchableOpacity
                        style={[styles.continueBtn, analyzing && { opacity: 0.7 }]}
                        activeOpacity={0.8}
                        onPress={handleAnalyze}
                        disabled={analyzing}
                    >
                        {analyzing ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Text style={styles.continueText}>
                                    {t('patient.analyzeSymptoms')}
                                    {selectedSymptoms.length > 0 ? ` (${selectedSymptoms.length})` : ''}
                                </Text>
                                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                )}

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('patient.recentChecks')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SymptomHistoryScreen')}>
                            <Text style={styles.seeAll}>{t('common.viewAll')}</Text>
                        </TouchableOpacity>
                    </View>
                    {recentChecks.length === 0 ? (
                        <View style={styles.emptyChecks}>
                            <MaterialCommunityIcons name="clipboard-text-clock" size={32} color={colors.textDisabled} />
                            <Text style={styles.emptyText}>{t('patient.noRecentChecks')}</Text>
                        </View>
                    ) : (
                        recentChecks.map((check: any) => {
                            const symptoms = Array.isArray(check.symptoms)
                                ? check.symptoms.map((s: any) => typeof s === 'string' ? s : s.name).join(', ')
                                : '';
                            return (
                                <TouchableOpacity
                                    key={check._id}
                                    style={styles.historyCard}
                                    activeOpacity={0.7}
                                    onPress={() => navigation.navigate('SymptomHistoryScreen')}
                                >
                                    <IconWrap name="clipboard-text-clock-outline" variant={severityVariant(check.severity)} size="md" />
                                    <View style={styles.historyInfo}>
                                        <Text style={styles.historyTitle} numberOfLines={1}>{symptoms || 'Symptom check'}</Text>
                                        <Text style={styles.historyMeta}>
                                            {new Date(check.createdAt).toLocaleDateString()} · {check.severity}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
    heading: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    langRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
    langBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
    langBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    langFlag: { fontSize: 16 },
    langText: { ...typography.caption, fontWeight: '500', color: colors.textSecondary },
    langTextActive: { color: colors.primary, fontWeight: '600' },
    infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, marginHorizontal: spacing.xl, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xxl, gap: spacing.sm },
    infoText: { ...typography.caption, color: colors.primary, flex: 1 },
    section: { paddingHorizontal: spacing.xl, marginBottom: spacing.xxl },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
    sectionSubtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    seeAll: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
    areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
    areaCard: { width: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
    areaCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    areaLabel: { ...typography.bodySmall, fontWeight: '500', color: colors.textPrimary, textAlign: 'center' },
    areaLabelActive: { color: colors.primary, fontWeight: '600' },
    symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    symptomChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 4 },
    symptomChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    symptomText: { ...typography.bodySmall, color: colors.textSecondary },
    symptomTextActive: { color: colors.primary, fontWeight: '600' },
    continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md, gap: spacing.sm, marginBottom: spacing.xxl },
    continueText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.sm, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
    historyInfo: { flex: 1 },
    historyTitle: { ...typography.body, fontWeight: '500', color: colors.textPrimary },
    historyMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    emptyChecks: { alignItems: 'center', paddingVertical: spacing.xl },
    emptyText: { ...typography.caption, color: colors.textDisabled, marginTop: spacing.sm },
    notesInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, minHeight: 100, color: colors.textPrimary, ...typography.body },
    notesCounter: { ...typography.caption, color: colors.textDisabled, alignSelf: 'flex-end', marginTop: spacing.xs },
});

export default SymptomCheckerScreen;
