import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useToast } from '../../components/common/Toast';
import client from '../../api/client';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const ReviewDoctorScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const route = useRoute<any>();
    const { appointment } = route.params as { appointment: any };

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();

    const doctorUser = appointment?.doctorId?.userId;
    const doctorName = doctorUser ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}` : 'Doctor';
    const specialty = appointment?.doctorId?.specialization?.[0] || 'General Practitioner';
    const doctorId = appointment?.doctorId?._id;

    const handleSubmit = async () => {
        if (rating === 0) {
            showToast('warning', 'Rating Required', 'Please select a star rating before submitting.');
            return;
        }
        setSubmitting(true);
        try {
            await client.post('/reviews', {
                appointmentId: appointment._id,
                doctorId,
                rating,
                comment: comment.trim(),
                isAnonymous,
            });
            showToast('success', 'Review Submitted!', 'Thank you for your feedback.');
            navigation.goBack();
        } catch (err) {
            showToast('error', 'Error', 'Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.rateYourDoctor')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {/* Doctor Mini Card */}
                <View style={styles.doctorCard}>
                    <View style={styles.doctorAvatar}>
                        <MaterialCommunityIcons name="doctor" size={36} color={colors.primary} />
                    </View>
                    <View style={styles.doctorInfo}>
                        <Text style={styles.doctorName}>{doctorName}</Text>
                        <Text style={styles.doctorSpec}>{specialty}</Text>
                    </View>
                    <View style={styles.consultedBadge}>
                        <Text style={styles.consultedText}>Consulted</Text>
                    </View>
                </View>

                {/* Star Rating */}
                <View style={styles.ratingSection}>
                    <Text style={styles.ratingPrompt}>{t('patient.howWasExperience')}</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                                <MaterialCommunityIcons
                                    name={star <= rating ? 'star' : 'star-outline'}
                                    size={44}
                                    color={star <= rating ? colors.warning : colors.textDisabled}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    {rating > 0 && (
                        <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
                    )}
                </View>

                {/* Anonymous Toggle */}
                <TouchableOpacity style={styles.anonymousRow} onPress={() => setIsAnonymous(!isAnonymous)} activeOpacity={0.7}>
                    <View style={[styles.checkbox, isAnonymous && styles.checkboxActive]}>
                        {isAnonymous && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                    </View>
                    <View style={styles.anonymousInfo}>
                        <Text style={styles.anonymousLabel}>{t('patient.submitAnonymously')}</Text>
                        <Text style={styles.anonymousSubtext}>Your name will not be shown with this review</Text>
                    </View>
                </TouchableOpacity>

                {/* Comment Input */}
                <View style={styles.commentSection}>
                    <Text style={styles.commentLabel}>Comments (Optional)</Text>
                    <TextInput
                        style={styles.commentInput}
                        value={comment}
                        onChangeText={setComment}
                        placeholder="Share details about your experience..."
                        placeholderTextColor={colors.textDisabled}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        maxLength={500}
                    />
                    <Text style={styles.charCount}>{comment.length}/500</Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitBtn, (submitting || rating === 0) && styles.submitBtnDisabled]}
                    activeOpacity={0.8}
                    onPress={handleSubmit}
                    disabled={submitting || rating === 0}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="send" size={20} color="#fff" />
                            <Text style={styles.submitBtnText}>{t('patient.submitReview')}</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.privacyNote}>
                    Your review helps other patients make informed decisions about their healthcare.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
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
    headerTitle: { ...typography.h3, color: colors.textPrimary },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 60 },
    doctorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    doctorAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    doctorInfo: { flex: 1 },
    doctorName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
    doctorSpec: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    consultedBadge: {
        backgroundColor: colors.successLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: 8,
    },
    consultedText: { fontSize: 11, color: colors.success, fontWeight: '600' },
    ratingSection: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.xxl,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    ratingPrompt: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xl },
    starsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    ratingLabel: { ...typography.body, fontWeight: '600', color: colors.warning },
    anonymousRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    anonymousInfo: { flex: 1 },
    anonymousLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary },
    anonymousSubtext: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    commentSection: { marginBottom: spacing.xl },
    commentLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
    commentInput: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        ...typography.body,
        color: colors.textPrimary,
        minHeight: 120,
    },
    charCount: { ...typography.caption, color: colors.textDisabled, textAlign: 'right', marginTop: spacing.xs },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    submitBtnDisabled: { opacity: 0.5 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    privacyNote: { ...typography.caption, color: colors.textDisabled, textAlign: 'center', lineHeight: 18 },
});

export default ReviewDoctorScreen;
