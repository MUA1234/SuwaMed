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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { colors, spacing, borderRadius, typography } from '../../config/theme';
import { useTranslation } from 'react-i18next';

const PrescriptionHistoryScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const route = useRoute<any>();
    const { patientId, patientName } = route.params || {};

    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPrescriptions = async () => {
        try {
            const params: any = {};
            if (patientId) params.patientId = patientId;
            const res = await client.get('/prescriptions', { params });
            setPrescriptions(res.data?.data || res.data || []);
        } catch (err) {
            console.log('Prescription history fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchPrescriptions(); }, []));

    const onRefresh = () => { setRefreshing(true); fetchPrescriptions(); };

    const handlePrescriptionPress = (item: any) => {
        const patientUser = item.patientId?.userId || item.patientId;
        const pName = patientUser
            ? `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim()
            : 'Patient';
        const meds = (item.medications || []).map((m: any) => `• ${m.name} ${m.dosage || ''} - ${m.frequency || ''}`).join('\n');
        Alert.alert(
            `Prescription - ${pName}`,
            `Diagnosis: ${item.diagnosis || 'N/A'}\n\nMedications:\n${meds || 'None'}\n\nDate: ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}`
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('doctor.prescriptionHistory')}</Text>
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
                <Text style={styles.headerTitle}>{t('doctor.prescriptionHistory')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {patientName ? (
                <View style={styles.subtitleRow}>
                    <MaterialCommunityIcons name="account" size={14} color={colors.textSecondary} />
                    <Text style={styles.subtitle}>Patient: {patientName}</Text>
                </View>
            ) : null}

            <FlatList
                data={prescriptions}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                renderItem={({ item }) => {
                    const patientUser = item.patientId?.userId || item.patientId;
                    const pName = patientUser
                        ? `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim()
                        : 'Patient';
                    const dateStr = item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '';
                    const medCount = item.medications?.length || 0;

                    return (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => handlePrescriptionPress(item)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardIcon}>
                                <MaterialCommunityIcons name="prescription" size={22} color={colors.primary} />
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={styles.patientName}>{pName}</Text>
                                {item.diagnosis ? (
                                    <Text style={styles.diagnosis} numberOfLines={1}>{item.diagnosis}</Text>
                                ) : null}
                                <View style={styles.cardFooter}>
                                    <Text style={styles.dateText}>{dateStr}</Text>
                                    <View style={styles.medBadge}>
                                        <MaterialCommunityIcons name="pill" size={12} color={colors.primary} />
                                        <Text style={styles.medBadgeText}>{medCount} med{medCount !== 1 ? 's' : ''}</Text>
                                    </View>
                                </View>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="prescription" size={56} color={colors.textDisabled} />
                        <Text style={styles.emptyTitle}>{t('patient.noPrescriptionsYet')}</Text>
                        <Text style={styles.emptySubtitle}>
                            {patientName
                                ? `No prescriptions issued for ${patientName}`
                                : 'Your issued prescriptions will appear here'}
                        </Text>
                    </View>
                }
            />
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
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
        gap: spacing.xs,
    },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '500' },
    listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    cardContent: { flex: 1 },
    patientName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
    diagnosis: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
    dateText: { ...typography.caption, color: colors.textSecondary },
    medBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF5FF', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10, gap: 3 },
    medBadgeText: { fontSize: 11, fontWeight: '600', color: colors.primary },
    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
    emptySubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});

export default PrescriptionHistoryScreen;
