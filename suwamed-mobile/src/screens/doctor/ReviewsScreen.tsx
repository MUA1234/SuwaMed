import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as doctorApi from '../../api/doctor.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const StarRow: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    return (
        <View style={{ flexDirection: 'row', gap: 2 }}>
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

const ReviewsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [doctorId, setDoctorId] = useState<string | null>(null);
    const [rating, setRating] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const profileRes = await doctorApi.getDoctorProfile();
            const profileData = profileRes.data || profileRes;
            const doctor = profileData.doctor || profileData;
            const id = doctor._id;
            setDoctorId(id);
            setRating(doctor.rating || null);

            if (id) {
                const reviewsRes = await doctorApi.getDoctorReviews(id);
                setReviews(reviewsRes.data || reviewsRes || []);
            }
        } catch (err) {
            console.log('Reviews fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const avgRating = rating?.average || 0;
    const totalReviews = rating?.count || reviews.length;
    const ratingBreakdown = rating?.breakdown || {};

    const breakdownBars = [5, 4, 3, 2, 1].map((star) => {
        const count = ratingBreakdown[star] || 0;
        const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        return { star, count, pct };
    });

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('doctor.myReviews')}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('doctor.myReviews')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={reviews}
                keyExtractor={(item) => item._id || String(Math.random())}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                ListHeaderComponent={
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryLeft}>
                            <Text style={styles.ratingNumber}>{avgRating.toFixed(1)}</Text>
                            <StarRow rating={avgRating} size={20} />
                            <Text style={styles.reviewCount}>{totalReviews} review{totalReviews !== 1 ? 's' : ''}</Text>
                        </View>
                        <View style={styles.summaryRight}>
                            {breakdownBars.map(({ star, count, pct }) => (
                                <View key={star} style={styles.barRow}>
                                    <Text style={styles.barStarLabel}>{star}</Text>
                                    <MaterialCommunityIcons name="star" size={10} color="#F59E0B" />
                                    <View style={styles.barTrack}>
                                        <View style={[styles.barFill, { width: `${pct}%` }]} />
                                    </View>
                                    <Text style={styles.barCount}>{count}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                }
                renderItem={({ item }) => {
                    const patientUser = item.patientId?.userId || item.patientId;
                    const reviewerName = item.isAnonymous
                        ? 'Anonymous'
                        : patientUser
                            ? `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim() || 'Patient'
                            : 'Patient';
                    const initials = item.isAnonymous
                        ? '?'
                        : reviewerName !== 'Patient'
                            ? reviewerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                            : 'P';
                    const dateStr = item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '';

                    return (
                        <View style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <View style={styles.reviewAvatar}>
                                    <Text style={styles.reviewInitials}>{initials}</Text>
                                </View>
                                <View style={styles.reviewMeta}>
                                    <Text style={styles.reviewerName}>{reviewerName}</Text>
                                    <StarRow rating={item.rating || 0} size={14} />
                                </View>
                                <Text style={styles.reviewDate}>{dateStr}</Text>
                            </View>
                            {item.comment ? (
                                <Text style={styles.reviewComment}>{item.comment}</Text>
                            ) : null}
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="star-outline" size={56} color={colors.textDisabled} />
                        <Text style={styles.emptyTitle}>{t('doctor.noReviews')}</Text>
                        <Text style={styles.emptySubtitle}>{t('doctor.reviewsAppearHere')}</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    summaryCard: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        marginTop: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    summaryLeft: { alignItems: 'center', justifyContent: 'center', paddingRight: spacing.xl, borderRightWidth: 1, borderRightColor: colors.border, marginRight: spacing.xl },
    ratingNumber: { fontSize: 44, fontWeight: '700', color: colors.textPrimary, lineHeight: 48 },
    reviewCount: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    summaryRight: { flex: 1, justifyContent: 'center', gap: spacing.xs },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    barStarLabel: { fontSize: 12, color: colors.textSecondary, width: 10, textAlign: 'right' },
    barTrack: { flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 },
    barCount: { fontSize: 11, color: colors.textSecondary, width: 20, textAlign: 'right' },
    reviewCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    reviewAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    reviewInitials: { fontSize: 14, fontWeight: '700', color: colors.primary },
    reviewMeta: { flex: 1 },
    reviewerName: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary },
    reviewDate: { ...typography.caption, color: colors.textSecondary },
    reviewComment: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
    emptySubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});

export default ReviewsScreen;
