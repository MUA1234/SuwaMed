import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/common/Toast';
import * as patientApi from '../../api/patient.api';
import client from '../../api/client';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { BLOOD_GROUPS, SRI_LANKAN_DISTRICTS, GENDER_OPTIONS } from '../../config/constants';
import { pickImage, takePhoto } from '../../utils/permissions';

const EditProfileScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const { user, updateUser } = useAuthStore();
    const { showToast } = useToast();

    const [saving, setSaving] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);

    // Personal info
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [district, setDistrict] = useState('');

    // Health info
    const [bloodGroup, setBloodGroup] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [allergies, setAllergies] = useState('');
    const [chronicConditions, setChronicConditions] = useState('');

    // Emergency contact
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                if (user) {
                    setFirstName(user.firstName || '');
                    setLastName(user.lastName || '');
                    setPhone(user.phone || '');
                }
                const res = await patientApi.getProfile();
                const p = res.data?.patient;
                const u = res.data?.user;
                if (u) {
                    setFirstName(u.firstName || user?.firstName || '');
                    setLastName(u.lastName || user?.lastName || '');
                    setPhone(u.phone || user?.phone || '');
                    setGender(u.gender || '');
                    setDateOfBirth(u.dateOfBirth ? u.dateOfBirth.split('T')[0] : '');
                    setDistrict(u.address?.district || '');
                    setAvatarUri(u.avatar || user?.avatar || null);
                }
                if (p) {
                    setBloodGroup(p.bloodGroup || '');
                    setHeight(p.height ? String(p.height) : '');
                    setWeight(p.weight ? String(p.weight) : '');
                    setAllergies(p.allergies?.join(', ') || '');
                    setChronicConditions(p.chronicConditions?.join(', ') || '');
                    setEmergencyName(p.emergencyContact?.name || '');
                    setEmergencyPhone(p.emergencyContact?.phone || '');
                }
            } catch (err) {
                console.log('EditProfile fetch error:', err);
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchProfile();
    }, []);

    const uploadAvatarFromUri = async (uri: string) => {
        setAvatarUploading(true);
        try {
            const filename = uri.split('/').pop() || `avatar-${Date.now()}.jpg`;
            const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
            const mime = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            const form = new FormData();
            form.append('avatar', { uri, name: filename, type: mime } as any);
            const res = await patientApi.uploadAvatar(form);
            const url = res?.data?.avatar || uri;
            setAvatarUri(url);
            updateUser({ avatar: url } as any);
            showToast('success', 'Avatar Updated', 'Your photo has been updated.');
        } catch (err: any) {
            showToast('error', 'Error', err?.response?.data?.message || 'Failed to upload avatar.');
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleAvatarTap = () => {
        Alert.alert(t('common.tapToChange'), undefined, [
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
            { text: t('common.cancel'), style: 'cancel' },
        ]);
    };

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            showToast('warning', t('patient.validationTitle', 'Validation'), t('patient.nameRequired', 'First name and last name are required.'));
            return;
        }
        setSaving(true);
        try {
            await client.put('/patients/user', {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim(),
                gender,
                dateOfBirth: dateOfBirth.trim() || undefined,
                district: district.trim() || undefined,
            });

            await patientApi.updateProfile({
                bloodGroup: bloodGroup || undefined,
                height: height ? Number(height) : undefined,
                weight: weight ? Number(weight) : undefined,
                allergies: allergies ? allergies.split(',').map((s) => s.trim()).filter(Boolean) : [],
                chronicConditions: chronicConditions
                    ? chronicConditions.split(',').map((s) => s.trim()).filter(Boolean)
                    : [],
                emergencyContact:
                    emergencyName || emergencyPhone
                        ? { name: emergencyName.trim(), phone: emergencyPhone.trim() }
                        : undefined,
            });

            updateUser({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() });

            showToast('success', 'Profile Updated', 'Your profile has been saved.');
            navigation.goBack();
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to update profile. Please try again.';
            showToast('error', 'Error', msg);
        } finally {
            setSaving(false);
        }
    };

    if (loadingProfile) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.editProfile')}</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.7} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Avatar */}
                <TouchableOpacity
                    style={styles.avatarSection}
                    onPress={handleAvatarTap}
                    disabled={avatarUploading}
                    activeOpacity={0.85}
                >
                    <View style={styles.avatarWrap}>
                        <View style={styles.avatarCircle}>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                            ) : (
                                <MaterialCommunityIcons name="account" size={52} color={colors.primary} />
                            )}
                            {avatarUploading && (
                                <View style={styles.avatarUploading}>
                                    <ActivityIndicator color="#fff" />
                                </View>
                            )}
                        </View>
                        <View style={styles.avatarEditOverlay}>
                            <MaterialCommunityIcons name="camera" size={16} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.avatarHint}>{t('common.tapToChange')}</Text>
                </TouchableOpacity>

                {/* Personal Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('patient.personalInfo')}</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('auth.firstName')}</Text>
                            <TextInput
                                style={styles.input}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="Enter first name"
                                placeholderTextColor={colors.textDisabled}
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('auth.lastName')}</Text>
                            <TextInput
                                style={styles.input}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Enter last name"
                                placeholderTextColor={colors.textDisabled}
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('auth.phone')}</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+94 7X XXX XXXX"
                                placeholderTextColor={colors.textDisabled}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>
                </View>

                {/* Gender */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('auth.gender')}</Text>
                    <View style={styles.chipRow}>
                        {GENDER_OPTIONS.map((g) => (
                            <TouchableOpacity
                                key={g}
                                style={[styles.chip, gender === g && styles.chipActive]}
                                onPress={() => setGender(g)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                                    {g.charAt(0).toUpperCase() + g.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Date of Birth */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('auth.dateOfBirth')}</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Date of Birth (YYYY-MM-DD)</Text>
                            <TextInput
                                style={styles.input}
                                value={dateOfBirth}
                                onChangeText={setDateOfBirth}
                                placeholder="e.g. 1990-05-20"
                                placeholderTextColor={colors.textDisabled}
                            />
                        </View>
                    </View>
                </View>

                {/* District */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('auth.district')}</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('auth.district')}</Text>
                            <TextInput
                                style={styles.input}
                                value={district}
                                onChangeText={setDistrict}
                                placeholder="e.g. Colombo"
                                placeholderTextColor={colors.textDisabled}
                            />
                        </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
                        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                            {SRI_LANKAN_DISTRICTS.map((d) => (
                                <TouchableOpacity
                                    key={d}
                                    style={[styles.chip, district === d && styles.chipActive]}
                                    onPress={() => setDistrict(d)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.chipText, district === d && styles.chipTextActive]}>{d}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Health Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('patient.healthInfo')}</Text>

                    <Text style={styles.subLabel}>{t('patient.bloodGroup')}</Text>
                    <View style={styles.chipRow}>
                        {BLOOD_GROUPS.map((bg) => (
                            <TouchableOpacity
                                key={bg}
                                style={[styles.chip, bloodGroup === bg && styles.chipActive]}
                                onPress={() => setBloodGroup(bg)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.chipText, bloodGroup === bg && styles.chipTextActive]}>{bg}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={[styles.card, { marginTop: spacing.md }]}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Height (cm)</Text>
                            <TextInput
                                style={styles.input}
                                value={height}
                                onChangeText={setHeight}
                                placeholder="e.g. 170"
                                placeholderTextColor={colors.textDisabled}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Weight (kg)</Text>
                            <TextInput
                                style={styles.input}
                                value={weight}
                                onChangeText={setWeight}
                                placeholder="e.g. 65"
                                placeholderTextColor={colors.textDisabled}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Allergies (comma separated)</Text>
                            <TextInput
                                style={styles.input}
                                value={allergies}
                                onChangeText={setAllergies}
                                placeholder="e.g. Penicillin, Pollen"
                                placeholderTextColor={colors.textDisabled}
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Chronic Conditions (comma separated)</Text>
                            <TextInput
                                style={styles.input}
                                value={chronicConditions}
                                onChangeText={setChronicConditions}
                                placeholder="e.g. Diabetes, Hypertension"
                                placeholderTextColor={colors.textDisabled}
                            />
                        </View>
                    </View>
                </View>

                {/* Emergency Contact */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('patient.emergencyContact')}</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('patient.contactName')}</Text>
                            <TextInput
                                style={styles.input}
                                value={emergencyName}
                                onChangeText={setEmergencyName}
                                placeholder="e.g. John Perera"
                                placeholderTextColor={colors.textDisabled}
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('patient.contactPhone')}</Text>
                            <TextInput
                                style={styles.input}
                                value={emergencyPhone}
                                onChangeText={setEmergencyPhone}
                                placeholder="+94 7X XXX XXXX"
                                placeholderTextColor={colors.textDisabled}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity style={styles.saveFullBtn} onPress={handleSave} activeOpacity={0.8} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.saveFullBtnText}>{t('common.saveChanges')}</Text>
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
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerBtn: { padding: spacing.xs },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, marginLeft: spacing.md },
    saveBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        minWidth: 60,
        alignItems: 'center',
    },
    saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    avatarSection: { alignItems: 'center', paddingVertical: spacing.xxl },
    avatarWrap: { position: 'relative' },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: colors.primary + '30',
        overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
    avatarUploading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 50,
    },
    avatarEditOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarHint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
    section: { marginBottom: spacing.xxl },
    sectionTitle: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.md,
    },
    subLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    inputGroup: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    inputLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
    input: { ...typography.body, color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.border },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '500' },
    chipTextActive: { color: '#fff', fontWeight: '600' },
    saveFullBtn: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    saveFullBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default EditProfileScreen;
