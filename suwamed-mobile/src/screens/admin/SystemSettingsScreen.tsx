import React, { useState } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, Alert, Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const SystemSettingsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [videoConsultations, setVideoConsultations] = useState(true);
    const [aiSymptomChecker, setAiSymptomChecker] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);

    const handleMaintenance = () => {
        Alert.alert(
            t('admin.maintenance') || 'Maintenance Mode',
            'Maintenance mode is controlled at the deployment level. Toggle the MAINTENANCE_MODE environment variable on the backend host and redeploy to enable it. This safeguard prevents accidental cluster-wide outages from a single tap.',
            [{ text: 'OK', style: 'cancel' }]
        );
    };

    const renderInfoRow = (label: string, value: string) => (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );

    const renderToggleRow = (
        label: string,
        subtitle: string,
        value: boolean,
        onToggle: (v: boolean) => void
    ) => (
        <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{label}</Text>
                <Text style={styles.toggleSubtitle}>{subtitle}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={value ? colors.primary : '#ccc'}
            />
        </View>
    );

    const renderLimitRow = (label: string, value: string, icon: string) => (
        <View style={styles.limitRow}>
            <MaterialCommunityIcons name={icon as any} size={18} color={colors.primary} style={styles.limitIcon} />
            <View style={styles.limitInfo}>
                <Text style={styles.limitLabel}>{label}</Text>
            </View>
            <View style={styles.limitBadge}>
                <Text style={styles.limitValue}>{value}</Text>
            </View>
        </View>
    );

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
                <Text style={styles.headerTitle}>{t('admin.systemSettings')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* General */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} />
                        <Text style={styles.sectionTitle}>{t('common.general')}</Text>
                    </View>
                    <View style={styles.card}>
                        {renderInfoRow('App Name', 'SuwaMed')}
                        <View style={styles.divider} />
                        {renderInfoRow('Version', '1.0.0')}
                        <View style={styles.divider} />
                        {renderInfoRow('Environment', 'Production')}
                    </View>
                </View>

                {/* Features */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="toggle-switch-outline" size={18} color={colors.primary} />
                        <Text style={styles.sectionTitle}>{t('patient.features')}</Text>
                    </View>
                    <View style={styles.card}>
                        {renderToggleRow(
                            'Video Consultations',
                            'Enable live video calls with doctors',
                            videoConsultations,
                            setVideoConsultations
                        )}
                        <View style={styles.divider} />
                        {renderToggleRow(
                            'AI Symptom Checker',
                            'Allow patients to check symptoms with AI',
                            aiSymptomChecker,
                            setAiSymptomChecker
                        )}
                        <View style={styles.divider} />
                        {renderToggleRow(
                            'Push Notifications',
                            'Send push notifications to users',
                            pushNotifications,
                            setPushNotifications
                        )}
                        <View style={styles.divider} />
                        {renderToggleRow(
                            'Email Notifications',
                            'Send email notifications to users',
                            emailNotifications,
                            setEmailNotifications
                        )}
                    </View>
                </View>

                {/* Limits */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="speedometer-outline" size={18} color={colors.primary} />
                        <Text style={styles.sectionTitle}>{t('patient.limits')}</Text>
                    </View>
                    <View style={styles.card}>
                        {renderLimitRow('Max File Size', '10 MB', 'file-outline')}
                        <View style={styles.divider} />
                        {renderLimitRow('Max Consultations / Day', '50', 'calendar-clock-outline')}
                        <View style={styles.divider} />
                        {renderLimitRow('OTP Expiry', '10 min', 'timer-outline')}
                    </View>
                </View>

                {/* Maintenance */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="wrench-outline" size={18} color={colors.warning} />
                        <Text style={[styles.sectionTitle, { color: colors.warning }]}>{t('admin.maintenance')}</Text>
                    </View>
                    <View style={styles.card}>
                        <Text style={styles.maintenanceDesc}>
                            Enabling maintenance mode will prevent all users from accessing the
                            application until it is disabled.
                        </Text>
                        <TouchableOpacity
                            style={styles.maintenanceBtn}
                            activeOpacity={0.7}
                            onPress={handleMaintenance}
                        >
                            <MaterialCommunityIcons name="wrench-outline" size={20} color="#fff" />
                            <Text style={styles.maintenanceBtnText}>{t('admin.enableMaintenanceMode')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    scroll: { padding: spacing.xl, paddingBottom: 100 },
    section: { marginBottom: spacing.xxl },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    sectionTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
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
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    toggleInfo: { flex: 1, marginRight: spacing.md },
    toggleLabel: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    toggleSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    limitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
    },
    limitIcon: { marginRight: spacing.md },
    limitInfo: { flex: 1 },
    limitLabel: { ...typography.body, color: colors.textSecondary },
    limitBadge: {
        backgroundColor: colors.primary + '12',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.xl,
    },
    limitValue: { ...typography.bodySmall, fontWeight: '700', color: colors.primary },
    maintenanceDesc: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        lineHeight: 20,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    maintenanceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.warning,
        margin: spacing.lg,
        marginTop: spacing.sm,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.lg,
    },
    maintenanceBtnText: { ...typography.body, fontWeight: '700', color: '#fff' },
});

export default SystemSettingsScreen;
