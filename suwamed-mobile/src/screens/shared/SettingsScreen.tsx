import React, { useEffect, useState } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, Switch, Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/common/Toast';
import { changePassword, deleteAccount as deleteAccountApi } from '../../api/auth.api';
import { colors as lightColors, spacing, borderRadius, typography } from '../../config/theme';
import { useTranslation } from 'react-i18next';

const SettingsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { language, isDarkMode, notificationsEnabled, setLanguage, toggleDarkMode, toggleNotifications, loadSettings } = useSettingsStore();
    const { logout } = useAuthStore();
    const { theme: colors } = useTheme();
    const { showToast } = useToast();
    const [pwModal, setPwModal] = useState(false);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deletePw, setDeletePw] = useState('');
    const [deletePwShow, setDeletePwShow] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => { loadSettings(); }, []);

    const languageLabels: Record<string, string> = { en: 'English', si: 'සිංහල', ta: 'தமிழ்' };

    const handleLanguageChange = () => {
        Alert.alert('Select Language', undefined, [
            { text: 'English', onPress: () => setLanguage('en') },
            { text: 'සිංහල', onPress: () => setLanguage('si') },
            { text: 'தமிழ்', onPress: () => setLanguage('ta') },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleDarkMode = () => {
        toggleDarkMode();
    };

    const openPasswordModal = () => {
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
        setShowCurrent(false); setShowNew(false); setShowConfirm(false);
        setPwModal(true);
    };

    const handleChangePassword = async () => {
        if (!currentPw || !newPw || !confirmPw) {
            showToast('error', 'Missing Fields', 'Please fill in all fields.'); return;
        }
        if (newPw.length < 8) {
            showToast('error', 'Too Short', 'New password must be at least 8 characters.'); return;
        }
        if (newPw !== confirmPw) {
            showToast('error', 'Mismatch', 'New passwords do not match.'); return;
        }
        setPwLoading(true);
        try {
            await changePassword(currentPw, newPw);
            setPwModal(false);
            showToast('success', 'Password Changed', 'Your password has been updated.');
        } catch (err: any) {
            showToast('error', 'Error', err?.response?.data?.message || 'Failed to change password.');
        } finally {
            setPwLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            t('common.deleteAccount'),
            t('common.deleteAccountWarning'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => {
                        setDeletePw('');
                        setDeletePwShow(false);
                        setDeleteModal(true);
                    },
                },
            ],
        );
    };

    const handleConfirmDelete = async () => {
        if (!deletePw) {
            showToast('error', t('common.error'), t('validation.required'));
            return;
        }
        setDeleteLoading(true);
        try {
            await deleteAccountApi(deletePw);
            setDeleteModal(false);
            showToast('success', t('common.success'), t('common.deleteAccountSuccess'));
            // Logout — tokens are gone server-side, AsyncStorage is wiped here.
            await logout();
        } catch (err: any) {
            showToast(
                'error',
                t('common.error'),
                err?.response?.data?.message || t('common.deleteAccountError'),
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => logout() },
        ]);
    };

    const s = getDynamicStyles(colors);

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.title}>{t('common.settings')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* App Preferences */}
                <Text style={s.sectionLabel}>{t('common.appPreferences')}</Text>
                <View style={s.card}>
                    <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={handleLanguageChange}>
                        <View style={[s.iconWrap, { backgroundColor: isDarkMode ? '#1E3A5F' : '#EBF5FF' }]}>
                            <MaterialCommunityIcons name="translate" size={20} color={colors.primary} />
                        </View>
                        <View style={s.rowContent}>
                            <Text style={s.rowLabel}>{t('common.language')}</Text>
                            <Text style={s.rowValue}>{languageLabels[language] || 'English'}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
                    </TouchableOpacity>

                    <View style={[s.row, s.rowBorder]}>
                        <View style={[s.iconWrap, { backgroundColor: isDarkMode ? '#2D2554' : '#F5F3FF' }]}>
                            <MaterialCommunityIcons name="bell-outline" size={20} color="#8B5CF6" />
                        </View>
                        <View style={s.rowContent}>
                            <Text style={s.rowLabel}>{t('common.notifications')}</Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: colors.border, true: lightColors.primary + '60' }}
                            thumbColor={notificationsEnabled ? lightColors.primary : colors.textDisabled}
                        />
                    </View>

                    <View style={[s.row, s.rowBorder]}>
                        <View style={[s.iconWrap, { backgroundColor: isDarkMode ? '#2D3748' : '#1A1A2E15' }]}>
                            <MaterialCommunityIcons name={isDarkMode ? 'weather-sunny' : 'weather-night'} size={20} color={isDarkMode ? '#FCD34D' : '#1A1A2E'} />
                        </View>
                        <View style={s.rowContent}>
                            <Text style={s.rowLabel}>{t('common.darkMode')}</Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={handleDarkMode}
                            trackColor={{ false: colors.border, true: lightColors.primary + '60' }}
                            thumbColor={isDarkMode ? lightColors.primary : colors.textDisabled}
                        />
                    </View>
                </View>

                {/* Account */}
                <Text style={s.sectionLabel}>{t('common.account')}</Text>
                <View style={s.card}>
                    <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={openPasswordModal}>
                        <View style={[s.iconWrap, { backgroundColor: isDarkMode ? '#0D3B2E' : '#ECFDF5' }]}>
                            <MaterialCommunityIcons name="lock-outline" size={20} color={colors.success} />
                        </View>
                        <View style={s.rowContent}>
                            <Text style={s.rowLabel}>{t('auth.changePassword')}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[s.row, s.rowBorder]} activeOpacity={0.7} onPress={handleDeleteAccount}>
                        <View style={[s.iconWrap, { backgroundColor: isDarkMode ? '#3B1515' : '#FEF2F2' }]}>
                            <MaterialCommunityIcons name="account-remove" size={20} color={colors.error} />
                        </View>
                        <View style={s.rowContent}>
                            <Text style={[s.rowLabel, { color: colors.error }]}>{t('common.deleteAccount')}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
                    </TouchableOpacity>
                </View>

                {/* About */}
                <Text style={s.sectionLabel}>{t('common.about')}</Text>
                <View style={s.card}>
                    <TouchableOpacity
                        style={s.row}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Privacy')}
                    >
                        <View style={[s.iconWrap, { backgroundColor: isDarkMode ? '#1E3A5F' : '#EBF5FF' }]}>
                            <MaterialCommunityIcons name="shield-lock-outline" size={20} color={colors.primary} />
                        </View>
                        <View style={s.rowContent}>
                            <Text style={s.rowLabel}>{t('common.privacyPolicy')}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[s.row, s.rowBorder]}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Terms')}
                    >
                        <View style={[s.iconWrap, { backgroundColor: isDarkMode ? '#1E3A5F' : '#EBF5FF' }]}>
                            <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.primary} />
                        </View>
                        <View style={s.rowContent}>
                            <Text style={s.rowLabel}>{t('common.termsOfService')}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
                    </TouchableOpacity>

                    <View style={[s.row, s.rowBorder]}>
                        <View style={[s.iconWrap, { backgroundColor: isDarkMode ? '#0D3B2E' : '#ECFDF5' }]}>
                            <MaterialCommunityIcons name="information-outline" size={20} color={colors.secondary} />
                        </View>
                        <View style={s.rowContent}>
                            <Text style={s.rowLabel}>{t('common.appVersion')}</Text>
                            <Text style={s.rowValue}>v1.0.0</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
                    <Text style={s.logoutText}>{t('common.logout')}</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal visible={pwModal} transparent animationType="slide" onRequestClose={() => setPwModal(false)}>
                <View style={s.modalOverlay}>
                    <View style={s.modalCard}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>{t('auth.changePassword')}</Text>
                            <TouchableOpacity onPress={() => setPwModal(false)}>
                                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        {(['Current Password', 'New Password', 'Confirm New Password'] as const).map((label, idx) => {
                            const val = idx === 0 ? currentPw : idx === 1 ? newPw : confirmPw;
                            const setVal = idx === 0 ? setCurrentPw : idx === 1 ? setNewPw : setConfirmPw;
                            const show = idx === 0 ? showCurrent : idx === 1 ? showNew : showConfirm;
                            const setShow = idx === 0 ? setShowCurrent : idx === 1 ? setShowNew : setShowConfirm;
                            return (
                                <View key={label} style={s.pwField}>
                                    <Text style={s.pwLabel}>{label}</Text>
                                    <View style={s.pwInputWrap}>
                                        <TextInput
                                            style={s.pwInput}
                                            value={val}
                                            onChangeText={setVal}
                                            secureTextEntry={!show}
                                            placeholder="••••••••"
                                            placeholderTextColor={colors.textDisabled}
                                            autoCapitalize="none"
                                        />
                                        <TouchableOpacity onPress={() => setShow(!show)}>
                                            <MaterialCommunityIcons name={show ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                        <TouchableOpacity style={s.pwBtn} onPress={handleChangePassword} disabled={pwLoading}>
                            {pwLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.pwBtnText}>Update Password</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Delete Account Modal */}
            <Modal
                visible={deleteModal}
                transparent
                animationType="slide"
                onRequestClose={() => setDeleteModal(false)}
            >
                <View style={s.modalOverlay}>
                    <View style={s.modalCard}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>{t('common.deleteAccountConfirmTitle')}</Text>
                            <TouchableOpacity onPress={() => setDeleteModal(false)}>
                                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={{ ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 }}>
                            {t('common.deleteAccountConfirmBody')}
                        </Text>
                        <View style={s.pwField}>
                            <Text style={s.pwLabel}>{t('common.deleteAccountPasswordLabel')}</Text>
                            <View style={s.pwInputWrap}>
                                <TextInput
                                    style={s.pwInput}
                                    value={deletePw}
                                    onChangeText={setDeletePw}
                                    secureTextEntry={!deletePwShow}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.textDisabled}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setDeletePwShow(!deletePwShow)}>
                                    <MaterialCommunityIcons
                                        name={deletePwShow ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[s.pwBtn, { backgroundColor: colors.error }]}
                            onPress={handleConfirmDelete}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={s.pwBtnText}>{t('common.deleteAccountConfirmCta')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const getDynamicStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    title: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    scroll: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    sectionLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.sm },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.lg },
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    rowContent: { flex: 1 },
    rowLabel: { ...typography.body, color: colors.textPrimary },
    rowValue: { ...typography.caption, color: colors.textSecondary },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.errorLight, paddingVertical: spacing.lg, borderRadius: borderRadius.md, gap: spacing.sm, marginBottom: spacing.xxl, borderWidth: 1, borderColor: colors.error + '30' },
    logoutText: { ...typography.body, fontWeight: '600', color: colors.error },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.xl, paddingBottom: spacing.xxl },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    modalTitle: { ...typography.h3, color: colors.textPrimary },
    pwField: { marginBottom: spacing.lg },
    pwLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
    pwInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
    pwInput: { flex: 1, paddingVertical: spacing.md, ...typography.body, color: colors.textPrimary },
    pwBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.sm },
    pwBtnText: { ...typography.button, color: '#fff', textTransform: 'none' as any },
});

export default SettingsScreen;
