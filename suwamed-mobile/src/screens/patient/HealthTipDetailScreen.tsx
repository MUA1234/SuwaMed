import React, { useEffect, useRef } from 'react';
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
import IconWrap from '../../components/common/IconWrap';
import { useTranslation } from 'react-i18next';
import { incrementHealthTipView } from '../../api/healthTip.api';

const categoryIcons: Record<string, string> = {
    nutrition: 'food-apple-outline',
    exercise: 'run',
    mental_health: 'meditation',
    disease_prevention: 'shield-check-outline',
    first_aid: 'medical-bag',
    maternal_health: 'human-pregnant',
    child_health: 'human-child',
    elderly_care: 'human-cane',
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

    const catIcon = categoryIcons[tip.category] || 'leaf';
    const catLabel = categoryLabels[tip.category] || tip.category;

    const counted = useRef(false);
    useEffect(() => {
        if (counted.current || !tip?._id) return;
        counted.current = true;
        incrementHealthTipView(tip._id).catch(() => {});
    }, [tip?._id]);

    const formattedDate = tip.publishedAt
        ? new Date(tip.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{catLabel}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.iconWrapHero}>
                    <IconWrap name={catIcon} variant="tinted" size="xl" />
                </View>

                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{catLabel}</Text>
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

                <View style={styles.divider} />

                <Text style={styles.content}>{tip.content}</Text>

                <View style={styles.footerNote}>
                    <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary} />
                    <Text style={styles.footerNoteText}>
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
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
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
    iconWrapHero: { alignSelf: 'center', marginBottom: spacing.lg },
    categoryBadge: {
        alignSelf: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryBadgeText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
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
    divider: { height: StyleSheet.hairlineWidth, marginBottom: spacing.xl, backgroundColor: colors.border },
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
        backgroundColor: colors.primaryLight,
        borderLeftColor: colors.primary,
    },
    footerNoteText: { ...typography.caption, flex: 1, lineHeight: 18, color: colors.primary },
});

export default HealthTipDetailScreen;
