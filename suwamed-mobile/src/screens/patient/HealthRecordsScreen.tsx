import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as healthRecordApi from '../../api/healthRecord.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import IconWrap from '../../components/common/IconWrap';
import { useTranslation } from 'react-i18next';

type TabKey = 'all' | 'prescription' | 'lab_report' | 'imaging' | 'other';

const categoryIcons: Record<string, string> = {
    prescription: 'prescription',
    lab_report: 'test-tube',
    imaging: 'radiology-box',
    vaccination: 'needle',
    discharge_summary: 'file-document-outline',
    other: 'file-document-outline',
};

const HealthRecordsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRecords = async () => {
        try {
            const params = activeTab !== 'all' ? { category: activeTab } : {};
            const res = await healthRecordApi.getHealthRecords(params);
            setRecords(res.data || []);
        } catch (err) {
            console.log('Records fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchRecords(); }, [activeTab]));
    const onRefresh = () => { setRefreshing(true); fetchRecords(); };

    const tabs: { key: TabKey; label: string; icon: string }[] = [
        { key: 'all', label: 'All', icon: 'format-list-bulleted' },
        { key: 'prescription', label: 'Prescriptions', icon: 'prescription' },
        { key: 'lab_report', label: 'Lab Reports', icon: 'test-tube' },
        { key: 'imaging', label: 'Imaging', icon: 'radiology-box' },
        { key: 'other', label: 'Other', icon: 'file-document' },
    ];

    const categoryCounts = {
        prescription: records.filter(r => r.category === 'prescription').length,
        lab_report: records.filter(r => r.category === 'lab_report').length,
        other: records.filter(r => !['prescription', 'lab_report'].includes(r.category)).length,
    };

    const stats = [
        { label: 'Prescriptions', value: categoryCounts.prescription },
        { label: 'Lab Reports', value: categoryCounts.lab_report },
        { label: 'Other', value: categoryCounts.other },
    ];

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}><Text style={styles.heading}>{t('patient.healthRecords')}</Text></View>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.heading}>{t('patient.healthRecords')}</Text>
                <TouchableOpacity style={styles.uploadBtn} activeOpacity={0.7} onPress={() => navigation.navigate('UploadRecordScreen')}>
                    <MaterialCommunityIcons name="cloud-upload" size={18} color="#fff" />
                    <Text style={styles.uploadText}>Upload</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
                {stats.map((stat, i) => (
                    <View key={i} style={styles.statCard}>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
                {tabs.map((tab) => (
                    <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)} activeOpacity={0.7}>
                        <MaterialCommunityIcons name={tab.icon as any} size={16} color={activeTab === tab.key ? '#fff' : colors.textSecondary} />
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <FlatList
                data={records}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                renderItem={({ item }) => {
                    const catIcon = categoryIcons[item.category] || categoryIcons.other;
                    const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                    return (
                        <TouchableOpacity style={styles.recordCard} activeOpacity={0.7} onPress={() => navigation.navigate('RecordDetailScreen', { record: item })}>
                            <IconWrap name={catIcon} variant="tinted" size="md" />
                            <View style={styles.recordInfo}>
                                <Text style={styles.recordTitle}>{item.title}</Text>
                                <Text style={styles.recordDate}>{dateStr}{item.doctor ? ` · ${item.doctor}` : ''}</Text>
                            </View>
                            <MaterialCommunityIcons name="download" size={20} color={colors.textDisabled} />
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="folder-open" size={48} color={colors.textDisabled} />
                        <Text style={styles.emptyText}>{t('patient.noRecordsFound')}</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
    heading: { ...typography.h2, color: colors.textPrimary },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.xl, gap: spacing.xs },
    uploadText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    statsRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.lg },
    statCard: { flex: 1, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    statValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
    statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    tabsRow: { paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.lg },
    tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 4 },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { ...typography.caption, fontWeight: '500', color: colors.textSecondary },
    tabTextActive: { color: '#fff', fontWeight: '600' },
    recordCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.sm, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
    recordInfo: { flex: 1 },
    recordTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    recordDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    empty: { alignItems: 'center', paddingVertical: spacing.xxxl * 2 },
    emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
});

export default HealthRecordsScreen;
