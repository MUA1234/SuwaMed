import React, { useState } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, Switch, Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useSettingsStore } from '../../store/settingsStore';
import { LANGUAGES } from '../../config/constants';
import { useTranslation } from 'react-i18next';
import { changePassword } from '../../api/auth.api';
import { useToast } from '../../components/common/Toast';

const AdminSettingsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { language, notificationsEnabled, isDarkMode, setLanguage, toggleNotifications, toggleDarkMode } = useSettingsStore();

    const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    const [pwModal, setPwModal] = useState(false);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleLanguageSelect = () => {
        Alert.alert(
            t('common.language') || 'Select Language',
            undefined,
            [
                ...LANGUAGES.map(lang => ({
                    text: lang.label,
                    onPress: () => setLanguage(lang.code),
                })),
                { text: t('common.cancel') || 'Cancel', style: 'cancel' as const },
            ]
        );
    };

    const openPwModal = () => {
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
        setShowCurrent(false); setShowNew(false); setShowConfirm(false);
        setPwModal(true);
    };

    const handleChangePassword = async () => {
        if (!currentPw || !newPw || !confirmPw) {
            showToast('error', t('common.error') || 'Error', t('validation.required') || 'Please fill in all fields.'); return;
        }
        if (newPw.length < 8) {
            showToast('error', t('common.error') || 'Error', t('validation.passwordMin') || 'Password must be at least 8 characters.'); return;
        }
        if (newPw !== confirmPw) {
            showToast('error', t('common.error') || 'Error', t('validation.passwordMismatch') || 'Passwords do not match.'); return;
        }
        setPwLoading(true);
        try {
            await changePassword(currentPw, newPw);
            setPwModal(false);
            showToast('success', t('common.success') || 'Success', t('auth.passwordChanged') || 'Your password has been updated.');
        } catch (err: any) {
            showToast('error', t('common.error') || 'Error', err?.response?.data?.message || 'Failed to change password.');
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('common.settings')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Language */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('common.preferences')}</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={handleLanguageSelect}>
                            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
                                <MaterialCommunityIcons name="translate" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.rowInfo}>
                                <Text style={styles.rowLabel}>{t('common.language')}</Text>
                                <Text style={styles.rowValue}>{currentLang.label}</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <View style={styles.toggleRow}>
                            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
                                <MaterialCommunityIcons name={isDarkMode ? 'weather-night' : 'weather-sunny'} size={20} color={colors.primary} />
                            </View>
                            <View style={styles.rowInfo}>
                                <Text style={styles.rowLabel}>{t('common.darkMode')}</Text>
                                <Text style={styles.rowValue}>{isDarkMode ? 'Enabled' : 'Disabled'}</Text>
                            </View>
                            <Switch
                                value={isDarkMode}
                                onValueChange={toggleDarkMode}
                                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                                thumbColor={isDarkMode ? colors.primary : colors.textDisabled}
                            />
                        </View>
                    </View>
                </View>

                {/* Notifications */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('common.notifications')}</Text>
                    <View style={styles.card}>
                        <View style={styles.toggleRow}>
                            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
                                <MaterialCommunityIcons name="bell-outline" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.rowInfo}>
                                <Text style={styles.rowLabel}>{t('admin.pushNotifications')}</Text>
                                <Text style={styles.rowValue}>
                                    {notificationsEnabled ? 'Enabled' : 'Disabled'}
                                </Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={toggleNotifications}
                                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                                thumbColor={notificationsEnabled ? colors.primary : colors.textDisabled}
                            />
                        </View>
                    </View>
                </View>

                {/* Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('common.security')}</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={openPwModal}>
                            <View style={[styles.rowIcon, { backgroundColor: colors.errorLight }]}>
                                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.error} />
                            </View>
                            <View style={styles.rowInfo}>
                                <Text style={styles.rowLabel}>{t('auth.changePassword') || 'Change Password'}</Text>
                                <Text style={styles.rowValue}>{t('patient.accountSecurity') || 'Update your account password'}</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* App Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Info</Text>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Version</Text>
                            <Text style={styles.infoValue}>1.0.0</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Build</Text>
                            <Text style={styles.infoValue}>2026.1</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Platform</Text>
                            <Text style={styles.infoValue}>React Native (Expo)</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal visible={pwModal} transparent animationType="slide" onRequestClose={() => setPwModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('auth.changePassword') || 'Change Password'}</Text>
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
                                <View key={label} style={styles.pwField}>
                                    <Text style={styles.pwLabel}>{label}</Text>
                                    <View style={styles.pwInputWrap}>
                                        <TextInput
                                            style={styles.pwInput}
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
                        <TouchableOpacity style={styles.pwBtn} onPress={handleChangePassword} disabled={pwLoading}>
                            {pwLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.pwBtnText}>{t('auth.changePassword') || 'Update Password'}</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    scroll: { padding: spacing.xl, paddingBottom: 100 },
    section: { marginBottom: spacing.xxl },
    sectionTitle: {
        ...typography.bodySmall,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.xs,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.md,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.md,
    },
    rowIcon: {
        width: 38,
        height: 38,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowInfo: { flex: 1 },
    rowLabel: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    rowValue: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
    },
    infoLabel: { ...typography.body, color: colors.textSecondary },
    infoValue: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
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

export default AdminSettingsScreen;
