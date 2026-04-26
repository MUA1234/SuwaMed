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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as healthTipApi from '../../api/healthTip.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

type CategoryKey = 'all' | 'nutrition' | 'exercise' | 'mental_health' | 'disease_prevention' | 'first_aid';

const categoryFilters: { key: CategoryKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'nutrition', label: 'Nutrition' },
    { key: 'exercise', label: 'Exercise' },
    { key: 'mental_health', label: 'Mental Health' },
    { key: 'disease_prevention', label: 'Prevention' },
    { key: 'first_aid', label: 'First Aid' },
];

const categoryColors: Record<string, string> = {
    nutrition: '#10B981',
    exercise: '#1A73E8',
    mental_health: '#8B5CF6',
    disease_prevention: '#F59E0B',
    first_aid: '#DC2626',
    maternal_health: '#EC4899',
    child_health: '#F59E0B',
    elderly_care: '#6B7280',
};

const categoryLabels: Record<string, string> = {
    nutrition: 'Nutrition',
    exercise: 'Exercise',
    mental_health: 'Mental Health',
    disease_prevention: 'Prevention',
    first_aid: 'First Aid',
    maternal_health: 'Maternal Health',
    child_health: 'Child Health',
    elderly_care: 'Elderly Care',
};

const HealthTipsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [tips, setTips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

    const fetchTips = async () => {
        try {
            const params: any = { language: 'en' };
            if (activeCategory !== 'all') params.category = activeCategory;
            const res = await healthTipApi.getHealthTips(params);
            setTips(res.data || []);
        } catch (err) {
            console.log('Health tips fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchTips(); }, [activeCategory]));
    const onRefresh = () => { setRefreshing(true); fetchTips(); };

    const renderTip = ({ item }: { item: any }) => {
        const catColor = categoryColors[item.category] || '#6B7280';
        const catLabel = categoryLabels[item.category] || item.category;
        return (
            <TouchableOpacity
                style={styles.tipCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('HealthTipDetailScreen', { tip: item })}
            >
                <View style={[styles.tipIconWrap, { backgroundColor: catColor + '15' }]}>
                    <MaterialCommunityIcons name="lightbulb-outline" size={24} color={catColor} />
                </View>
                <View style={styles.tipContent}>
                    <Text style={styles.tipTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.tipMeta}>
                        <View style={[styles.categoryBadge, { backgroundColor: catColor + '18' }]}>
                            <Text style={[styles.categoryBadgeText, { color: catColor }]}>{catLabel}</Text>
                        </View>
                        <View style={styles.viewCountRow}>
                            <MaterialCommunityIcons name="eye-outline" size={12} color={colors.textDisabled} />
                            <Text style={styles.viewCount}>{item.viewCount || 0}</Text>
                        </View>
                    </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.healthTips')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.filterRow}>
                <FlatList
                    horizontal
                    data={categoryFilters}
                    keyExtractor={(item) => item.key}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.filterChip, activeCategory === item.key && styles.filterChipActive]}
                            onPress={() => setActiveCategory(item.key)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.filterChipText, activeCategory === item.key && styles.filterChipTextActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={tips}
                    keyExtractor={(item) => item._id}
                    renderItem={renderTip}
                    contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="lightbulb-off-outline" size={56} color={colors.textDisabled} />
                            <Text style={styles.emptyTitle}>{t('patient.noTipsAvailable')}</Text>
                            <Text style={styles.emptySubtitle}>{t('patient.checkBackLater')}</Text>
                        </View>
                    }
                />
            )}
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
    filterRow: { marginBottom: spacing.md },
    filterChip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterChipText: { ...typography.bodySmall, fontWeight: '500', color: colors.textSecondary },
    filterChipTextActive: { color: '#fff', fontWeight: '600' },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tipIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    tipContent: { flex: 1 },
    tipTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
    tipMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    categoryBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 8 },
    categoryBadgeText: { fontSize: 11, fontWeight: '600' },
    viewCountRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    viewCount: { ...typography.caption, color: colors.textDisabled },
    emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl * 2 },
    emptyTitle: { ...typography.h3, color: colors.textSecondary, marginTop: spacing.lg },
    emptySubtitle: { ...typography.bodySmall, color: colors.textDisabled, marginTop: spacing.xs },
});

export default HealthTipsScreen;
