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

const categoryMap: Record<string, { icon: string; color: string; label: string }> = {
    lab_report: { icon: 'flask', color: '#3B82F6', label: 'Lab Report' },
    prescription: { icon: 'pill', color: '#10B981', label: 'Prescription' },
    imaging: { icon: 'radioactive', color: '#8B5CF6', label: 'Imaging' },
    vaccination: { icon: 'needle', color: '#F59E0B', label: 'Vaccination' },
    discharge_summary: { icon: 'hospital', color: '#EC4899', label: 'Discharge Summary' },
    other: { icon: 'file-document', color: '#6B7280', label: 'Other' },
};

const formatFileSize = (bytes: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const RecordDetailScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation();
    const { t } = useTranslation();
    const route = useRoute<any>();
    const { record } = route.params;

    const cat = categoryMap[record.category] || categoryMap.other;
    const dateStr = record.date
        ? new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'Unknown date';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{record.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroBanner}>
                    <View style={[styles.heroIcon, { backgroundColor: cat.color + '20' }]}>
                        <MaterialCommunityIcons name={cat.icon as any} size={40} color={cat.color} />
                    </View>
                    <Text style={styles.heroTitle}>{record.title}</Text>
                    <View style={[styles.categoryBadge, { backgroundColor: cat.color + '15' }]}>
                        <Text style={[styles.categoryBadgeText, { color: cat.color }]}>{cat.label}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t('patient.recordInfo')}</Text>

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconWrap}>
                            <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>{t('common.date')}</Text>
                            <Text style={styles.infoValue}>{dateStr}</Text>
                        </View>
                    </View>

                    {record.doctor ? (
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconWrap}>
                                <MaterialCommunityIcons name="doctor" size={18} color={colors.primary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Doctor</Text>
                                <Text style={styles.infoValue}>{record.doctor}</Text>
                            </View>
                        </View>
                    ) : null}

                    {record.hospital ? (
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconWrap}>
                                <MaterialCommunityIcons name="hospital-building" size={18} color={colors.primary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Hospital / Clinic</Text>
                                <Text style={styles.infoValue}>{record.hospital}</Text>
                            </View>
                        </View>
                    ) : null}
                </View>

                {record.description ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{t('common.description')}</Text>
                        <Text style={styles.descriptionText}>{record.description}</Text>
                    </View>
                ) : null}

                {(record.fileUrl || record.fileType || record.fileSize) ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{t('patient.fileInfo')}</Text>
                        {record.fileType ? (
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconWrap}>
                                    <MaterialCommunityIcons name="file-outline" size={18} color={colors.primary} />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>{t('patient.fileType')}</Text>
                                    <Text style={styles.infoValue}>{record.fileType.toUpperCase()}</Text>
                                </View>
                            </View>
                        ) : null}
                        {record.fileSize ? (
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconWrap}>
                                    <MaterialCommunityIcons name="database-outline" size={18} color={colors.primary} />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>{t('patient.fileSize')}</Text>
                                    <Text style={styles.infoValue}>{formatFileSize(record.fileSize)}</Text>
                                </View>
                            </View>
                        ) : null}
                        {record.fileUrl ? (
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconWrap}>
                                    <MaterialCommunityIcons name="link" size={18} color={colors.primary} />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>File URL / Notes</Text>
                                    <Text style={styles.infoValue} numberOfLines={2}>{record.fileUrl}</Text>
                                </View>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                {record.tags && record.tags.length > 0 ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{t('common.tags')}</Text>
                        <View style={styles.tagsWrap}>
                            {record.tags.map((tag: string, i: number) => (
                                <View key={i} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}

                <View style={styles.card}>
                    <View style={styles.shareRow}>
                        <View style={styles.shareIconWrap}>
                            <MaterialCommunityIcons
                                name={record.isSharedWithDoctor ? 'share-variant' : 'share-variant-outline'}
                                size={20}
                                color={record.isSharedWithDoctor ? colors.success : colors.textSecondary}
                            />
                        </View>
                        <View style={styles.shareInfo}>
                            <Text style={styles.shareTitle}>{t('patient.sharedWithDoctors')}</Text>
                            <Text style={styles.shareSubtitle}>
                                {record.isSharedWithDoctor
                                    ? 'This record is visible to your treating doctors'
                                    : 'This record is private and not shared'}
                            </Text>
                        </View>
                        <View style={[styles.shareStatus, { backgroundColor: record.isSharedWithDoctor ? '#ECFDF5' : '#F3F4F6' }]}>
                            <Text style={[styles.shareStatusText, { color: record.isSharedWithDoctor ? colors.success : colors.textSecondary }]}>
                                {record.isSharedWithDoctor ? 'Shared' : 'Private'}
                            </Text>
                        </View>
                    </View>
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
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center', marginHorizontal: spacing.sm },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    heroBanner: { alignItems: 'center', paddingVertical: spacing.xxl },
    heroIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    heroTitle: { ...typography.h2, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
    categoryBadge: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: borderRadius.xl },
    categoryBadgeText: { fontSize: 13, fontWeight: '600' },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm },
    infoIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    infoContent: { flex: 1 },
    infoLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
    infoValue: { ...typography.body, color: colors.textPrimary, fontWeight: '500' },
    descriptionText: { ...typography.body, color: colors.textPrimary, lineHeight: 24 },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tag: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: '#EBF5FF', borderRadius: borderRadius.xl },
    tagText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
    shareRow: { flexDirection: 'row', alignItems: 'center' },
    shareIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    shareInfo: { flex: 1 },
    shareTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    shareSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    shareStatus: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 12 },
    shareStatusText: { fontSize: 11, fontWeight: '600' },
});

export default RecordDetailScreen;
