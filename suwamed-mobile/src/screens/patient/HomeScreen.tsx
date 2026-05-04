import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
} from 'react-native';
import FadeIn from '../../components/common/FadeIn';
import IconWrap from '../../components/common/IconWrap';
import { AppointmentCardSkeleton, DoctorCardSkeleton, SkeletonList } from '../../components/common/Skeleton';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import * as appointmentApi from '../../api/appointment.api';
import * as healthTipApi from '../../api/healthTip.api';
import { getDoctors } from '../../api/doctor.api';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius, typography, shadows, gradients } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
const { width } = Dimensions.get('window');

// Specialization → icon glyph only. All specializations render in the same primary
// teal — distinction comes from the icon shape and the name, not from a rainbow tile.
const SPEC_ICON: Record<string, string> = {
    'General Practitioner': 'doctor',
    'Cardiologist': 'heart-pulse',
    'Dermatologist': 'hand-heart',
    'Pediatrician': 'baby-face-outline',
    'Neurologist': 'brain',
    'Orthopedic Surgeon': 'bone',
    'Gynecologist': 'human-female',
    'Psychiatrist': 'head-cog-outline',
    'Endocrinologist': 'diabetes',
    'Gastroenterologist': 'stomach',
    'Oncologist': 'ribbon',
    'Ophthalmologist': 'eye-outline',
    'Pulmonologist': 'lungs',
    'Radiologist': 'radioactive',
    'Urologist': 'water-outline',
    'ENT Specialist': 'ear-hearing',
    'Nephrologist': 'kidney',
    'Rheumatologist': 'human',
    'Allergist': 'flower',
    'Anesthesiologist': 'needle',
};

const HomeScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [upcomingAppt, setUpcomingAppt] = useState<any>(null);
    const [healthTips, setHealthTips] = useState<any[]>([]);
    const [specializations, setSpecializations] = useState<Array<{ name: string; icon: string }>>([]);

    const fetchData = async () => {
        try {
            const [apptsRes, tipsRes, doctorsRes] = await Promise.all([
                appointmentApi.getAppointments({ status: 'confirmed' }),
                healthTipApi.getHealthTips({ language: 'en' }),
                getDoctors(),
            ]);
            const upcoming = (apptsRes.data || []).filter((a: any) => new Date(a.date) >= new Date());
            setUpcomingAppt(upcoming[0] || null);
            setHealthTips((tipsRes.data || []).slice(0, 3));

            const specSet = new Set<string>();
            for (const doc of (doctorsRes.data || [])) {
                for (const s of (doc.specialization || [])) {
                    specSet.add(s);
                }
            }
            const specList = Array.from(specSet).slice(0, 8).map((name) => ({
                name,
                icon: SPEC_ICON[name] || 'stethoscope',
            }));
            setSpecializations(specList);
        } catch (err) {
            console.log('Home fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('patient.goodMorning');
        if (hour < 17) return t('patient.goodAfternoon');
        return t('patient.goodEvening');
    };

    const quickActions: Array<{
        label: string;
        icon: string;
        variant: 'tinted' | 'emergency';
        onPress: () => void;
    }> = [
        { label: t('patient.findDoctors'), icon: 'magnify', variant: 'tinted', onPress: () => navigation.navigate('DoctorSearchScreen') },
        { label: t('patient.symptomChecker'), icon: 'stethoscope', variant: 'tinted', onPress: () => navigation.navigate('SymptomCheck') },
        { label: t('patient.healthRecords'), icon: 'folder-heart-outline', variant: 'tinted', onPress: () => navigation.navigate('Records') },
        { label: t('patient.emergency'), icon: 'phone-alert', variant: 'emergency', onPress: () => navigation.navigate('EmergencyScreen') },
    ];

    const categoryMap: Record<string, string> = {
        nutrition: 'Nutrition', exercise: 'Exercise', mental_health: 'Mental Health',
        disease_prevention: 'Prevention', first_aid: 'First Aid', maternal_health: 'Maternal',
        child_health: 'Child Health', elderly_care: 'Elderly Care',
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ padding: spacing.xl }}>
                    <SkeletonList count={2} ItemSkeleton={AppointmentCardSkeleton} />
                    <SkeletonList count={3} ItemSkeleton={DoctorCardSkeleton} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
                {/* Header */}
                <FadeIn delay={0}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.greeting}>{getGreeting()}</Text>
                            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                        </View>
                        <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Profile', { screen: 'NotificationsScreen' })} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textPrimary} />
                            <View style={styles.notifDot} />
                        </TouchableOpacity>
                    </View>
                </FadeIn>

                {/* Search Bar */}
                <FadeIn delay={50}>
                    <TouchableOpacity style={styles.searchBar} activeOpacity={0.7} onPress={() => navigation.navigate('DoctorSearchScreen')}>
                        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
                        <Text style={styles.searchText}>{t('patient.searchDoctors')}</Text>
                    </TouchableOpacity>
                </FadeIn>

                {/* Upcoming Appointment — the only place a gradient appears, reserved for hero */}
                {upcomingAppt && (
                    <FadeIn delay={100}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => navigation.navigate('Appointments', { screen: 'AppointmentDetailScreen', params: { appointmentId: upcomingAppt._id } })}
                        >
                            <LinearGradient
                                colors={gradients.hero}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.upcomingCard}
                            >
                                <View style={styles.upcomingBadge}>
                                    <MaterialCommunityIcons name="clock-outline" size={12} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.upcomingBadgeText}>{t('patient.upcoming')}</Text>
                                </View>
                                <View style={styles.upcomingHeader}>
                                    <View style={styles.upcomingInfo}>
                                        <Text style={styles.upcomingDoctor}>
                                            Dr. {upcomingAppt.doctorId?.userId?.firstName} {upcomingAppt.doctorId?.userId?.lastName}
                                        </Text>
                                        <Text style={styles.upcomingSpecialty}>
                                            {upcomingAppt.doctorId?.specialization?.[0] || 'Doctor'}
                                        </Text>
                                    </View>
                                    <View style={styles.upcomingAvatar}>
                                        <MaterialCommunityIcons name="doctor" size={28} color="rgba(255,255,255,0.9)" />
                                    </View>
                                </View>
                                <View style={styles.upcomingDetails}>
                                    <View style={styles.upcomingDetailItem}>
                                        <MaterialCommunityIcons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                                        <Text style={styles.upcomingDetailText}>
                                            {new Date(upcomingAppt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {upcomingAppt.startTime}
                                        </Text>
                                    </View>
                                    <View style={styles.upcomingDetailDivider} />
                                    <View style={styles.upcomingDetailItem}>
                                        <MaterialCommunityIcons name={upcomingAppt.type === 'video' ? 'video-outline' : 'chat-outline'} size={14} color="rgba(255,255,255,0.8)" />
                                        <Text style={styles.upcomingDetailText}>{upcomingAppt.type === 'video' ? t('patient.videoCall') : t('patient.chat')}</Text>
                                    </View>
                                </View>
                                <View style={styles.joinBtn}>
                                    <Text style={styles.joinBtnText}>{t('consultation.startChat')}</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={16} color={colors.primary} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </FadeIn>
                )}

                {/* Quick Actions — flat cards, single accent variant per item, no rainbow */}
                <FadeIn delay={150}>
                    <View style={styles.quickGrid}>
                        {quickActions.map((action, i) => (
                            <TouchableOpacity key={i} style={styles.quickCard} activeOpacity={0.7} onPress={action.onPress}>
                                <IconWrap name={action.icon} variant={action.variant} size="lg" />
                                <Text style={styles.quickLabel}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </FadeIn>

                {/* Specializations — outlined glyphs, all in primary teal */}
                <FadeIn delay={200}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t('patient.specializations')}</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('DoctorSearchScreen')} activeOpacity={0.7}>
                                <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.lg, paddingRight: spacing.md }}>
                            {specializations.map((spec, i) => (
                                <TouchableOpacity key={i} style={styles.specCard} activeOpacity={0.7} onPress={() => navigation.navigate('DoctorSearchScreen', { specialization: spec.name })}>
                                    <IconWrap name={spec.icon} variant="outlined" size="lg" />
                                    <Text style={styles.specName} numberOfLines={2}>{spec.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </FadeIn>

                {/* Health Tips */}
                <FadeIn delay={250}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t('patient.healthTips')}</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('HealthTipsScreen')} activeOpacity={0.7}>
                                <Text style={styles.seeAll}>See All</Text>
                            </TouchableOpacity>
                        </View>
                        {healthTips.length === 0 && (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="lightbulb-outline" size={32} color={colors.textDisabled} />
                                <Text style={styles.emptyText}>{t('patient.noHealthTips')}</Text>
                            </View>
                        )}
                        {healthTips.map((tip: any) => (
                            <TouchableOpacity key={tip._id} style={styles.tipCard} activeOpacity={0.7} onPress={() => navigation.navigate('HealthTipDetailScreen', { tip })}>
                                <IconWrap name="leaf" variant="tinted" size="md" />
                                <View style={styles.tipInfo}>
                                    <Text style={styles.tipTitle} numberOfLines={1}>{tip.title}</Text>
                                    <Text style={styles.tipMeta}>{categoryMap[tip.category] || tip.category} · {tip.viewCount} views</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </FadeIn>
            </ScrollView>
        </SafeAreaView>
    );
};

const CARD_WIDTH = (width - spacing.xl * 2 - spacing.md) / 2;

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 100 },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    headerLeft: {},
    greeting: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '500' },
    userName: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 2, letterSpacing: -0.3 },
    notifBtn: { width: 44, height: 44, borderRadius: borderRadius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    notifDot: { position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error, borderWidth: 1.5, borderColor: colors.surface },

    // Search
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2, marginBottom: spacing.xl, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
    searchText: { ...typography.body, color: colors.textDisabled },

    // Upcoming Card
    upcomingCard: { borderRadius: borderRadius.lg, padding: spacing.xl, marginBottom: spacing.xl, ...shadows.lg },
    upcomingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.full, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, alignSelf: 'flex-start', gap: 4, marginBottom: spacing.md },
    upcomingBadgeText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
    upcomingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
    upcomingInfo: { flex: 1 },
    upcomingDoctor: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
    upcomingSpecialty: { ...typography.bodySmall, color: 'rgba(255,255,255,0.75)' },
    upcomingAvatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    upcomingDetails: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
    upcomingDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    upcomingDetailText: { ...typography.bodySmall, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
    upcomingDetailDivider: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: spacing.md },
    joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: borderRadius.sm, paddingVertical: spacing.sm + 2, gap: spacing.xs },
    joinBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },

    // Quick Actions
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
    quickCard: { width: CARD_WIDTH, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.border },
    quickLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },

    // Sections
    section: { marginBottom: spacing.xl },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2 },
    seeAll: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },

    // Specializations
    specCard: { width: 76, alignItems: 'center', gap: spacing.sm },
    specName: { ...typography.caption, color: colors.textPrimary, fontWeight: '500', textAlign: 'center', lineHeight: 15 },

    // Health Tips
    tipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md + 2, marginBottom: spacing.sm, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
    tipInfo: { flex: 1 },
    tipTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    tipMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
    emptyText: { ...typography.bodySmall, color: colors.textSecondary },
});

export default HomeScreen;
