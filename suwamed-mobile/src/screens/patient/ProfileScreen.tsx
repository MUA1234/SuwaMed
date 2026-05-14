import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import * as patientApi from '../../api/patient.api';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius, typography, gradients } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import IconWrap, { IconWrapVariant } from '../../components/common/IconWrap';

const ProfileScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const { t } = useTranslation();
    const { user, logout } = useAuthStore();
    const navigation = useNavigation<any>();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const res = await patientApi.getProfile();
            setProfile(res.data);
        } catch (err) {
            console.log('Profile fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchProfile(); }, []));

    const handleLogout = () => {
        Alert.alert(t('common.logout'), t('common.logoutConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.logout'), style: 'destructive', onPress: () => logout() },
        ]);
    };

    const patient = profile?.patient;
    const subPlan = patient?.subscription?.plan || 'free';
    const subLabel = subPlan === 'premium' ? 'Premium' : subPlan === 'basic' ? 'Basic' : 'Free';
    // Subscription tier — accent for paid, success for free.
    const subVariant: 'accent' | 'success' = subPlan === 'free' ? 'success' : 'accent';

    const healthInfo: Array<{ label: string; value: string; icon: string; variant: IconWrapVariant }> = [
        { label: t('patient.bloodGroup'), value: patient?.bloodGroup || t('patient.noData', 'N/A'), icon: 'water-outline', variant: 'tinted' },
        { label: t('patient.allergies'), value: patient?.allergies?.length ? patient.allergies.join(', ') : t('patient.none', 'None'), icon: 'alert-circle-outline', variant: 'warning' },
        { label: t('patient.chronicConditions', 'Conditions'), value: patient?.chronicConditions?.length ? patient.chronicConditions[0] : t('patient.healthy', 'Healthy'), icon: 'heart-pulse', variant: 'success' },
    ];

    type MenuItem = { icon: string; label: string; variant: IconWrapVariant; screen: string | null; subtitle?: string; badge?: string; badgeVariant?: 'accent' | 'success' };
    const menuSections: Array<{ title: string; items: MenuItem[] }> = [
        {
            title: t('common.account'),
            items: [
                { icon: 'account-edit-outline', label: t('patient.editProfile'), variant: 'tinted', screen: 'EditProfileScreen' },
                { icon: 'crown-outline', label: t('patient.subscription'), variant: 'tinted', badge: subLabel, badgeVariant: subVariant, screen: 'SubscriptionScreen' },
                { icon: 'receipt-text-outline', label: t('patient.paymentHistory'), variant: 'tinted', screen: 'PaymentHistoryScreen' },
            ],
        },
        {
            title: t('common.preferences'),
            items: [
                { icon: 'bell-outline', label: t('common.notifications'), variant: 'tinted', screen: 'NotificationsScreen' },
                { icon: 'cog-outline', label: t('common.settings'), variant: 'tinted', screen: 'SettingsScreen' },
                { icon: 'translate', label: t('common.language'), variant: 'tinted', subtitle: 'English', screen: 'SettingsScreen' },
            ],
        },
        {
            title: t('patient.helpSupport', 'Support'),
            items: [
                { icon: 'help-circle-outline', label: t('patient.helpCenter'), variant: 'tinted', screen: 'HelpSupportScreen' },
                { icon: 'file-document-outline', label: t('common.termsAndPrivacy'), variant: 'tinted', screen: null },
                { icon: 'information-outline', label: t('patient.aboutSuwaMed', 'About SuwaMed'), variant: 'tinted', screen: null },
            ],
        },
    ];

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    const initials = `${(user?.firstName?.[0] || '').toUpperCase()}${(user?.lastName?.[0] || '').toUpperCase()}`;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Profile Header — uploaded photo if present, gradient + initials otherwise */}
                <View style={styles.profileHeader}>
                    {user?.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatarLarge} />
                    ) : (
                        <LinearGradient
                            colors={gradients.hero}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.avatarLarge}
                        >
                            <Text style={styles.avatarText}>{initials}</Text>
                        </LinearGradient>
                    )}
                    <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
                    <Text style={styles.email}>{user?.email || user?.phone}</Text>
                </View>

                {/* Health Info */}
                <View style={styles.healthRow}>
                    {healthInfo.map((info, i) => (
                        <View key={i} style={styles.healthCard}>
                            <IconWrap name={info.icon} variant={info.variant} size="sm" />
                            <Text style={styles.healthValue} numberOfLines={1}>{info.value}</Text>
                            <Text style={styles.healthLabel}>{info.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Menu Sections */}
                {menuSections.map((section, sIdx) => (
                    <View key={sIdx} style={styles.menuSection}>
                        <Text style={styles.menuSectionTitle}>{section.title}</Text>
                        <View style={styles.menuCard}>
                            {section.items.map((item, iIdx) => (
                                <TouchableOpacity
                                    key={iIdx}
                                    style={[styles.menuItem, iIdx < section.items.length - 1 && styles.menuItemBorder]}
                                    activeOpacity={0.6}
                                    onPress={() => item.screen ? navigation.navigate(item.screen) : null}
                                >
                                    <IconWrap name={item.icon} variant={item.variant} size="sm" />
                                    <View style={styles.menuItemContent}>
                                        <Text style={styles.menuItemLabel}>{item.label}</Text>
                                        {item.subtitle && <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>}
                                    </View>
                                    {item.badge && (
                                        <View style={[styles.badge, item.badgeVariant === 'accent' ? styles.badgeAccent : styles.badgeSuccess]}>
                                            <Text style={[styles.badgeText, item.badgeVariant === 'accent' ? styles.badgeTextAccent : styles.badgeTextSuccess]}>{item.badge}</Text>
                                        </View>
                                    )}
                                    <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDisabled} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
                    <Text style={styles.logoutText}>{t('common.logout')}</Text>
                </TouchableOpacity>
                <Text style={styles.version}>{t('common.appName')} v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // Header
    profileHeader: { alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.xl },
    avatarLarge: {
        width: 88,
        height: 88,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    avatarText: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
    name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
    email: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },

    // Health
    healthRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: spacing.xl,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    healthCard: { alignItems: 'center', flex: 1, gap: spacing.xs },
    healthValue: { ...typography.bodySmall, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
    healthLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },

    // Menu
    menuSection: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
    menuSectionTitle: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: spacing.sm },
    menuCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
    menuItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight },
    menuItemContent: { flex: 1 },
    menuItemLabel: { ...typography.body, fontWeight: '500', color: colors.textPrimary },
    menuItemSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
    badge: { paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: borderRadius.full },
    badgeAccent: { backgroundColor: colors.secondaryLight },
    badgeSuccess: { backgroundColor: colors.successLight },
    badgeText: { fontSize: 11, fontWeight: '700' },
    badgeTextAccent: { color: colors.secondary },
    badgeTextSuccess: { color: colors.success },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.xl,
        paddingVertical: spacing.md + 2,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    logoutText: { ...typography.body, fontWeight: '600', color: colors.error },
    version: { ...typography.caption, color: colors.textDisabled, textAlign: 'center', marginBottom: spacing.xxl },
});

export default ProfileScreen;
