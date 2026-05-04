import React, { useState, useCallback } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, FlatList,
    TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as adminApi from '../../api/admin.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const PendingDoctorsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDoctors = async () => {
        try {
            const res = await adminApi.getPendingDoctors();
            setDoctors(res.data || []);
        } catch (err) {
            console.log('Pending doctors error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchDoctors(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchDoctors(); };

    const handleVerify = (doctorId: string, name: string) => {
        Alert.alert('Verify Doctor', `Approve Dr. ${name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Approve', onPress: async () => {
                    try {
                        await adminApi.verifyDoctor(doctorId);
                        Alert.alert('Success', 'Doctor verified successfully');
                        fetchDoctors();
                    } catch { Alert.alert('Error', 'Failed to verify'); }
                }
            }
        ]);
    };

    const handleReject = (doctorId: string, name: string) => {
        Alert.alert('Reject Doctor', `Reject Dr. ${name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject', style: 'destructive', onPress: async () => {
                    try {
                        await adminApi.rejectDoctor(doctorId, 'Does not meet requirements');
                        Alert.alert('Done', 'Doctor rejected');
                        fetchDoctors();
                    } catch { Alert.alert('Error', 'Failed to reject'); }
                }
            }
        ]);
    };

    const renderDoctor = ({ item }: { item: any }) => {
        const userInfo = item.userId || {};
        const name = `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim();
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('DoctorVerificationScreen', { doctorId: item._id, doctor: item })}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {`${userInfo.firstName?.[0] || ''}${userInfo.lastName?.[0] || ''}`.toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.docInfo}>
                        <Text style={styles.docName}>Dr. {name}</Text>
                        <Text style={styles.docSpec}>{item.specialization?.join(', ') || 'N/A'}</Text>
                        <Text style={styles.slmc}>SLMC: {item.slmcRegistrationNo}</Text>
                    </View>
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>{t('common.pending')}</Text>
                    </View>
                </View>
                <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>
                        Joined {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleVerify(item._id, name)}>
                        <MaterialCommunityIcons name="check" size={16} color="#fff" />
                        <Text style={styles.approveBtnText}>{t('common.approve')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item._id, name)}>
                        <MaterialCommunityIcons name="close" size={16} color={colors.error} />
                        <Text style={styles.rejectBtnText}>{t('common.reject')}</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>{t('admin.pendingVerifications')}</Text>
                <View style={[styles.countBadge, doctors.length > 0 && styles.countBadgeAlert]}>
                    <Text style={[styles.countText, doctors.length > 0 && styles.countTextAlert]}>{doctors.length}</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={doctors}
                    renderItem={renderDoctor}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="check-all" size={56} color={colors.success} />
                            <Text style={styles.emptyTitle}>All Clear!</Text>
                            <Text style={styles.emptyText}>{t('admin.noPendingVerifications')}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md, gap: spacing.md },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    title: { flex: 1, ...typography.h3, color: colors.textPrimary },
    countBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
    countBadgeAlert: { backgroundColor: colors.errorLight },
    countText: { fontWeight: '700', fontSize: 12, color: colors.textSecondary },
    countTextAlert: { color: colors.error },
    list: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    docInfo: { flex: 1 },
    docName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    docSpec: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
    slmc: { ...typography.caption, color: colors.textDisabled, marginTop: 1 },
    pendingBadge: { backgroundColor: colors.warningLight, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10 },
    pendingText: { fontSize: 11, fontWeight: '600', color: colors.warning },
    cardFooter: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.sm, marginBottom: spacing.sm },
    dateText: { ...typography.caption, color: colors.textSecondary },
    actions: { flexDirection: 'row', gap: spacing.md },
    approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success, borderRadius: borderRadius.sm, paddingVertical: spacing.sm, gap: 4 },
    approveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.errorLight, borderRadius: borderRadius.sm, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.error + '33', gap: 4 },
    rejectBtnText: { color: colors.error, fontWeight: '600', fontSize: 14 },
    empty: { alignItems: 'center', paddingVertical: spacing.xxxl * 2 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
    emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});

export default PendingDoctorsScreen;
