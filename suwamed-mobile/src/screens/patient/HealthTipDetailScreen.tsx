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

const categoryColorMap: Record<string, string> = {
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
    disease_prevention: 'Disease Prevention',
    first_aid: 'First Aid',
    maternal_health: 'Maternal Health',
    child_health: 'Child Health',
    elderly_care: 'Elderly Care',
};

const HealthTipDetailScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const route = useRoute<any>();
    const { tip } = route.params as { tip: { _id: string; title: string; content: string; category: string; viewCount: number; publishedAt: string } };

    const catColor = categoryColorMap[tip.category] || '#6B7280';
    const catLabel = categoryLabels[tip.category] || tip.category;

    const formattedDate = tip.publishedAt
        ? new Date(tip.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { borderBottomColor: catColor + '30' }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{catLabel}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.iconWrap, { backgroundColor: catColor + '15' }]}>
                    <MaterialCommunityIcons name="lightbulb" size={48} color={catColor} />
                </View>

                <View style={[styles.categoryBadge, { backgroundColor: catColor + '18' }]}>
                    <Text style={[styles.categoryBadgeText, { color: catColor }]}>{catLabel}</Text>
                </View>

                <Text style={styles.title}>{tip.title}</Text>

                <View style={styles.metaRow}>
                    {formattedDate ? (
                        <View style={styles.metaItem}>
                            <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textSecondary} />
                            <Text style={styles.metaText}>{formattedDate}</Text>
                        </View>
                    ) : null}
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="eye-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{tip.viewCount || 0} views</Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: catColor + '25' }]} />

                <Text style={styles.content}>{tip.content}</Text>

                <View style={[styles.footerNote, { backgroundColor: catColor + '10', borderLeftColor: catColor }]}>
                    <MaterialCommunityIcons name="information-outline" size={16} color={catColor} />
                    <Text style={[styles.footerNoteText, { color: catColor }]}>
                        This health tip is for informational purposes only. Always consult a qualified healthcare professional for medical advice.
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
        borderBottomWidth: 1,
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
    headerTitle: { ...typography.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' },
    scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: 60 },
    iconWrap: {
        width: 88,
        height: 88,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    categoryBadge: {
        alignSelf: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.lg,
    },
    categoryBadgeText: { fontSize: 13, fontWeight: '600' },
    title: {
        ...typography.h1,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 36,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.xl,
        marginBottom: spacing.lg,
    },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    metaText: { ...typography.caption, color: colors.textSecondary },
    divider: { height: 1, marginBottom: spacing.xl },
    content: {
        ...typography.body,
        color: colors.textPrimary,
        lineHeight: 26,
        marginBottom: spacing.xxl,
    },
    footerNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderLeftWidth: 3,
    },
    footerNoteText: { ...typography.caption, flex: 1, lineHeight: 18 },
});

export default HealthTipDetailScreen;
