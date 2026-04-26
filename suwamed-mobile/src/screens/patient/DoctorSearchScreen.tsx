import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, typography, shadows, gradients } from '../../config/theme';
import { DoctorCardSkeleton, SkeletonList } from '../../components/common/Skeleton';
import * as doctorApi from '../../api/doctor.api';

const { width } = Dimensions.get('window');

const SPECIALIZATIONS = [
    'All',
    'General Practitioner',
    'Cardiologist',
    'Dermatologist',
    'Pediatrician',
    'Neurologist',
    'Orthopedic Surgeon',
    'Gynecologist',
    'Psychiatrist',
];

const getInitials = (firstName: string, lastName: string) => {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
};

const AVATAR_COLORS = [
    ['#2563EB', '#1D4ED8'],
    ['#0D9488', '#0F766E'],
    ['#F97316', '#EA580C'],
    ['#8B5CF6', '#7C3AED'],
    ['#EF4444', '#DC2626'],
    ['#10B981', '#059669'],
    ['#F59E0B', '#D97706'],
    ['#3B82F6', '#2563EB'],
    ['#EC4899', '#DB2777'],
    ['#6366F1', '#4F46E5'],
];

const getAvatarGradient = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 13 }) => {
    return (
        <View style={{ flexDirection: 'row', gap: 1 }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <MaterialCommunityIcons
                    key={star}
                    name={star <= Math.round(rating) ? 'star' : 'star-outline'}
                    size={size}
                    color="#F59E0B"
                />
            ))}
        </View>
    );
};

