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
    ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { colors, spacing, borderRadius, typography } from '../../config/theme';
import { useTranslation } from 'react-i18next';

type FilterKey = 'all' | 'lab_report' | 'prescription' | 'imaging' | 'vaccination';

const categoryIcons: Record<string, { icon: string; color: string; label: string }> = {
    lab_report: { icon: 'flask', color: '#3B82F6', label: 'Lab Report' },
    prescription: { icon: 'pill', color: '#10B981', label: 'Prescription' },
    imaging: { icon: 'radioactive', color: '#8B5CF6', label: 'Imaging' },
    vaccination: { icon: 'needle', color: '#F59E0B', label: 'Vaccination' },
    discharge_summary: { icon: 'hospital', color: '#EC4899', label: 'Discharge Summary' },
    other: { icon: 'file-document', color: '#6B7280', label: 'Other' },
};

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'lab_report', label: 'Lab Reports' },
    { key: 'prescription', label: 'Prescriptions' },
    { key: 'imaging', label: 'Imaging' },
    { key: 'vaccination', label: 'Vaccinations' },
];

const PatientHealthRecordsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const route = useRoute<any>();
    const { patientId, patientName } = route.params;

    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

    const fetchRecords = async () => {
        try {
            const params: any = {};
            if (activeFilter !== 'all') params.category = activeFilter;
            const res = await client.get(`/doctors/patients/${patientId}/health-records`, { params });
            setRecords(res.data?.data || res.data || []);
        } catch (err) {
            console.log('Health records fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchRecords(); }, [activeFilter]));

    const onRefresh = () => { setRefreshing(true); fetchRecords(); };

    const filteredRecords = activeFilter === 'all'
        ? records
        : records.filter((r) => r.category === activeFilter);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.healthRecords')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {patientName ? (
                <View style={styles.infoBanner}>
                    <MaterialCommunityIcons name="account" size={16} color={colors.primary} />
                    <Text style={styles.infoBannerText}>
                        Showing records shared by {patientName}
                    </Text>
                </View>
            ) : (
                <View style={styles.infoBanner}>
                    <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary} />
                    <Text style={styles.infoBannerText}>Showing records shared by this patient</Text>
                </View>
            )}

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersRow}
            >
                {FILTERS.map((filter) => (
                    <TouchableOpacity
                        key={filter.key}
                        style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
                        onPress={() => setActiveFilter(filter.key)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={filteredRecords}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                    renderItem={({ item }) => {
                        const cat = categoryIcons[item.category] || categoryIcons.other;
                        const dateStr = item.date
                            ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '';
                        return (
                            <View style={styles.recordCard}>
                                <View style={[styles.recordIcon, { backgroundColor: cat.color + '15' }]}>
                                    <MaterialCommunityIcons name={cat.icon as any} size={22} color={cat.color} />
                                </View>
                                <View style={styles.recordContent}>
                                    <Text style={styles.recordTitle}>{item.title}</Text>
                                    <Text style={styles.recordMeta}>
                                        {cat.label}
                                        {dateStr ? ` · ${dateStr}` : ''}
                                        {item.doctor ? ` · ${item.doctor}` : ''}
                                    </Text>
                                </View>
                                <View style={[styles.sharedBadge, { backgroundColor: item.isSharedWithDoctor ? '#ECFDF5' : '#F3F4F6' }]}>
                                    <MaterialCommunityIcons
                                        name={item.isSharedWithDoctor ? 'share-variant' : 'lock'}
                                        size={12}
                                        color={item.isSharedWithDoctor ? colors.success : colors.textDisabled}
                                    />
                                </View>
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="folder-open-outline" size={56} color={colors.textDisabled} />
                            <Text style={styles.emptyTitle}>{t('patient.noRecordsFound')}</Text>
                            <Text style={styles.emptySubtitle}>No shared health records for this category</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
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
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF5FF',
        marginHorizontal: spacing.xl,
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.md,
        gap: spacing.xs,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    infoBannerText: { ...typography.caption, color: colors.primary, fontWeight: '500', flex: 1 },
    filtersRow: { paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.xs },
    filterChip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
    filterTextActive: { color: '#fff', fontWeight: '600' },
    listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    recordCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    recordIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    recordContent: { flex: 1 },
    recordTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    recordMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    sharedBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm },
    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
    emptySubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});

export default PatientHealthRecordsScreen;
