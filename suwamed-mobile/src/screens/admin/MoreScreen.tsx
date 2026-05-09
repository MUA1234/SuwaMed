import React from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, Alert, Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import IconWrap, { IconWrapVariant } from '../../components/common/IconWrap';

interface MenuItem {
    label: string;
    icon: string;
    screen: string | null;
    action?: () => void;
    variant: IconWrapVariant;
}

const MoreScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const menuSections: Array<{ title: string; items: MenuItem[] }> = [
    {
      title: 'Account',
      items: [
        { label: 'Admin Profile', icon: 'account-circle-outline', screen: 'AdminProfileScreen', variant: 'tinted' },
        { label: 'Notifications', icon: 'bell-outline', screen: 'AdminNotificationsScreen', variant: 'tinted' },
        { label: 'Settings', icon: 'cog-outline', screen: 'AdminSettingsScreen', variant: 'tinted' },
      ],
    },
    {
      title: 'Legal',
      items: [
        { label: 'Privacy Policy', icon: 'shield-lock-outline', screen: 'Privacy', variant: 'tinted' },
        { label: 'Terms of Service', icon: 'file-document-outline', screen: 'Terms', variant: 'tinted' },
        {
          label: 'Contact Support',
          icon: 'help-circle-outline',
          screen: null,
          variant: 'tinted',
          action: () => {
            Linking.openURL('mailto:support@suwamed.lk?subject=SuwaMed%20Admin%20Support').catch(() => {
              Alert.alert('Contact Support', 'Email: support@suwamed.lk');
            });
          },
        },
      ],
    },
  ];
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => logout(),
                },
            ]
        );
    };

    const handlePress = (item: { screen: string | null; action?: () => void }) => {
        if (item.screen) {
            navigation.navigate(item.screen);
        } else if (item.action) {
            item.action();
        }
    };

    const initials = user
        ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
        : 'A';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.heading}>{t('common.more')}</Text>
                <Text style={styles.subtitle}>Admin options</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Profile summary */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>
                            {user ? `${user.firstName} ${user.lastName}` : 'Admin'}
                        </Text>
                        <Text style={styles.profileContact}>{user?.email || user?.phone || ''}</Text>
                        <View style={styles.adminBadge}>
                            <MaterialCommunityIcons name="shield-account" size={12} color={colors.primary} />
                            <Text style={styles.adminBadgeText}>{t('admin.administrator')}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('AdminProfileScreen')}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textDisabled} />
                    </TouchableOpacity>
                </View>

                {/* Menu Sections */}
                {menuSections.map((section, si) => (
                    <View key={si} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.menuCard}>
                            {section.items.map((item, ii) => (
                                <React.Fragment key={ii}>
                                    {ii > 0 && <View style={styles.divider} />}
                                    <TouchableOpacity
                                        style={styles.menuRow}
                                        activeOpacity={0.7}
                                        onPress={() => handlePress(item)}
                                    >
                                        <IconWrap name={item.icon} variant={item.variant} size="sm" />
                                        <Text style={styles.menuLabel}>{item.label}</Text>
                                        <MaterialCommunityIcons
                                            name="chevron-right"
                                            size={18}
                                            color={colors.textDisabled}
                                        />
                                    </TouchableOpacity>
                                </React.Fragment>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
                    <Text style={styles.logoutText}>{t('common.logout')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.lg,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    heading: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    scroll: { padding: spacing.xl, paddingBottom: 100 },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xxl,
        gap: spacing.md,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
    profileInfo: { flex: 1 },
    profileName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
    profileContact: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    adminBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: spacing.xs,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    adminBadgeText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
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
    menuCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.md,
    },
    menuLabel: { flex: 1, ...typography.body, fontWeight: '500', color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    logoutText: { ...typography.body, fontWeight: '700', color: colors.error },
});

export default MoreScreen;
