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
import * as doctorApi from '../../api/doctor.api';
import { spacing, borderRadius, typography, shadows, gradients } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const DoctorProfileScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const { user, logout } = useAuthStore();
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const res = await doctorApi.getDoctorProfile();
            setProfile(res.data);
        } catch (err) {
            console.log('Profile fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchProfile(); }, []));

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => logout() },
        ]);
    };

    const verifyStatusMap: Record<string, { label: string; color: string; bg: string; icon: string }> = {
        verified: { label: 'Verified', color: '#10B981', bg: '#ECFDF5', icon: 'check-decagram' },
        pending: { label: 'Verification Pending', color: '#F59E0B', bg: '#FFFBEB', icon: 'clock-outline' },
        under_review: { label: 'Under Review', color: '#2563EB', bg: '#EFF6FF', icon: 'magnify' },
        rejected: { label: 'Rejected', color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle' },
    };

    const vStatus = verifyStatusMap[profile?.verificationStatus || 'pending'];

    const stats = [
        { label: 'Patients', value: String(profile?.totalConsultations ? Math.round(profile.totalConsultations * 0.37) : 0), icon: 'account-group', gradient: gradients.primary },
        { label: 'Consults', value: String(profile?.totalConsultations || 0), icon: 'stethoscope', gradient: gradients.secondary },
        { label: 'Rating', value: profile?.rating?.average?.toFixed(1) || '0', icon: 'star', gradient: ['#F59E0B', '#D97706'] as [string, string] },
        { label: 'Exp.', value: `${profile?.experience || 0}yr`, icon: 'briefcase-outline', gradient: ['#8B5CF6', '#7C3AED'] as [string, string] },
    ];

    const menuSections = [
        {
            title: 'Account',
            items: [
                { icon: 'account-edit-outline', label: 'Edit Profile', color: colors.primary, onPress: () => navigation.navigate('EditProfileScreen') },
                { icon: 'shield-check-outline', label: 'Verification', color: '#10B981', badge: vStatus?.label, onPress: () => navigation.navigate('VerificationScreen') },
                { icon: 'star-outline', label: 'Reviews & Ratings', color: '#F59E0B', badge: profile?.rating?.count ? `${profile.rating.count} reviews` : undefined, onPress: () => navigation.navigate('ReviewsScreen') },
            ],
        },
        {
            title: 'Preferences',
            items: [
                { icon: 'bell-outline', label: 'Notifications', color: '#8B5CF6', onPress: () => navigation.navigate('NotificationsScreen') },
                { icon: 'cog-outline', label: 'Settings', color: '#64748B', onPress: () => navigation.navigate('SettingsScreen') },
                { icon: 'translate', label: 'Language', color: '#EC4899', subtitle: 'English', onPress: () => Alert.alert('Language', 'Language selection coming soon.') },
            ],
        },
        {
            title: 'Support',
            items: [
                { icon: 'help-circle-outline', label: 'Help Center', color: colors.primary, onPress: () => Alert.alert('Help Center', 'Please contact us at support@suwamed.lk') },
                { icon: 'file-document-outline', label: 'Terms & Privacy', color: '#64748B', onPress: () => Alert.alert('Terms & Privacy', 'Available at suwamed.lk/legal') },
                { icon: 'information-outline', label: 'About SuwaMed', color: colors.secondary, onPress: () => Alert.alert('About SuwaMed', 'SuwaMed v1.0.0') },
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
                        <Text style={styles.avatarInitials}>{initials}</Text>
                    </LinearGradient>
                    <Text style={styles.name}>Dr. {user?.firstName} {user?.lastName}</Text>
                    <Text style={styles.specialization}>{profile?.specialization?.join(', ') || 'Doctor'}</Text>
                    {profile?.hospital && <Text style={styles.hospital}>{profile.hospital}</Text>}
                    <View style={[styles.verifyBadge, { backgroundColor: vStatus?.bg }]}>
                        <MaterialCommunityIcons name={vStatus?.icon as any} size={14} color={vStatus?.color} />
                        <Text style={[styles.verifyText, { color: vStatus?.color }]}>{vStatus?.label}</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    {stats.map((stat, i) => (
                        <View key={i} style={styles.statItem}>
                            <LinearGradient
                                colors={stat.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.statIconWrap}
                            >
                                <MaterialCommunityIcons name={stat.icon as any} size={16} color="#FFFFFF" />
                            </LinearGradient>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Menu Sections */}
                {menuSections.map((section, sIdx) => (
                    <View key={sIdx} style={styles.menuSection}>
                        <Text style={styles.menuSectionTitle}>{section.title}</Text>
                        <View style={styles.menuCard}>
                            {section.items.map((item, iIdx) => (
                                <TouchableOpacity key={iIdx} style={[styles.menuItem, iIdx < section.items.length - 1 && styles.menuItemBorder]} activeOpacity={0.6} onPress={(item as any).onPress}>
                                    <View style={[styles.menuIconWrap, { backgroundColor: item.color + '12' }]}>
                                        <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                                    </View>
                                    <View style={styles.menuItemContent}>
                                        <Text style={styles.menuItemLabel}>{item.label}</Text>
                                        {(item as any).subtitle && <Text style={styles.menuItemSubtitle}>{(item as any).subtitle}</Text>}
                                    </View>
                                    {(item as any).badge && (
                                        <View style={styles.badge}><Text style={styles.badgeText}>{(item as any).badge}</Text></View>
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
                <Text style={styles.version}>SuwaMed v1.0.0</Text>
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
    avatarInitials: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
    name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
    specialization: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    hospital: { ...typography.caption, color: colors.textDisabled, marginTop: 2 },
    verifyBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1, borderRadius: borderRadius.full, marginTop: spacing.sm, gap: 4 },
    verifyText: { ...typography.caption, fontWeight: '600' },

    // Stats
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xxl,
        ...shadows.sm,
    },
    statItem: { alignItems: 'center' },
    statIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
    statValue: { ...typography.bodySmall, fontWeight: '700', color: colors.textPrimary },
    statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },

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
    badge: { backgroundColor: '#FFFBEB', paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: borderRadius.full, marginRight: spacing.sm },
    badgeText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },

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

export default DoctorProfileScreen;
