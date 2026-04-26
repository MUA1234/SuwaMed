import React, { useState, useCallback } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import { colors, spacing, borderRadius, typography } from '../../config/theme';

const languages = [
    { key: 'en', label: 'English', flag: '🇬🇧' },
    { key: 'si', label: 'සිංහල', flag: '🇱🇰' },
    { key: 'ta', label: 'தமிழ்', flag: '🇱🇰' },
];

const bodyAreas = [
    { id: 'head', label: 'Head & Brain', icon: 'head', color: '#8B5CF6' },
    { id: 'eyes', label: 'Eyes & Vision', icon: 'eye', color: '#3B82F6' },
    { id: 'chest', label: 'Chest & Lungs', icon: 'lungs', color: '#DC2626' },
    { id: 'heart', label: 'Heart', icon: 'heart-pulse', color: '#EC4899' },
    { id: 'stomach', label: 'Stomach', icon: 'stomach', color: '#F59E0B' },
    { id: 'skin', label: 'Skin', icon: 'hand-heart', color: '#10B981' },
    { id: 'bones', label: 'Bones & Joints', icon: 'bone', color: '#6B7280' },
    { id: 'general', label: 'General / Other', icon: 'account-question', color: '#1A73E8' },
];

const commonSymptoms = [
    'Fever', 'Headache', 'Cough', 'Fatigue', 'Body Pain',
    'Nausea', 'Dizziness', 'Rash', 'Shortness of Breath', 'Sore Throat',
    'Chest Pain', 'Stomach Ache',
];

const SymptomCheckerScreen: React.FC = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const [selectedLang, setSelectedLang] = useState('en');
    const [selectedBodyArea, setSelectedBodyArea] = useState<string>('');
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
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
        if (selectedSymptoms.length === 0) {
            Alert.alert(t('patient.selectSymptoms'), t('patient.selectAtLeastOneSymptom'));
            return;
        }
        setAnalyzing(true);
        try {
            const res = await client.post('/symptoms/check', {
                symptoms: selectedSymptoms,
                bodyArea: selectedBodyArea || 'general',
                language: selectedLang,
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
        } catch (err: any) {
            Alert.alert(t('common.error'), err?.response?.data?.message || t('patient.failedAnalyzeSymptoms'));
        } finally {
            setAnalyzing(false);
        }
    };

    const severityColor = (s: string) =>
        s === 'severe' ? colors.error : s === 'moderate' ? colors.warning : colors.success;

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
                        {bodyAreas.map(area => (
                            <TouchableOpacity
                                key={area.id}
                                style={[styles.areaCard, selectedBodyArea === area.id && { borderColor: area.color, borderWidth: 2 }]}
                                activeOpacity={0.7}
                                onPress={() => setSelectedBodyArea(prev => prev === area.id ? '' : area.id)}
                            >
                                <View style={[styles.areaIcon, { backgroundColor: area.color + '15' }]}>
                                    <MaterialCommunityIcons name={area.icon as any} size={28} color={area.color} />
                                </View>
                                <Text style={styles.areaLabel}>{area.label}</Text>
                            </TouchableOpacity>
                        ))}
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

                {selectedSymptoms.length > 0 && (
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
                                <Text style={styles.continueText}>{t('patient.analyzeSymptoms')} ({selectedSymptoms.length})</Text>
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
                                    <View style={[styles.historyIcon, { backgroundColor: severityColor(check.severity) + '15' }]}>
                                        <MaterialCommunityIcons name="clipboard-text-clock" size={20} color={severityColor(check.severity)} />
                                    </View>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
    heading: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    langRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
    langBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
    langBtnActive: { backgroundColor: '#EBF5FF', borderColor: colors.primary },
    langFlag: { fontSize: 16 },
    langText: { ...typography.caption, fontWeight: '500', color: colors.textSecondary },
    langTextActive: { color: colors.primary, fontWeight: '600' },
    infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF5FF', marginHorizontal: spacing.xl, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xxl, gap: spacing.sm },
    infoText: { ...typography.caption, color: colors.primary, flex: 1 },
    section: { paddingHorizontal: spacing.xl, marginBottom: spacing.xxl },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
    sectionSubtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    seeAll: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
    areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
    areaCard: { width: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    areaIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    areaLabel: { ...typography.bodySmall, fontWeight: '500', color: colors.textPrimary, textAlign: 'center' },
    symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    symptomChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 4 },
    symptomChipActive: { backgroundColor: '#EBF5FF', borderColor: colors.primary },
    symptomText: { ...typography.bodySmall, color: colors.textSecondary },
    symptomTextActive: { color: colors.primary, fontWeight: '600' },
    continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md, gap: spacing.sm, marginBottom: spacing.xxl },
    continueText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
    historyIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    historyInfo: { flex: 1 },
    historyTitle: { ...typography.body, fontWeight: '500', color: colors.textPrimary },
    historyMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    emptyChecks: { alignItems: 'center', paddingVertical: spacing.xl },
    emptyText: { ...typography.caption, color: colors.textDisabled, marginTop: spacing.sm },
});

export default SymptomCheckerScreen;
