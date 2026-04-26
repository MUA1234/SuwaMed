import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const getSeverityConfig = (colors: ThemeColors): Record<string, { color: string; bg: string; label: string }> => ({
    mild: { color: colors.success, bg: colors.successLight, label: 'Mild' },
    moderate: { color: colors.warning, bg: colors.warningLight, label: 'Moderate' },
    severe: { color: colors.error, bg: colors.errorLight, label: 'Severe' },
});

const getSymptomNames = (symptoms: any[]): string => {
    if (!symptoms || symptoms.length === 0) return 'No symptoms recorded';
    const names = symptoms.map((s) => (typeof s === 'string' ? s : s.name || String(s)));
    if (names.length <= 3) return names.join(', ');
    return `${names.slice(0, 3).join(', ')}...`;
};

const SymptomHistoryScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const severityConfig = getSeverityConfig(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async () => {
        try {
            const res = await client.get('/symptoms/history');
            setHistory(res.data?.data || res.data || []);
        } catch (err) {
            console.log('Symptom history fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchHistory(); }, []));

    const onRefresh = () => { setRefreshing(true); fetchHistory(); };

    const handleDelete = (item: any) => {
        Alert.alert(
            'Delete Record',
            'Are you sure you want to delete this symptom check?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await client.delete(`/symptoms/${item._id}`);
                            setHistory((prev) => prev.filter((h) => h._id !== item._id));
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete record. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('patient.symptomHistory')}</Text>
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
                <Text style={styles.headerTitle}>{t('patient.symptomHistory')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={history}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                renderItem={({ item }) => {
                    const severity = severityConfig[item.severity] || severityConfig.mild;
                    const dateStr = item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '';
                    const symptomText = getSymptomNames(item.symptoms || []);
                    const assessment = item.assessment || item.result || '';

                    return (
                        <TouchableOpacity
                            style={styles.card}
                            onLongPress={() => handleDelete(item)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardTopRow}>
                                <View style={styles.dateWrap}>
                                    <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
                                    <Text style={styles.dateText}>{dateStr}</Text>
                                </View>
                                <View style={[styles.severityBadge, { backgroundColor: severity.bg }]}>
                                    <Text style={[styles.severityText, { color: severity.color }]}>{severity.label}</Text>
                                </View>
                            </View>

                            <View style={styles.symptomsRow}>
                                <MaterialCommunityIcons name="thermometer" size={16} color={colors.textSecondary} />
                                <Text style={styles.symptomsText}>{symptomText}</Text>
                            </View>

                            {assessment ? (
                                <Text style={styles.assessmentText} numberOfLines={2}>{assessment}</Text>
                            ) : null}

                            <Text style={styles.longPressHint}>Long press to delete</Text>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="clipboard-text-outline" size={56} color={colors.textDisabled} />
                        <Text style={styles.emptyTitle}>{t('patient.noSymptomChecks')}</Text>
                        <Text style={styles.emptySubtitle}>{t('patient.symptomHistoryAppearHere')}</Text>
                    </View>
                }
            />
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
    listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40, paddingTop: spacing.sm },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    dateWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    dateText: { ...typography.caption, color: colors.textSecondary },
    severityBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10 },
    severityText: { fontSize: 11, fontWeight: '700' },
    symptomsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginBottom: spacing.sm },
    symptomsText: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '500', flex: 1 },
    assessmentText: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
    longPressHint: { ...typography.caption, color: colors.textDisabled, marginTop: spacing.sm, fontSize: 10 },
    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
    emptySubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});

export default SymptomHistoryScreen;
