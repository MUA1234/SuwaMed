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
import client from '../../api/client';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const PrescriptionsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPrescriptions = async () => {
        try {
            const res = await client.get('/prescriptions');
            setPrescriptions(res.data?.data || res.data || []);
        } catch (err) {
            console.log('Prescriptions fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchPrescriptions(); }, []));

    const onRefresh = () => { setRefreshing(true); fetchPrescriptions(); };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('patient.myPrescriptions')}</Text>
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
                <Text style={styles.headerTitle}>{t('patient.myPrescriptions')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={prescriptions}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                renderItem={({ item }) => {
                    const doctorUser = item.doctorId?.userId;
                    const doctorName = doctorUser
                        ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`
                        : 'Unknown Doctor';
                    const dateStr = item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '';
                    const medCount = item.medications?.length || 0;

                    return (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => navigation.navigate('PrescriptionDetailScreen', { prescription: item })}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardLeft}>
                                <View style={styles.iconWrap}>
                                    <MaterialCommunityIcons name="prescription" size={24} color={colors.primary} />
                                </View>
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={styles.doctorName}>{doctorName}</Text>
                                {item.diagnosis ? (
                                    <Text style={styles.diagnosis} numberOfLines={1}>{item.diagnosis}</Text>
                                ) : null}
                                <View style={styles.cardFooter}>
                                    <Text style={styles.dateText}>{dateStr}</Text>
                                    <View style={styles.medBadge}>
                                        <MaterialCommunityIcons name="pill" size={12} color={colors.primary} />
                                        <Text style={styles.medBadgeText}>{medCount} medication{medCount !== 1 ? 's' : ''}</Text>
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
                        <Text style={styles.emptySubtitle}>{t('patient.prescriptionsAppearHere')}</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardLeft: { marginRight: spacing.md },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: { flex: 1 },
    doctorName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
    diagnosis: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
    dateText: { ...typography.caption, color: colors.textSecondary },
    medBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10, gap: 3 },
    medBadgeText: { fontSize: 11, fontWeight: '600', color: colors.primary },
    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
    emptySubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});

export default PrescriptionsScreen;
