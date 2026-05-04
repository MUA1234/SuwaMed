import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const FAQS = [
    {
        q: 'How do I book an appointment?',
        a: 'Browse our doctors, select one that suits your needs, choose your preferred time slot, and complete the booking. Your appointment will be confirmed after payment.',
    },
    {
        q: 'How does video consultation work?',
        a: "Once your appointment is confirmed, you'll receive a join link. Click 'Join Consultation' at your appointment time to connect with your doctor via video call.",
    },
    {
        q: 'Can I cancel an appointment?',
        a: 'Yes, you can cancel an appointment up to 2 hours before the scheduled time. Go to My Appointments, select the appointment, and tap Cancel.',
    },
    {
        q: 'Is my health data secure?',
        a: 'Yes, SuwaMed uses industry-standard encryption to protect your data. Your health records and personal information are only accessible by you and your treating doctors.',
    },
    {
        q: 'How do I upload health records?',
        a: 'Go to Health Records tab and tap the upload button. You can add details like title, category, and doctor information for each record.',
    },
];

const HelpSupportScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setExpandedIndex((prev) => (prev === index ? null : index));
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.helpSupport')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroBanner}>
                    <View style={styles.heroIcon}>
                        <MaterialCommunityIcons name="help-circle" size={36} color={colors.primary} />
                    </View>
                    <Text style={styles.heroTitle}>{t('patient.howCanWeHelp')}</Text>
                    <Text style={styles.heroSubtitle}>{t('patient.findAnswers')}</Text>
                </View>

                <Text style={styles.sectionLabel}>{t('patient.faq')}</Text>

                {FAQS.map((faq, index) => {
                    const isOpen = expandedIndex === index;
                    return (
                        <View key={index} style={styles.faqCard}>
                            <TouchableOpacity
                                style={styles.faqQuestion}
                                onPress={() => toggleFAQ(index)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.faqQuestionText}>{faq.q}</Text>
                                <MaterialCommunityIcons
                                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                            {isOpen ? (
                                <View style={styles.faqAnswer}>
                                    <Text style={styles.faqAnswerText}>{faq.a}</Text>
                                </View>
                            ) : null}
                        </View>
                    );
                })}

                <Text style={styles.sectionLabel}>{t('common.contactUs')}</Text>

                <View style={styles.contactCard}>
                    <TouchableOpacity
                        style={styles.contactRow}
                        onPress={() => Alert.alert('Support', 'Opening email client...')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.contactIconWrap, { backgroundColor: colors.primaryLight }]}>
                            <MaterialCommunityIcons name="email-outline" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>{t('common.emailSupport')}</Text>
                            <Text style={styles.contactValue}>support@suwamed.lk</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.contactAction}
                            onPress={() => Alert.alert('Opening email...', 'support@suwamed.lk')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.contactActionText}>{t('auth.email')}</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={styles.contactRow}
                        onPress={() => Alert.alert('Support', 'Calling +94 11 234 5678...')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.contactIconWrap, { backgroundColor: colors.successLight }]}>
                            <MaterialCommunityIcons name="phone-outline" size={20} color={colors.success} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>{t('common.phoneSupport')}</Text>
                            <Text style={styles.contactValue}>+94 11 234 5678</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.contactAction, { backgroundColor: colors.successLight }]}
                            onPress={() => Alert.alert('Calling...', '+94 11 234 5678')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.contactActionText, { color: colors.success }]}>Call</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>

                <View style={styles.appInfoCard}>
                    <Text style={styles.appInfoTitle}>{t('common.appInfo')}</Text>
                    <View style={styles.appInfoRow}>
                        <Text style={styles.appInfoLabel}>Version</Text>
                        <Text style={styles.appInfoValue}>1.0.0</Text>
                    </View>
                    <View style={styles.appInfoRow}>
                        <Text style={styles.appInfoLabel}>Copyright</Text>
                        <Text style={styles.appInfoValue}>© 2025 SuwaMed</Text>
                    </View>
                </View>
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
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    heroBanner: { alignItems: 'center', paddingVertical: spacing.xxl },
    heroIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    heroTitle: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
    heroSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
    sectionLabel: {
        ...typography.bodySmall,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    faqCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    faqQuestion: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
    },
    faqQuestionText: { flex: 1, ...typography.body, fontWeight: '600', color: colors.textPrimary },
    faqAnswer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    faqAnswerText: { ...typography.body, color: colors.textSecondary, lineHeight: 24, paddingTop: spacing.md },
    contactCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    contactRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm },
    contactIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    contactInfo: { flex: 1 },
    contactLabel: { ...typography.caption, color: colors.textSecondary },
    contactValue: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary, marginTop: 2 },
    contactAction: {
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
    },
    contactActionText: { fontSize: 13, fontWeight: '600', color: colors.primary },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
    appInfoCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    appInfoTitle: { ...typography.bodySmall, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.md },
    appInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
    appInfoLabel: { ...typography.body, color: colors.textSecondary },
    appInfoValue: { ...typography.body, fontWeight: '500', color: colors.textPrimary },
});

export default HelpSupportScreen;
