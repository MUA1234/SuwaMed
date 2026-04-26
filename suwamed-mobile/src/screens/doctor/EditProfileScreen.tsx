import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as doctorApi from '../../api/doctor.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { pickImage, takePhoto } from '../../utils/permissions';

const LANGUAGES = ['English', 'Sinhala', 'Tamil'];

const EditProfileScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [bio, setBio] = useState('');
    const [hospital, setHospital] = useState('');
    const [clinicAddress, setClinicAddress] = useState('');
    const [consultationFee, setConsultationFee] = useState('');
    const [followUpFee, setFollowUpFee] = useState('');
    const [languages, setLanguages] = useState<string[]>([]);
    const [bankName, setBankName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');

    const [initials, setInitials] = useState('DR');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const { updateUser } = useAuthStore();

    const fetchProfile = async () => {
        try {
            const res = await doctorApi.getDoctorProfile();
            const data = res.data || res;
            const doctor = data.doctor || data;
            const userInfo = doctor.userId || {};

            const first = (userInfo.firstName || '?')[0];
            const last = (userInfo.lastName || '?')[0];
            setInitials(`${first}${last}`.toUpperCase());
            setAvatarUri(userInfo.avatar || null);

            setBio(doctor.bio || '');
            setHospital(doctor.hospital || '');
            setClinicAddress(doctor.clinicAddress || '');
            setConsultationFee(doctor.consultationFee ? String(doctor.consultationFee) : '');
            setFollowUpFee(doctor.followUpFee ? String(doctor.followUpFee) : '');
            setLanguages(doctor.languages || []);

            const bank = doctor.bankDetails || {};
            setBankName(bank.bankName || '');
            setBranchName(bank.branchName || '');
            setAccountNumber(bank.accountNumber || '');
            setAccountHolderName(bank.accountHolderName || '');
        } catch (err) {
            console.log('Profile fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchProfile(); }, []));

    const toggleLanguage = (lang: string) => {
        setLanguages((prev) =>
            prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
        );
    };

    const uploadAvatarFromUri = async (uri: string) => {
        setAvatarUploading(true);
        try {
            const filename = uri.split('/').pop() || `avatar-${Date.now()}.jpg`;
            const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
            const mime = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            const form = new FormData();
            form.append('avatar', { uri, name: filename, type: mime } as any);
            const res = await doctorApi.uploadAvatar(form);
            const url = res?.data?.avatar || uri;
            setAvatarUri(url);
            updateUser({ avatar: url } as any);
            Alert.alert('Avatar Updated', 'Your photo has been updated.');
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to upload avatar.');
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleAvatarTap = () => {
        Alert.alert('Profile Photo', 'Pick a source', [
            {
                text: 'Camera',
                onPress: async () => {
                    const uri = await takePhoto();
                    if (uri) await uploadAvatarFromUri(uri);
                },
            },
            {
                text: 'Gallery',
                onPress: async () => {
                    const uri = await pickImage();
                    if (uri) await uploadAvatarFromUri(uri);
                },
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await doctorApi.updateProfile({
                bio: bio.trim(),
                hospital: hospital.trim(),
                clinicAddress: clinicAddress.trim(),
                consultationFee: consultationFee ? parseFloat(consultationFee) : undefined,
                followUpFee: followUpFee ? parseFloat(followUpFee) : undefined,
                languages,
                bankDetails: {
                    bankName: bankName.trim(),
                    branchName: branchName.trim(),
                    accountNumber: accountNumber.trim(),
                    accountHolderName: accountHolderName.trim(),
                },
            });
            Alert.alert('Success', 'Profile updated successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('patient.editProfile')}</Text>
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
                <Text style={styles.headerTitle}>{t('patient.editProfile')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <TouchableOpacity
                    style={styles.avatarSection}
                    onPress={handleAvatarTap}
                    disabled={avatarUploading}
                    activeOpacity={0.85}
                >
                    <View style={styles.avatar}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarInitials}>{initials}</Text>
                        )}
                        {avatarUploading && (
                            <View style={styles.avatarOverlay}>
                                <ActivityIndicator color="#fff" />
                            </View>
                        )}
                        <View style={styles.cameraOverlay}>
                            <MaterialCommunityIcons name="camera" size={14} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.avatarHint}>{t('common.tapToChange')}</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>{t('doctor.professionalInfo')}</Text>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{t('doctor.bio')}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={bio}
                        onChangeText={(v) => v.length <= 500 && setBio(v)}
                        placeholder="Tell patients about yourself, your experience, and specialization..."
                        placeholderTextColor={colors.textDisabled}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        maxLength={500}
                    />
                    <Text style={styles.charCount}>{bio.length}/500</Text>
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Hospital / Clinic</Text>
                    <TextInput
                        style={styles.input}
                        value={hospital}
                        onChangeText={setHospital}
                        placeholder="e.g. Asiri Medical Hospital"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{t('doctor.clinicAddress')}</Text>
                    <TextInput
                        style={styles.input}
                        value={clinicAddress}
                        onChangeText={setClinicAddress}
                        placeholder="Full clinic address"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <View style={styles.feeRow}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={styles.label}>{t('doctor.consultationFeeLKR')}</Text>
                        <TextInput
                            style={styles.input}
                            value={consultationFee}
                            onChangeText={setConsultationFee}
                            placeholder="e.g. 2000"
                            placeholderTextColor={colors.textDisabled}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={{ width: spacing.md }} />
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={styles.label}>{t('doctor.followUpFeeLKR')}</Text>
                        <TextInput
                            style={styles.input}
                            value={followUpFee}
                            onChangeText={setFollowUpFee}
                            placeholder="Optional"
                            placeholderTextColor={colors.textDisabled}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{t('doctor.languages')}</Text>
                    <View style={styles.langRow}>
                        {LANGUAGES.map((lang) => {
                            const selected = languages.includes(lang);
                            return (
                                <TouchableOpacity
                                    key={lang}
                                    style={[styles.langChip, selected && styles.langChipSelected]}
                                    onPress={() => toggleLanguage(lang)}
                                    activeOpacity={0.7}
                                >
                                    {selected ? (
                                        <MaterialCommunityIcons name="check" size={14} color="#fff" />
                                    ) : null}
                                    <Text style={[styles.langChipText, selected && styles.langChipTextSelected]}>
                                        {lang}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <Text style={styles.sectionTitle}>{t('doctor.bankDetails')}</Text>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{t('doctor.bankName')}</Text>
                    <TextInput
                        style={styles.input}
                        value={bankName}
                        onChangeText={setBankName}
                        placeholder="e.g. Bank of Ceylon"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{t('doctor.branchName')}</Text>
                    <TextInput
                        style={styles.input}
                        value={branchName}
                        onChangeText={setBranchName}
                        placeholder="e.g. Colombo Main Branch"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{t('doctor.accountNumber')}</Text>
                    <TextInput
                        style={styles.input}
                        value={accountNumber}
                        onChangeText={setAccountNumber}
                        placeholder="Enter account number"
                        placeholderTextColor={colors.textDisabled}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{t('doctor.accountHolderName')}</Text>
                    <TextInput
                        style={styles.input}
                        value={accountHolderName}
                        onChangeText={setAccountHolderName}
                        placeholder="Full name as on bank account"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                            <Text style={styles.saveBtnText}>{t('common.saveChanges')}</Text>
                        </>
                    )}
                </TouchableOpacity>
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
    avatarSection: { alignItems: 'center', paddingVertical: spacing.xxl },
    avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.primary + '30', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%', borderRadius: 44 },
    avatarOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 44,
    },
    avatarInitials: { fontSize: 28, fontWeight: '700', color: colors.primary },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarHint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
    sectionTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md, marginTop: spacing.sm },
    fieldGroup: { marginBottom: spacing.lg },
    label: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
    input: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        ...typography.body,
        color: colors.textPrimary,
    },
    textArea: { minHeight: 100, paddingTop: spacing.md },
    charCount: { ...typography.caption, color: colors.textDisabled, textAlign: 'right', marginTop: spacing.xs },
    feeRow: { flexDirection: 'row' },
    langRow: { flexDirection: 'row', gap: spacing.sm },
    langChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
    },
    langChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    langChipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
    langChipTextSelected: { color: '#fff', fontWeight: '600' },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        gap: spacing.sm,
        marginTop: spacing.md,
        marginBottom: spacing.xl,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default EditProfileScreen;
