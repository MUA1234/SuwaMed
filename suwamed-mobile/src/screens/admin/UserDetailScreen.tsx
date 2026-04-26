import React, { useState, useCallback } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import * as adminApi from '../../api/admin.api';
import { colors, spacing, borderRadius, typography } from '../../config/theme';
import { useTranslation } from 'react-i18next';

const UserDetailScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const route = useRoute<any>();
    const { userId } = route.params;
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    const fetchUser = async () => {
        try {
            const res = await adminApi.getUserById(userId);
            setUserData(res.data);
        } catch (err) {
            console.log('User detail error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchUser(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchUser(); };

    const handleVerifyDoctor = () => {
        Alert.alert('Verify Doctor', 'Approve this doctor?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Verify', onPress: async () => {
                    try {
                        await adminApi.verifyDoctor(userData?.roleData?._id);
                        Alert.alert('Success', 'Doctor verified');
                        fetchUser();
                    } catch { Alert.alert('Error', 'Failed to verify'); }
                }
            }
        ]);
    };

    const handleRejectDoctor = () => {
        Alert.alert('Reject Doctor', 'Reject this doctor?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject', style: 'destructive', onPress: async () => {
                    try {
                        await adminApi.rejectDoctor(userData?.roleData?._id, 'Rejected by admin');
                        Alert.alert('Done', 'Doctor rejected');
                        fetchUser();
                    } catch { Alert.alert('Error', 'Failed to reject'); }
                }
            }
        ]);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    const user = userData?.user || {};
    const roleData = userData?.roleData || {};
    const roleColors: Record<string, string> = { patient: '#1A73E8', doctor: '#10B981', admin: '#8B5CF6' };
    const roleColor = roleColors[user.role] || '#6B7280';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>{t('admin.userDetails')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                <View style={styles.profileCard}>
                    <View style={[styles.avatar, { backgroundColor: roleColor }]}>
                        <Text style={styles.avatarText}>
                            {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: roleColor + '15' }]}>
                        <Text style={[styles.roleText, { color: roleColor }]}>{user.role}</Text>
                    </View>
                    {user.isVerified && (
                        <View style={styles.verifiedRow}>
                            <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />
                            <Text style={styles.verifiedText}>{t('common.verifiedAccount')}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact</Text>
                    <View style={styles.infoCard}>
                        {user.email && (
                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="email-outline" size={18} color={colors.textSecondary} />
                                <Text style={styles.infoText}>{user.email}</Text>
                            </View>
                        )}
                        {user.phone && (
                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="phone-outline" size={18} color={colors.textSecondary} />
                                <Text style={styles.infoText}>{user.phone}</Text>
                            </View>
                        )}
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.textSecondary} />
                            <Text style={styles.infoText}>Joined {new Date(user.createdAt).toLocaleDateString()}</Text>
                        </View>
                    </View>
                </View>

                {user.role === 'doctor' && roleData && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('patient.doctorInfo')}</Text>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="stethoscope" size={18} color={colors.textSecondary} />
                                <Text style={styles.infoText}>{roleData.specialization?.join(', ') || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="card-account-details" size={18} color={colors.textSecondary} />
                                <Text style={styles.infoText}>SLMC: {roleData.slmcRegistrationNo || 'N/A'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.textSecondary} />
                                <Text style={styles.infoText}>Status: {roleData.verificationStatus}</Text>
                            </View>
                        </View>

                        {roleData.verificationStatus === 'pending' && (
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyDoctor}>
                                    <MaterialCommunityIcons name="check" size={18} color="#fff" />
                                    <Text style={styles.verifyBtnText}>{t('admin.verify')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.rejectBtn} onPress={handleRejectDoctor}>
                                    <MaterialCommunityIcons name="close" size={18} color={colors.error} />
                                    <Text style={styles.rejectBtnText}>{t('common.reject')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    title: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    scroll: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    profileCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xxl, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
    avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 24 },
    name: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
    roleBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.xl },
    roleText: { ...typography.bodySmall, fontWeight: '600', textTransform: 'capitalize' },
    verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
    verifiedText: { ...typography.caption, color: colors.success },
    section: { marginBottom: spacing.lg },
    sectionTitle: { ...typography.bodySmall, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
    infoCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
    infoText: { ...typography.body, color: colors.textPrimary },
    actionRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    verifyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success, borderRadius: borderRadius.md, paddingVertical: spacing.md, gap: spacing.xs },
    verifyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderRadius: borderRadius.md, paddingVertical: spacing.md, borderWidth: 1, borderColor: '#FECACA', gap: spacing.xs },
    rejectBtnText: { color: colors.error, fontWeight: '600', fontSize: 14 },
});

export default UserDetailScreen;
