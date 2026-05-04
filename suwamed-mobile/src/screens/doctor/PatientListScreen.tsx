import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as doctorApi from '../../api/doctor.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

type FilterTab = 'all' | 'recent' | 'frequent';

const PatientListScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPatients = async () => {
        try {
            const res = await doctorApi.getPatients();
            setPatients(res.data || []);
        } catch (err) {
            console.log('Patients fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchPatients(); }, []));

    const filteredPatients = patients
        .filter((p) => {
            const name = `${p.firstName} ${p.lastName}`.toLowerCase();
            return name.includes(searchQuery.toLowerCase());
        })
        .filter((p) => {
            if (activeTab === 'recent') {
                if (!p.lastAppointment?.date) return false;
                const daysAgo = (Date.now() - new Date(p.lastAppointment.date).getTime()) / (1000 * 60 * 60 * 24);
                return daysAgo <= 7;
            }
            if (activeTab === 'frequent') return (p.totalVisits || 0) >= 3;
            return true;
        });

    const tabs: { key: FilterTab; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'recent', label: 'Recent' },
        { key: 'frequent', label: 'Frequent' },
    ];

    const getInitials = (first: string, last: string) => `${first?.[0] || ''}${last?.[0] || ''}`;
    const initialsColors = [colors.primary, colors.secondary, colors.success, colors.warning, colors.primaryDark, colors.error];

    const getTimeAgo = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return '1 day ago';
        if (diff < 7) return `${diff} days ago`;
        if (diff < 30) return `${Math.floor(diff / 7)} week${Math.floor(diff / 7) > 1 ? 's' : ''} ago`;
        return `${Math.floor(diff / 30)} month${Math.floor(diff / 30) > 1 ? 's' : ''} ago`;
    };

    const renderPatient = ({ item, index }: { item: any; index: number }) => (
        <TouchableOpacity style={styles.patientCard} activeOpacity={0.7} onPress={() => navigation.navigate('PatientProfileScreen', { patientId: item._id, patient: item })}>
            <View style={[styles.avatar, { backgroundColor: initialsColors[index % initialsColors.length] + '20' }]}>
                <Text style={[styles.avatarText, { color: initialsColors[index % initialsColors.length] }]}>
                    {getInitials(item.firstName, item.lastName)}
                </Text>
            </View>
            <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.patientMeta}>
                    {item.gender === 'male' ? 'M' : item.gender === 'female' ? 'F' : ''} · {item.lastAppointment?.reason || 'No recent visit'}
                </Text>
                <View style={styles.patientFooter}>
                    <View style={styles.footerItem}>
                        <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.footerText}>{getTimeAgo(item.lastAppointment?.date)}</Text>
                    </View>
                    <View style={styles.footerItem}>
                        <MaterialCommunityIcons name="calendar-check" size={12} color={colors.textSecondary} />
                        <Text style={styles.footerText}>{item.totalVisits || 0} visits</Text>
                    </View>
                </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}><Text style={styles.heading}>{t('doctor.myPatients')}</Text></View>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.heading}>{t('doctor.myPatients')}</Text>
                <Text style={styles.count}>{patients.length} total</Text>
            </View>

            <View style={styles.searchWrap}>
                <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
                <TextInput style={styles.searchInput} placeholder="Search patients..." placeholderTextColor={colors.textDisabled} value={searchQuery} onChangeText={setSearchQuery} />
                {searchQuery ? <TouchableOpacity onPress={() => setSearchQuery('')}><MaterialCommunityIcons name="close-circle" size={18} color={colors.textDisabled} /></TouchableOpacity> : null}
            </View>

            <View style={styles.tabs}>
                {tabs.map((tab) => (
                    <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)} activeOpacity={0.7}>
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredPatients}
                renderItem={renderPatient}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="account-search" size={48} color={colors.textDisabled} />
                        <Text style={styles.emptyText}>{t('doctor.noPatientsFound')}</Text>
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
    count: { ...typography.bodySmall, color: colors.textSecondary },
    searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: spacing.xl, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
    searchInput: { flex: 1, paddingVertical: spacing.md, marginLeft: spacing.sm, ...typography.body, color: colors.textPrimary },
    tabs: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
    tab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { ...typography.bodySmall, fontWeight: '500', color: colors.textSecondary },
    tabTextActive: { color: '#fff', fontWeight: '600' },
    patientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
    avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    avatarText: { fontSize: 16, fontWeight: '700' },
    patientInfo: { flex: 1 },
    patientName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    patientMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    patientFooter: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { ...typography.caption, color: colors.textSecondary },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl * 2 },
    emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
});

export default PatientListScreen;
