import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as doctorApi from '../../api/doctor.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { pickImage, takePhoto } from '../../utils/permissions';

const DOC_TYPES: { key: string; label: string; icon: string }[] = [
    { key: 'slmc_certificate', label: 'SLMC Certificate', icon: 'certificate' },
    { key: 'degree', label: 'Medical Degree', icon: 'school' },
    { key: 'nic', label: 'National ID (NIC)', icon: 'card-account-details' },
    { key: 'other', label: 'Other Document', icon: 'file-document' },
];

const getStatusConfig = (colors: ThemeColors): Record<string, { icon: string; bg: string; color: string; title: string; subtitle: string }> => ({
    pending: {
        icon: 'timer-sand',
        bg: colors.warningLight,
        color: colors.warning,
        title: 'Verification Pending',
        subtitle: 'Your application is being reviewed. This typically takes 1-3 business days.',
    },
    under_review: {
        icon: 'magnify',
        bg: colors.primaryLight,
        color: colors.primary,
        title: 'Under Review',
        subtitle: 'Our team is currently reviewing your documents and credentials.',
    },
    verified: {
        icon: 'shield-check',
        bg: colors.successLight,
        color: colors.success,
        title: 'Verified Doctor',
        subtitle: 'Your account is fully verified. Patients can now book consultations with you.',
    },
    rejected: {
        icon: 'close-circle',
        bg: colors.errorLight,
        color: colors.error,
        title: 'Not Verified',
        subtitle: 'Your application was not approved. Please contact support for more information.',
    },
});

const VerificationScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [doctor, setDoctor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await doctorApi.getDoctorProfile();
            const data = res.data || res;
            setDoctor(data.doctor || data);
        } catch (err) {
            console.log('Profile fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchProfile(); }, []));

    const promptForType = (): Promise<string | null> =>
        new Promise((resolve) => {
            Alert.alert('Document Type', 'What kind of document is this?', [
                ...DOC_TYPES.map((d) => ({ text: d.label, onPress: () => resolve(d.key) })),
                { text: 'Cancel', style: 'cancel' as const, onPress: () => resolve(null) },
            ]);
        });

    const uploadDocument = async (uri: string, type: string) => {
        setUploading(true);
        try {
            const filename = uri.split('/').pop() || `verification-${Date.now()}.jpg`;
            const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
            const mime = ext === 'pdf' ? 'application/pdf' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            const form = new FormData();
            form.append('documents', { uri, name: filename, type: mime } as any);
            form.append('types', JSON.stringify([type]));
            const res = await doctorApi.uploadVerificationDocuments(form);
            const updated = res?.data;
            if (updated) {
                setDoctor((prev: any) => ({
                    ...(prev || {}),
                    verificationDocuments: updated.verificationDocuments,
                    verificationStatus: updated.verificationStatus,
                }));
            } else {
                await fetchProfile();
            }
            Alert.alert('Uploaded', 'Document uploaded for review.');
        } catch (err: any) {
            Alert.alert('Upload Failed', err?.response?.data?.message || 'Could not upload document.');
        } finally {
            setUploading(false);
        }
    };

    const handleUploadDocument = async () => {
        const type = await promptForType();
        if (!type) return;
        Alert.alert('Add Document', 'Pick a source', [
            {
                text: 'Camera',
                onPress: async () => {
                    const uri = await takePhoto();
                    if (uri) await uploadDocument(uri, type);
                },
            },
            {
                text: 'Gallery',
                onPress: async () => {
                    const uri = await pickImage();
                    if (uri) await uploadDocument(uri, type);
                },
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Verification Status</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    const status = doctor?.verificationStatus || 'pending';
    const statusConfig = getStatusConfig(colors);
    const config = statusConfig[status] || statusConfig.pending;
    const slmcNumber = doctor?.slmcRegistrationNumber || 'N/A';
    const verifiedDate = doctor?.verifiedAt
        ? new Date(doctor.verifiedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null;
    const documents: any[] = doctor?.verificationDocuments || [];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verification Status</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.statusCard, { backgroundColor: config.bg, borderColor: config.color + '30' }]}>
                    <View style={[styles.statusIconWrap, { backgroundColor: config.color + '20' }]}>
                        <MaterialCommunityIcons name={config.icon as any} size={48} color={config.color} />
                    </View>
                    <Text style={[styles.statusTitle, { color: config.color }]}>{config.title}</Text>
                    <Text style={styles.statusSubtitle}>{config.subtitle}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
                        <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                        <Text style={[styles.statusBadgeText, { color: config.color }]}>
                            {status.replace('_', ' ').toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t('doctor.registrationDetails')}</Text>
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconWrap}>
                            <MaterialCommunityIcons name="card-account-details" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>{t('doctor.slmcRegistrationNumber')}</Text>
                            <Text style={styles.slmcNumber}>{slmcNumber}</Text>
                        </View>
                    </View>
                    {verifiedDate ? (
                        <View style={[styles.infoRow, { marginTop: spacing.md }]}>
                            <View style={styles.infoIconWrap}>
                                <MaterialCommunityIcons name="calendar-check" size={18} color={colors.success} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>{t('doctor.verifiedOn')}</Text>
                                <Text style={styles.infoValue}>{verifiedDate}</Text>
                            </View>
                        </View>
                    ) : null}
                </View>

                {documents.length > 0 ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{t('doctor.submittedDocuments')}</Text>
                        {documents.map((doc: any, index: number) => {
                            const uploadedStr = doc.uploadedAt
                                ? new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : '';
                            return (
                                <View
                                    key={index}
                                    style={[styles.docRow, index < documents.length - 1 && styles.docRowBorder]}
                                >
                                    <View style={styles.docIconWrap}>
                                        <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.primary} />
                                    </View>
                                    <View style={styles.docContent}>
                                        <Text style={styles.docType}>
                                            {doc.type
                                                ? doc.type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                                                : 'Document'}
                                        </Text>
                                        {uploadedStr ? (
                                            <Text style={styles.docDate}>Uploaded {uploadedStr}</Text>
                                        ) : null}
                                    </View>
                                    <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                                </View>
                            );
                        })}
                    </View>
                ) : null}

                {status !== 'verified' ? (
                    <TouchableOpacity
                        style={styles.uploadBtn}
                        onPress={handleUploadDocument}
                        activeOpacity={0.85}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="cloud-upload" size={20} color="#fff" />
                                <Text style={styles.uploadBtnText}>Upload Document</Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : null}

                {(status === 'pending' || status === 'rejected') ? (
                    <TouchableOpacity
                        style={styles.supportBtn}
                        onPress={() => Alert.alert('Contact Support', 'Email us at: support@suwamed.lk\n\nOur team will respond within 24 hours.')}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="headset" size={20} color={colors.primary} />
                        <Text style={styles.supportBtnText}>{t('common.contactSupport')}</Text>
                    </TouchableOpacity>
                ) : null}
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
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    statusCard: {
        borderRadius: borderRadius.xl,
        padding: spacing.xxl,
        alignItems: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
        borderWidth: 1,
    },
    statusIconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
    statusTitle: { fontSize: 22, fontWeight: '700', marginBottom: spacing.sm, textAlign: 'center' },
    statusSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: spacing.lg },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.xl, gap: spacing.xs },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    infoContent: { flex: 1 },
    infoLabel: { ...typography.caption, color: colors.textSecondary },
    infoValue: { ...typography.body, fontWeight: '500', color: colors.textPrimary, marginTop: 2 },
    slmcNumber: { fontSize: 18, fontWeight: '700', color: colors.primary, marginTop: 2, letterSpacing: 1 },
    docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
    docRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    docIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    docContent: { flex: 1 },
    docType: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary },
    docDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    supportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EBF5FF',
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        gap: spacing.sm,
        marginTop: spacing.sm,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    supportBtnText: { ...typography.body, fontWeight: '600', color: colors.primary },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    uploadBtnText: { color: '#fff', ...typography.body, fontWeight: '600' },
});

export default VerificationScreen;
