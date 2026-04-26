import React, { useState } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as adminApi from '../../api/admin.api';
import { colors, spacing, borderRadius, typography } from '../../config/theme';
import { useTranslation } from 'react-i18next';

const DoctorVerificationScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const route = useRoute<any>();
    const { doctor } = route.params;
    const [processing, setProcessing] = useState(false);

    const userInfo = doctor?.userId || {};
    const name = `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim();

    const handleVerify = () => {
        Alert.alert('Confirm Verification', `Approve Dr. ${name} as a verified doctor?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Approve', onPress: async () => {
                    setProcessing(true);
                    try {
                        await adminApi.verifyDoctor(doctor._id);
                        Alert.alert('Success', 'Doctor verified successfully!', [
                            { text: 'OK', onPress: () => navigation.goBack() }
                        ]);
                    } catch {
                        Alert.alert('Error', 'Failed to verify doctor');
                    } finally {
                        setProcessing(false);
                    }
                }
            }
        ]);
    };

    const handleReject = () => {
        Alert.alert('Reject Application', `Reject Dr. ${name}'s application?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject', style: 'destructive', onPress: async () => {
                    setProcessing(true);
                    try {
                        await adminApi.rejectDoctor(doctor._id, 'Does not meet requirements');
                        Alert.alert('Done', 'Doctor application rejected', [
                            { text: 'OK', onPress: () => navigation.goBack() }
                        ]);
                    } catch {
                        Alert.alert('Error', 'Failed to reject');
                    } finally {
                        setProcessing(false);
                    }
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>{t('admin.doctorVerification')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {`${userInfo.firstName?.[0] || ''}${userInfo.lastName?.[0] || ''}`.toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.name}>Dr. {name}</Text>
                    <Text style={styles.email}>{userInfo.email}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{t('doctor.professionalInfo')}</Text>
                    <View style={styles.infoCard}>
                        {[
                            { label: 'SLMC Registration', value: doctor.slmcRegistrationNo },
                            { label: 'Specialization', value: doctor.specialization?.join(', ') || 'N/A' },
                            { label: 'Experience', value: doctor.experience ? `${doctor.experience} years` : 'N/A' },
                            { label: 'Hospital', value: doctor.hospital || 'N/A' },
                            { label: 'Consultation Fee', value: doctor.consultationFee ? `LKR ${doctor.consultationFee}` : 'N/A' },
                        ].map((row, i) => (
                            <View key={i} style={[styles.infoRow, i > 0 && styles.infoRowBorder]}>
                                <Text style={styles.infoLabel}>{row.label}</Text>
                                <Text style={styles.infoValue}>{row.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {doctor.qualifications?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>{t('doctor.qualifications')}</Text>
                        <View style={styles.infoCard}>
                            {doctor.qualifications.map((q: any, i: number) => (
                                <View key={i} style={[styles.qualRow, i > 0 && styles.infoRowBorder]}>
                                    <MaterialCommunityIcons name="school" size={16} color={colors.primary} />
                                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                                        <Text style={styles.qualDegree}>{q.degree}</Text>
                                        <Text style={styles.qualInst}>{q.institution}{q.year ? ` (${q.year})` : ''}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {doctor.bio && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>{t('doctor.bio')}</Text>
                        <View style={styles.bioCard}>
                            <Text style={styles.bioText}>{doctor.bio}</Text>
                        </View>
                    </View>
                )}

                {doctor.verificationStatus === 'pending' && (
                    <View style={styles.actionSection}>
                        <TouchableOpacity
                            style={[styles.approveBtn, processing && { opacity: 0.6 }]}
                            onPress={handleVerify}
                            disabled={processing}
                        >
                            <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                            <Text style={styles.approveBtnText}>{t('admin.approveAndVerify')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.rejectBtn, processing && { opacity: 0.6 }]}
                            onPress={handleReject}
                            disabled={processing}
                        >
                            <MaterialCommunityIcons name="close-circle" size={20} color={colors.error} />
                            <Text style={styles.rejectBtnText}>{t('admin.rejectApplication')}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {doctor.verificationStatus !== 'pending' && (
                    <View style={[styles.statusBanner, {
                        backgroundColor: doctor.verificationStatus === 'verified' ? '#ECFDF5' : '#FEF2F2'
                    }]}>
                        <MaterialCommunityIcons
                            name={doctor.verificationStatus === 'verified' ? 'check-circle' : 'close-circle'}
                            size={24}
                            color={doctor.verificationStatus === 'verified' ? colors.success : colors.error}
                        />
                        <Text style={[styles.statusText, {
                            color: doctor.verificationStatus === 'verified' ? colors.success : colors.error
                        }]}>
                            {doctor.verificationStatus === 'verified' ? 'Doctor Verified' : 'Application Rejected'}
                        </Text>
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
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 28 },
    name: { ...typography.h3, color: colors.textPrimary },
    email: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
    section: { marginBottom: spacing.lg },
    sectionLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
    infoCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
    infoRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    infoLabel: { ...typography.bodySmall, color: colors.textSecondary },
    infoValue: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary, maxWidth: '60%', textAlign: 'right' },
    qualRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm },
    qualDegree: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary },
    qualInst: { ...typography.caption, color: colors.textSecondary },
    bioCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
    bioText: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
    actionSection: { gap: spacing.md, marginBottom: spacing.xxl },
    approveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success, borderRadius: borderRadius.md, paddingVertical: spacing.lg, gap: spacing.sm },
    approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    rejectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderRadius: borderRadius.md, paddingVertical: spacing.lg, borderWidth: 1, borderColor: '#FECACA', gap: spacing.sm },
    rejectBtnText: { color: colors.error, fontWeight: '700', fontSize: 16 },
    statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.md, padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.xxl },
    statusText: { ...typography.body, fontWeight: '700' },
});

export default DoctorVerificationScreen;
