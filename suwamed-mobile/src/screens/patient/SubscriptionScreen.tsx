import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as patientApi from '../../api/patient.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import IconWrap, { IconWrapVariant } from '../../components/common/IconWrap';

// Free → sage success, Basic → primary teal, Premium → warm sand accent.
// Three meaningful tiers, three palette tokens, no rainbow.
type PlanVariant = 'success' | 'tinted' | 'accent';
interface Plan {
    key: string;
    name: string;
    price: string;
    priceLabel: string;
    variant: PlanVariant;
    features: string[];
    icon: string;
}

const PLANS: Plan[] = [
    {
        key: 'free',
        name: 'Free',
        price: 'LKR 0',
        priceLabel: '/month',
        variant: 'success',
        icon: 'leaf-outline',
        features: [
            '2 consultations/month',
            'Basic health records',
            'Symptom checker',
        ],
    },
    {
        key: 'basic',
        name: 'Basic',
        price: 'LKR 990',
        priceLabel: '/month',
        variant: 'tinted',
        icon: 'shield-star-outline',
        features: [
            '10 consultations/month',
            'Full health records',
            'AI symptom checker',
            'Priority support',
        ],
    },
    {
        key: 'premium',
        name: 'Premium',
        price: 'LKR 2,490',
        priceLabel: '/month',
        variant: 'accent',
        icon: 'crown-outline',
        features: [
            'Unlimited consultations',
            'All features included',
            'Specialist access',
            '24/7 support',
            'Family plan',
        ],
    },
];

const variantColor = (colors: ThemeColors, v: PlanVariant) =>
    v === 'success' ? colors.success : v === 'accent' ? colors.secondary : colors.primary;

const SubscriptionScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [currentPlan, setCurrentPlan] = useState<string>('free');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await patientApi.getProfile();
                const plan = res.data?.patient?.subscription?.plan || 'free';
                setCurrentPlan(plan);
            } catch (err) {
                console.log('Subscription fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUpgrade = (plan: Plan) => {
        if (plan.key === currentPlan) return;
        Alert.alert(
            'Upgrade Plan',
            `Online payment for the ${plan.name} plan (${plan.price}/month) is processed via PayHere. Please contact support@suwamed.lk to upgrade — we will activate your plan within 24 hours of payment confirmation.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Email Support',
                    onPress: () => {
                        const subject = encodeURIComponent(`Subscription upgrade — ${plan.name}`);
                        const body = encodeURIComponent(`I would like to upgrade to the ${plan.name} plan (${plan.price}/month).`);
                        Linking.openURL(`mailto:support@suwamed.lk?subject=${subject}&body=${body}`).catch(() => {});
                    },
                },
            ]
        );
    };

    const currentPlanData = PLANS.find((p) => p.key === currentPlan) || PLANS[0];

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.subscription')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Current Plan Badge */}
                <View style={styles.currentPlanBanner}>
                    <IconWrap name={currentPlanData.icon} variant={currentPlanData.variant} size="lg" />
                    <View>
                        <Text style={styles.currentPlanLabel}>{t('patient.currentPlan')}</Text>
                        <Text style={[styles.currentPlanName, { color: variantColor(colors, currentPlanData.variant) }]}>
                            {currentPlanData.name}
                        </Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>{t('patient.availablePlans')}</Text>

                {PLANS.map((plan) => {
                    const isActive = plan.key === currentPlan;
                    const tone = variantColor(colors, plan.variant);
                    return (
                        <View
                            key={plan.key}
                            style={[
                                styles.planCard,
                                isActive && { borderColor: tone, borderWidth: 1.5 },
                            ]}
                        >
                            {isActive && (
                                <View style={[styles.activeBadge, { backgroundColor: tone }]}>
                                    <Text style={styles.activeBadgeText}>{t('patient.currentPlan')}</Text>
                                </View>
                            )}
                            <View style={styles.planHeader}>
                                <IconWrap name={plan.icon} variant={plan.variant} size="md" />
                                <View style={styles.planTitleWrap}>
                                    <Text style={styles.planName}>{plan.name}</Text>
                                    <View style={styles.priceRow}>
                                        <Text style={[styles.planPrice, { color: tone }]}>{plan.price}</Text>
                                        <Text style={styles.planPriceLabel}>{plan.priceLabel}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.featureList}>
                                {plan.features.map((feature, i) => (
                                    <View key={i} style={styles.featureRow}>
                                        <MaterialCommunityIcons
                                            name="check-circle-outline"
                                            size={16}
                                            color={tone}
                                        />
                                        <Text style={styles.featureText}>{feature}</Text>
                                    </View>
                                ))}
                            </View>

                            {isActive ? (
                                <View style={[styles.currentBtn, { backgroundColor: colors.borderLight }]}>
                                    <MaterialCommunityIcons name="check" size={18} color={tone} />
                                    <Text style={[styles.currentBtnText, { color: tone }]}>{t('patient.currentPlan')}</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.upgradeBtn, { backgroundColor: tone }]}
                                    onPress={() => handleUpgrade(plan)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.upgradeBtnText}>Upgrade to {plan.name}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                })}

                <Text style={styles.disclaimer}>
                    All prices are in LKR and billed monthly. You can cancel at any time.
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
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    currentPlanBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        marginTop: spacing.xl,
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.lg,
    },
    currentPlanLabel: { ...typography.caption, color: colors.textSecondary },
    currentPlanName: { ...typography.h2 },
    sectionTitle: {
        ...typography.bodySmall,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.lg,
    },
    planCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    activeBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderBottomLeftRadius: borderRadius.sm,
    },
    activeBadgeText: { ...typography.caption, color: '#fff', fontWeight: '700' },
    planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.md },
    planTitleWrap: { flex: 1 },
    planName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
    planPrice: { fontSize: 18, fontWeight: '700' },
    planPriceLabel: { ...typography.caption, color: colors.textSecondary },
    featureList: { gap: spacing.sm, marginBottom: spacing.lg },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    featureText: { ...typography.bodySmall, color: colors.textPrimary },
    upgradeBtn: {
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    currentBtn: {
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    currentBtnText: { fontWeight: '700', fontSize: 15 },
    disclaimer: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.md,
    },
});

export default SubscriptionScreen;
