import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import IconWrap from '../../components/common/IconWrap';
import { hasBundledPrescription, downloadBundledPrescription } from '../../utils/bundledPrescription';

// Category → glyph only. The hero icon and category badge always render in primary teal —
// distinction comes from icon shape and the label, not from a rainbow tile.
const categoryMap: Record<string, { icon: string; label: string }> = {
    lab_report: { icon: 'flask-outline', label: 'Lab Report' },
    prescription: { icon: 'pill', label: 'Prescription' },
    imaging: { icon: 'radioactive', label: 'Imaging' },
    vaccination: { icon: 'needle', label: 'Vaccination' },
    discharge_summary: { icon: 'hospital-building', label: 'Discharge Summary' },
    other: { icon: 'file-document-outline', label: 'Other' },
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

    const [opening, setOpening] = useState(false);
    const isBundled = hasBundledPrescription(record);

    const handleOpenFile = async () => {
        setOpening(true);
        try {
            if (isBundled) {
                await downloadBundledPrescription(record);
                return;
            }
            if (!record.fileUrl) return;
            try {
                await WebBrowser.openBrowserAsync(record.fileUrl, {
                    toolbarColor: colors.primary,
                    controlsColor: '#ffffff',
                    showTitle: true,
                });
            } catch {
                try {
                    await Linking.openURL(record.fileUrl);
                } catch {
                    Alert.alert('Unable to open document', 'Please check your internet connection and try again.');
                }
            }
        } finally {
            setOpening(false);
        }
    };

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
                {(record.fileUrl || isBundled) ? (
                    <TouchableOpacity
                        style={styles.fileBtn}
                        onPress={handleOpenFile}
                        activeOpacity={0.85}
                        disabled={opening}
                    >
                        <View style={styles.fileIconWrap}>
                            <MaterialCommunityIcons name={isBundled ? 'download' : 'file-pdf-box'} size={28} color="#fff" />
                        </View>
                        <View style={styles.fileTextWrap}>
                            <Text style={styles.fileBtnTitle}>{isBundled ? 'Download prescription' : 'View document'}</Text>
                            <Text style={styles.fileBtnSubtitle}>{isBundled ? 'PDF · save to device' : 'Opens in browser'}</Text>
                        </View>
                        {opening ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <MaterialCommunityIcons name={isBundled ? 'arrow-down-bold' : 'open-in-new'} size={22} color="#fff" />
                        )}
                    </TouchableOpacity>
                ) : null}

                <View style={styles.heroBanner}>
                    <IconWrap name={cat.icon} variant="tinted" size="xl" />
                    <Text style={styles.heroTitle}>{record.title}</Text>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{cat.label}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t('patient.recordInfo')}</Text>

                    <View style={styles.infoRow}>
                        <IconWrap name="calendar-outline" variant="outlined" size="sm" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>{t('common.date')}</Text>
                            <Text style={styles.infoValue}>{dateStr}</Text>
                        </View>
                    </View>

                    {record.doctor ? (
                        <View style={styles.infoRow}>
                            <IconWrap name="doctor" variant="outlined" size="sm" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Doctor</Text>
                                <Text style={styles.infoValue}>{record.doctor}</Text>
                            </View>
                        </View>
                    ) : null}

                    {record.hospital ? (
                        <View style={styles.infoRow}>
                            <IconWrap name="hospital-building" variant="outlined" size="sm" />
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
                                <IconWrap name="file-outline" variant="outlined" size="sm" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>{t('patient.fileType')}</Text>
                                    <Text style={styles.infoValue}>{record.fileType.toUpperCase()}</Text>
                                </View>
                            </View>
                        ) : null}
                        {record.fileSize ? (
                            <View style={styles.infoRow}>
                                <IconWrap name="database-outline" variant="outlined" size="sm" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>{t('patient.fileSize')}</Text>
                                    <Text style={styles.infoValue}>{formatFileSize(record.fileSize)}</Text>
                                </View>
                            </View>
                        ) : null}
                        {record.fileUrl ? (
                            <View style={styles.infoRow}>
                                <IconWrap name="link-variant" variant="outlined" size="sm" />
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
                        <IconWrap
                            name={record.isSharedWithDoctor ? 'share-variant' : 'share-variant-outline'}
                            variant={record.isSharedWithDoctor ? 'success' : 'outlined'}
                            size="sm"
                        />
                        <View style={styles.shareInfo}>
                            <Text style={styles.shareTitle}>{t('patient.sharedWithDoctors')}</Text>
                            <Text style={styles.shareSubtitle}>
                                {record.isSharedWithDoctor
                                    ? 'This record is visible to your treating doctors'
                                    : 'This record is private and not shared'}
                            </Text>
                        </View>
                        <View style={[styles.shareStatus, record.isSharedWithDoctor ? styles.shareStatusOn : styles.shareStatusOff]}>
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
    fileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginTop: spacing.sm,
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    fileIconWrap: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
    },
    fileTextWrap: { flex: 1 },
    fileBtnTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
    fileBtnSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
    heroBanner: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
    heroTitle: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
    categoryBadge: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: borderRadius.xl, backgroundColor: colors.primaryLight },
    categoryBadgeText: { fontSize: 13, fontWeight: '600', color: colors.primary },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm, gap: spacing.md },
    infoContent: { flex: 1, paddingTop: 4 },
    infoLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
    infoValue: { ...typography.body, color: colors.textPrimary, fontWeight: '500' },
    descriptionText: { ...typography.body, color: colors.textPrimary, lineHeight: 24 },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tag: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.primaryLight, borderRadius: borderRadius.xl },
    tagText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
    shareRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    shareInfo: { flex: 1 },
    shareTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    shareSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    shareStatus: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 12 },
    shareStatusOn: { backgroundColor: colors.successLight },
    shareStatusOff: { backgroundColor: colors.borderLight },
    shareStatusText: { fontSize: 11, fontWeight: '600' },
});

export default RecordDetailScreen;
