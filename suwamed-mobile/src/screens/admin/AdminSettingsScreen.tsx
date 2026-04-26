import React from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, Switch, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../../config/theme';
import { useSettingsStore } from '../../store/settingsStore';
import { LANGUAGES } from '../../config/constants';
import { useTranslation } from 'react-i18next';

const AdminSettingsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { language, notificationsEnabled, setLanguage, toggleNotifications } = useSettingsStore();

    const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    const handleLanguageSelect = () => {
        Alert.alert(
            'Select Language',
            undefined,
            [
                ...LANGUAGES.map(lang => ({
                    text: lang.label,
                    onPress: () => setLanguage(lang.code),
                })),
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleAccountSecurity = () => {
        Alert.alert('Account Security', 'Account security settings coming soon');
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
                            <View style={[styles.rowIcon, { backgroundColor: '#EBF5FF' }]}>
                                <MaterialCommunityIcons name="translate" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.rowInfo}>
                                <Text style={styles.rowLabel}>{t('common.language')}</Text>
                                <Text style={styles.rowValue}>{currentLang.label}</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Notifications */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('common.notifications')}</Text>
                    <View style={styles.card}>
                        <View style={styles.toggleRow}>
                            <View style={[styles.rowIcon, { backgroundColor: '#F5F3FF' }]}>
                                <MaterialCommunityIcons name="bell-outline" size={20} color="#8B5CF6" />
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
                                thumbColor={notificationsEnabled ? colors.primary : '#ccc'}
                            />
                        </View>
                    </View>
                </View>

                {/* Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('common.security')}</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={handleAccountSecurity}>
                            <View style={[styles.rowIcon, { backgroundColor: '#FEF2F2' }]}>
                                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.error} />
                            </View>
                            <View style={styles.rowInfo}>
                                <Text style={styles.rowLabel}>{t('patient.accountSecurity')}</Text>
                                <Text style={styles.rowValue}>Change password & 2FA</Text>
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
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
});

export default AdminSettingsScreen;
