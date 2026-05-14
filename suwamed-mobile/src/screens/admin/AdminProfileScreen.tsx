import React from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';

const AdminProfileScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const { t } = useTranslation();

    const initials = user
        ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
        : 'A';

    const fullName = user ? `${user.firstName} ${user.lastName}` : t('admin.administrator');
    const contact = user?.email || user?.phone || 'N/A';

    const infoRows = [
        { label: t('admin.fullName'), value: fullName, icon: 'account-outline' },
        { label: t('admin.contact'), value: contact, icon: 'at' },
        { label: t('admin.role'), value: t('admin.administrator'), icon: 'shield-account-outline' },
        { label: t('admin.accountStatus'), value: user?.isVerified ? t('common.verifiedAccount') : t('common.active'), icon: 'check-circle-outline' },
        { label: t('admin.memberSince'), value: t('admin.systemInception'), icon: 'calendar-outline' },
    ];

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
                <Text style={styles.headerTitle}>{t('admin.adminProfile')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarOuter}>
                        {user?.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </View>
                        )}
                        <View style={styles.verifiedBadge}>
                            <MaterialCommunityIcons name="shield-check" size={16} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.name}>{fullName}</Text>
                    <Text style={styles.contact}>{contact}</Text>
                    <View style={styles.roleBadge}>
                        <MaterialCommunityIcons name="shield-account" size={14} color={colors.primary} />
                        <Text style={styles.roleText}>{t('admin.administrator')}</Text>
                    </View>
                </View>

                {/* Info Card */}
                <Text style={styles.sectionTitle}>{t('admin.accountInfo')}</Text>
                <View style={styles.infoCard}>
                    {infoRows.map((row, i) => (
                        <React.Fragment key={i}>
                            {i > 0 && <View style={styles.divider} />}
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconWrap}>
                                    <MaterialCommunityIcons
                                        name={row.icon as any}
                                        size={18}
                                        color={colors.primary}
                                    />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>{row.label}</Text>
                                    <Text style={styles.infoValue}>{row.value}</Text>
                                </View>
                            </View>
                        </React.Fragment>
                    ))}
                </View>

                {/* Settings Link */}
                <TouchableOpacity
                    style={styles.settingsLink}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('AdminSettingsScreen')}
                >
                    <View style={styles.settingsLeft}>
                        <View style={styles.settingsIcon}>
                            <MaterialCommunityIcons name="cog-outline" size={20} color={colors.primary} />
                        </View>
                        <Text style={styles.settingsText}>{t('patient.accountSettings')}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
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
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    scroll: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: spacing.xxxl,
    },
    avatarOuter: { position: 'relative', marginBottom: spacing.md },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: colors.surface,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    name: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
    contact: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.primary + '12',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.xl,
    },
    roleText: { ...typography.bodySmall, fontWeight: '700', color: colors.primary },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    infoCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: spacing.xxl,
    },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.md,
    },
    infoIconWrap: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.primary + '12',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContent: { flex: 1 },
    infoLabel: { ...typography.caption, color: colors.textSecondary },
    infoValue: { ...typography.body, fontWeight: '600', color: colors.textPrimary, marginTop: 1 },
    settingsLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    settingsIcon: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.primary + '12',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsText: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
});

export default AdminProfileScreen;
