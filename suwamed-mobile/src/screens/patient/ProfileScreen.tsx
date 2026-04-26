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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import * as patientApi from '../../api/patient.api';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius, typography, shadows, gradients } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
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
    const subColor = subPlan === 'premium' ? '#8B5CF6' : subPlan === 'basic' ? '#2563EB' : '#10B981';

    const healthInfo = [
        { label: t('patient.bloodGroup'), value: patient?.bloodGroup || t('patient.noData', 'N/A'), icon: 'water', color: '#EF4444' },
        { label: t('patient.allergies'), value: patient?.allergies?.length ? patient.allergies.join(', ') : t('patient.none', 'None'), icon: 'alert-circle-outline', color: '#F59E0B' },
        { label: t('patient.chronicConditions', 'Conditions'), value: patient?.chronicConditions?.length ? patient.chronicConditions[0] : t('patient.healthy', 'Healthy'), icon: 'heart-pulse', color: '#10B981' },
    ];

    const menuSections = [
        {
            title: t('common.account'),
            items: [
                { icon: 'account-edit-outline', label: t('patient.editProfile'), color: colors.primary, screen: 'EditProfileScreen' },
                { icon: 'credit-card-outline', label: t('patient.subscription'), color: subColor, badge: subLabel, screen: 'SubscriptionScreen' },
                { icon: 'receipt', label: t('patient.paymentHistory'), color: '#F59E0B', screen: 'PaymentHistoryScreen' },
            ],
        },
        {
            title: t('common.preferences'),
            items: [
                { icon: 'bell-outline', label: t('common.notifications'), color: '#8B5CF6', screen: 'NotificationsScreen' },
                { icon: 'cog-outline', label: t('common.settings'), color: '#64748B', screen: 'SettingsScreen' },
                { icon: 'translate', label: t('common.language'), color: '#EC4899', subtitle: 'English', screen: 'SettingsScreen' },
            ],
        },
        {
            title: t('patient.helpSupport', 'Support'),
            items: [
                { icon: 'help-circle-outline', label: t('patient.helpCenter'), color: colors.primary, screen: 'HelpSupportScreen' },
                { icon: 'file-document-outline', label: t('common.termsAndPrivacy'), color: '#64748B', screen: null },
                { icon: 'information-outline', label: t('patient.aboutSuwaMed', 'About SuwaMed'), color: colors.secondary, screen: null },
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
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <LinearGradient
                        colors={gradients.hero}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarLarge}
                    >
                        <Text style={styles.avatarText}>{initials}</Text>
                    </LinearGradient>
                    <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
                    <Text style={styles.email}>{user?.email || user?.phone}</Text>
                </View>

                {/* Health Info */}
                <View style={styles.healthRow}>
                    {healthInfo.map((info, i) => (
                        <View key={i} style={styles.healthCard}>
                            <View style={[styles.healthIconWrap, { backgroundColor: info.color + '15' }]}>
                                <MaterialCommunityIcons name={info.icon as any} size={18} color={info.color} />
                            </View>
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
                                    onPress={() => (item as any).screen ? navigation.navigate((item as any).screen) : null}
                                >
                                    <View style={[styles.menuIconWrap, { backgroundColor: item.color + '12' }]}>
                                        <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                                    </View>
                                    <View style={styles.menuItemContent}>
                                        <Text style={styles.menuItemLabel}>{item.label}</Text>
                                        {(item as any).subtitle && <Text style={styles.menuItemSubtitle}>{(item as any).subtitle}</Text>}
                                    </View>
                                    {(item as any).badge && (
                                        <View style={[styles.badge, { backgroundColor: item.color + '12' }]}>
                                            <Text style={[styles.badgeText, { color: item.color }]}>{(item as any).badge}</Text>
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
        ...shadows.lg,
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
        ...shadows.sm,
    },
    healthCard: { alignItems: 'center', flex: 1 },
    healthIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
    healthValue: { ...typography.bodySmall, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
    healthLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },

    // Menu
    menuSection: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
    menuSectionTitle: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: spacing.sm },
    menuCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden', ...shadows.sm },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
    menuItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight },
    menuIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    menuItemContent: { flex: 1 },
    menuItemLabel: { ...typography.body, fontWeight: '500', color: colors.textPrimary },
    menuItemSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
    badge: { paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: borderRadius.full, marginRight: spacing.sm },
    badgeText: { fontSize: 11, fontWeight: '700' },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.errorLight,
        marginHorizontal: spacing.xl,
        paddingVertical: spacing.md + 2,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    logoutText: { ...typography.body, fontWeight: '600', color: colors.error },
    version: { ...typography.caption, color: colors.textDisabled, textAlign: 'center', marginBottom: spacing.xxl },
});

export default ProfileScreen;