const DoctorSearchScreen: React.FC = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpec, setSelectedSpec] = useState('All');
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchDoctors = async (search?: string, spec?: string) => {
        try {
            const params: any = {};
            if (search && search.trim()) params.search = search.trim();
            if (spec && spec !== 'All') params.specialization = spec;
            const res = await doctorApi.getDoctors(params);
            setDoctors(res.data || []);
        } catch (err) {
            console.log('Doctor search error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchDoctors(searchQuery, selectedSpec);
        }, [])
    );

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            fetchDoctors(text, selectedSpec);
        }, 400);
    };

    const handleSpecSelect = (spec: string) => {
        setSelectedSpec(spec);
        setLoading(true);
        fetchDoctors(searchQuery, spec);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDoctors(searchQuery, selectedSpec);
    };

    const renderDoctorCard = ({ item }: { item: any }) => {
        const firstName = item.userId?.firstName || '';
        const lastName = item.userId?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const initials = getInitials(firstName, lastName);
        const avatarGradient = getAvatarGradient(fullName || item._id);
        const specializations = Array.isArray(item.specialization)
            ? item.specialization.join(', ')
            : item.specialization || 'General Practitioner';
        const rating = item.rating?.average || 0;
        const ratingCount = item.rating?.count || 0;
        const experience = item.experience || 0;
        const fee = item.consultationFee || 0;

        return (
            <TouchableOpacity
                style={styles.doctorCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('DoctorProfileScreen', { doctorId: item._id, doctor: item })}
            >
                <View style={styles.cardTop}>
                    <LinearGradient
                        colors={avatarGradient as any}
                        style={styles.avatarCircle}
                    >
                        <Text style={styles.avatarText}>{initials}</Text>
                    </LinearGradient>
                    <View style={styles.doctorInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.doctorName} numberOfLines={1}>
                                Dr. {fullName}
                            </Text>
                            {item.isOnline && (
                                <View style={styles.onlineBadge}>
                                    <View style={styles.onlineDot} />
                                    <Text style={styles.onlineText}>{t('common.online')}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.specialization} numberOfLines={1}>{specializations}</Text>
                        {item.hospital ? (
                            <View style={styles.hospitalRow}>
                                <MaterialCommunityIcons name="hospital-building" size={11} color={colors.textDisabled} />
                                <Text style={styles.hospital} numberOfLines={1}>{item.hospital}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <StarRating rating={rating} />
                        <Text style={styles.statLabel}>
                            {rating.toFixed(1)} ({ratingCount})
                        </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="briefcase-outline" size={13} color={colors.textSecondary} />
                        <Text style={styles.statLabel}>{experience} yrs</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="cash" size={13} color={colors.success} />
                        <Text style={[styles.statLabel, { color: colors.success, fontWeight: '700' }]}>
                            LKR {fee.toLocaleString()}
                        </Text>
                    </View>
                </View>

                <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.bookBtn}
                >
                    <Text style={styles.bookBtnText}>{t('patient.viewProfileAndBook')}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.findDoctors')}</Text>
                <View style={{ width: 42 }} />
            </View>

            {/* Search */}
            <View style={styles.searchBarWrap}>
                <View style={styles.searchIconWrap}>
                    <MaterialCommunityIcons name="magnify" size={18} color={colors.primary} />
                </View>
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('patient.searchDoctors')}
                    placeholderTextColor={colors.textDisabled}
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    returnKeyType="search"
                    autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => handleSearchChange('')} hitSlop={8}>
                        <MaterialCommunityIcons name="close-circle" size={18} color={colors.textDisabled} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
            >
                {SPECIALIZATIONS.map((spec) => {
                    const isActive = selectedSpec === spec;
                    return isActive ? (
                        <LinearGradient
                            key={spec}
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.filterChipGradient}
                        >
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleSpecSelect(spec)}
                            >
                                <Text style={styles.filterChipTextActive}>{spec}</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    ) : (
                        <TouchableOpacity
                            key={spec}
                            style={styles.filterChip}
                            activeOpacity={0.7}
                            onPress={() => handleSpecSelect(spec)}
                        >
                            <Text style={styles.filterChipText}>{spec}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Results */}
            {loading ? (
                <View style={styles.loadingWrap}>
                    <SkeletonList count={5} ItemSkeleton={DoctorCardSkeleton} />
                </View>
            ) : (
                <FlatList
                    data={doctors}
                    renderItem={renderDoctorCard}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconWrap}>
                                <MaterialCommunityIcons name="doctor" size={40} color={colors.textDisabled} />
                            </View>
                            <Text style={styles.emptyTitle}>{t('patient.noDoctorsFound')}</Text>
                            <Text style={styles.emptySubtitle}>
                                {t('patient.tryAdjustingSearch')}
                            </Text>
                        </View>
                    }
                    ListHeaderComponent={
                        doctors.length > 0 ? (
                            <Text style={styles.resultsCount}>
                                {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found
                            </Text>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -0.2,
    },

    // Search
    searchBarWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginHorizontal: spacing.xl,
        marginBottom: spacing.md,
        gap: spacing.sm,
        ...shadows.sm,
    },
    searchIconWrap: {
        width: 34,
        height: 34,
        borderRadius: borderRadius.xs,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
        padding: 0,
        paddingVertical: spacing.xs,
    },

    // Filters
    filterScroll: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.md,
        gap: spacing.sm,
    },
    filterChip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 1,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
        ...shadows.sm,
    },
    filterChipGradient: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 1,
        borderRadius: borderRadius.full,
    },
    filterChipText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    filterChipTextActive: {
        ...typography.bodySmall,
        color: '#fff',
        fontWeight: '600',
    },

    // Loading
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    loadingText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },

    // List
    listContent: {
        paddingHorizontal: spacing.xl,
        paddingBottom: 100,
    },
    resultsCount: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        fontWeight: '500',
    },

    // Card
    doctorCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    avatarCircle: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    doctorInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flexWrap: 'wrap',
    },
    doctorName: {
        ...typography.body,
        fontWeight: '700',
        color: colors.textPrimary,
        flex: 1,
    },
    onlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.successLight,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        gap: 4,
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
    },
    onlineText: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.success,
    },
    specialization: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginTop: 2,
    },
    hospitalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 3,
    },
    hospital: {
        ...typography.caption,
        color: colors.textDisabled,
        flex: 1,
    },
    cardDivider: {
        height: 1,
        backgroundColor: colors.borderLight,
        marginVertical: spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    statDivider: {
        width: 1,
        height: 18,
        backgroundColor: colors.borderLight,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        flexShrink: 1,
    },
    bookBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.sm + 3,
        gap: spacing.xs,
    },
    bookBtnText: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: '#fff',
    },

    // Empty
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxxxl * 2,
        gap: spacing.sm,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.xxl,
        backgroundColor: colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    emptySubtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: spacing.xxxl,
    },
});

export default DoctorSearchScreen;
