import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import * as doctorApi from '../../api/doctor.api';

const getInitials = (firstName: string, lastName: string) =>
    `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();

const StarRating: React.FC<{ rating: number; size?: number; color: string }> = ({ rating, size = 16, color }) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
            <MaterialCommunityIcons
                key={star}
                name={
                    star <= Math.floor(rating)
                        ? 'star'
                        : star - 0.5 <= rating
                        ? 'star-half-full'
                        : 'star-outline'
                }
                size={size}
                color={color}
            />
        ))}
    </View>
);

const DoctorProfileScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { doctorId, doctor: initialDoctor } = route.params || {};

    const [doctor, setDoctor] = useState<any>(initialDoctor || null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(!initialDoctor);
    const [reviewsLoading, setReviewsLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [docRes, reviewRes] = await Promise.all([
                doctorApi.getDoctorById(doctorId),
                doctorApi.getDoctorReviews(doctorId),
            ]);
            setDoctor(docRes.data || docRes);
            setReviews((reviewRes.data || []).slice(0, 3));
        } catch (err) {
            console.log('Doctor profile fetch error:', err);
            Alert.alert(t('common.error'), t('patient.failedLoadDoctorProfile'));
        } finally {
            setLoading(false);
            setReviewsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [doctorId])
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    if (!doctor) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.errorState}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={56} color={colors.textDisabled} />
                    <Text style={styles.errorText}>{t('doctor.doctorNotAvailable')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const firstName = doctor.userId?.firstName || '';
    const lastName = doctor.userId?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const initials = getInitials(firstName, lastName);
    const specializations = Array.isArray(doctor.specialization)
        ? doctor.specialization.join(', ')
        : doctor.specialization || 'General Practitioner';
    const rating = doctor.rating?.average || 0;
    const ratingCount = doctor.rating?.count || 0;
    const experience = doctor.experience || 0;
    const fee = doctor.consultationFee || 0;
    const totalConsultations = doctor.totalConsultations || 0;
    const qualifications = Array.isArray(doctor.qualifications) ? doctor.qualifications : [];
    const languages = Array.isArray(doctor.languages) ? doctor.languages : [];
    const bio = doctor.bio || doctor.about || '';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.doctorProfile')}</Text>
                <TouchableOpacity style={styles.shareBtn}>
                    <MaterialCommunityIcons name="share-variant-outline" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Hero */}
                <View style={styles.profileHero}>
                    <View style={styles.largeAvatar}>
                        <Text style={styles.largeAvatarText}>{initials}</Text>
                    </View>
                    <Text style={styles.doctorName}>Dr. {fullName}</Text>
                    <Text style={styles.specialization}>{specializations}</Text>
                    {doctor.hospital ? (
                        <View style={styles.hospitalRow}>
                            <MaterialCommunityIcons name="hospital-building" size={14} color={colors.textSecondary} />
                            <Text style={styles.hospitalText}>{doctor.hospital}</Text>
                        </View>
                    ) : null}
                    <View style={styles.badgesRow}>
                        {doctor.isOnline ? (
                            <View style={styles.onlineBadge}>
                                <View style={styles.onlineDot} />
                                <Text style={styles.onlineText}>{t('doctor.availableNow')}</Text>
                            </View>
                        ) : (
                            <View style={styles.offlineBadge}>
                                <View style={styles.offlineDot} />
                                <Text style={styles.offlineText}>{t('common.offline')}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <View style={styles.statIconWrap}>
                            <MaterialCommunityIcons name="star" size={20} color={colors.secondary} />
                        </View>
                        <Text style={styles.statValue}>{rating.toFixed(1)}</Text>
                        <Text style={styles.statLabel}>{t('patient.rating')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={styles.statIconWrap}>
                            <MaterialCommunityIcons name="account-group" size={20} color={colors.secondary} />
                        </View>
                        <Text style={styles.statValue}>{totalConsultations}+</Text>
                        <Text style={styles.statLabel}>{t('doctor.patients')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={styles.statIconWrap}>
                            <MaterialCommunityIcons name="briefcase" size={20} color={colors.primary} />
                        </View>
                        <Text style={styles.statValue}>{experience}</Text>
                        <Text style={styles.statLabel}>{t('patient.yrsExp')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={styles.statIconWrap}>
                            <MaterialCommunityIcons name="cash" size={20} color={colors.success} />
                        </View>
                        <Text style={[styles.statValue, { fontSize: 13 }]}>LKR {fee.toLocaleString()}</Text>
                        <Text style={styles.statLabel}>{t('patient.fee')}</Text>
                    </View>
                </View>

                {/* About */}
                {bio ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('patient.aboutDoctor')}</Text>
                        <Text style={styles.bioText}>{bio}</Text>
                    </View>
                ) : null}

                {/* Qualifications */}
                {qualifications.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('doctor.qualifications')}</Text>
                        {qualifications.map((q: any, i: number) => (
                            <View key={i} style={styles.listItem}>
                                <View style={styles.listDot} />
                                <Text style={styles.listItemText}>
                                    {typeof q === 'string' ? q : `${q.degree || ''}${q.institution ? ` – ${q.institution}` : ''}${q.year ? ` (${q.year})` : ''}`}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Languages */}
                {languages.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('doctor.languagesSpoken')}</Text>
                        <View style={styles.languageRow}>
                            {languages.map((lang: string, i: number) => (
                                <View key={i} style={styles.languageChip}>
                                    <MaterialCommunityIcons name="translate" size={13} color={colors.primary} />
                                    <Text style={styles.languageText}>{lang}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Reviews */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>{t('doctor.patientReviews')}</Text>
                        <View style={styles.ratingBadge}>
                            <MaterialCommunityIcons name="star" size={14} color={colors.secondary} />
                            <Text style={styles.ratingBadgeText}>
                                {rating.toFixed(1)} · {ratingCount} reviews
                            </Text>
                        </View>
                    </View>
                    {reviewsLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: spacing.lg }} />
                    ) : reviews.length > 0 ? (
                        reviews.map((review: any, i: number) => (
                            <View key={i} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.reviewAvatar}>
                                        <Text style={styles.reviewAvatarText}>
                                            {(review.patientId?.userId?.firstName || 'P').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.reviewerName}>
                                            {review.patientId?.userId?.firstName
                                                ? `${review.patientId.userId.firstName} ${review.patientId.userId.lastName || ''}`
                                                : 'Anonymous Patient'}
                                        </Text>
                                        <StarRating rating={review.rating || 0} size={13} color={colors.secondary} />
                                    </View>
                                    <Text style={styles.reviewDate}>
                                        {review.createdAt
                                            ? new Date(review.createdAt).toLocaleDateString('en-US', {
                                                  month: 'short',
                                                  day: 'numeric',
                                              })
                                            : ''}
                                    </Text>
                                </View>
                                {review.comment ? (
                                    <Text style={styles.reviewComment}>{review.comment}</Text>
                                ) : null}
                            </View>
                        ))
                    ) : (
                        <View style={styles.noReviews}>
                            <MaterialCommunityIcons name="star-outline" size={32} color={colors.textDisabled} />
                            <Text style={styles.noReviewsText}>{t('doctor.noReviews')}</Text>
                        </View>
                    )}
                </View>

                {/* Bottom spacing for sticky button */}
                <View style={{ height: 90 }} />
            </ScrollView>

            {/* Sticky Book Button */}
            <View style={styles.stickyBottom}>
                <TouchableOpacity
                    style={styles.bookBtn}
                    activeOpacity={0.85}
                    onPress={() =>
                        navigation.navigate('BookAppointmentScreen', {
                            doctorId: doctor._id,
                            doctor,
                        })
                    }
                >
                    <MaterialCommunityIcons name="calendar-plus" size={20} color="#fff" />
                    <Text style={styles.bookBtnText}>{t('patient.bookAppointment')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    headerTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    shareBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
    },
    profileHero: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    largeAvatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        backgroundColor: colors.primary,
    },
    largeAvatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    doctorName: {
        ...typography.h2,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    specialization: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    hospitalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: spacing.xs,
    },
    hospitalText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    onlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.successLight,
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        gap: 5,
    },
    onlineDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: colors.success,
    },
    onlineText: {
        ...typography.bodySmall,
        color: colors.success,
        fontWeight: '600',
    },
    offlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.borderLight,
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        gap: 5,
    },
    offlineDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: colors.textDisabled,
    },
    offlineText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xl,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: spacing.xs,
    },
    statIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    statDivider: {
        width: 1,
        backgroundColor: colors.border,
        alignSelf: 'stretch',
        marginHorizontal: 2,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.warningLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    ratingBadgeText: {
        ...typography.caption,
        color: colors.warning,
        fontWeight: '600',
    },
    bioText: {
        ...typography.body,
        color: colors.textSecondary,
        lineHeight: 24,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    listDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary,
        marginTop: 7,
    },
    listItemText: {
        ...typography.body,
        color: colors.textSecondary,
        flex: 1,
        lineHeight: 22,
    },
    languageRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    languageChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: colors.primaryLight,
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 1,
    },
    languageText: {
        ...typography.bodySmall,
        color: colors.primary,
        fontWeight: '500',
    },
    reviewCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.sm,
    },
    reviewAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewAvatarText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.primary,
    },
    reviewerName: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 3,
    },
    reviewDate: {
        ...typography.caption,
        color: colors.textDisabled,
    },
    reviewComment: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    noReviews: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        gap: spacing.sm,
    },
    noReviewsText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    stickyBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        paddingBottom: spacing.xl,
    },
    bookBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        gap: spacing.sm,
    },
    bookBtnText: {
        ...typography.button,
        color: '#fff',
        textTransform: 'none',
        fontSize: 16,
    },
    errorState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    errorText: {
        ...typography.body,
        color: colors.textSecondary,
    },
});

export default DoctorProfileScreen;
