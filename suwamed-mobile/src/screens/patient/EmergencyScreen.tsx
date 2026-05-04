import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import IconWrap from '../../components/common/IconWrap';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// All entries render with the same calm primary tint — only the top "Call 119" banner
// uses the crimson emergency color. Distinction comes from the icon glyphs, not bright tiles.
const EMERGENCY_NUMBERS = [
    { service: 'Police', number: '119', icon: 'police-badge' },
    { service: 'Ambulance', number: '1990', icon: 'ambulance' },
    { service: 'Fire', number: '111', icon: 'fire-truck' },
    { service: 'Disaster Mgmt', number: '117', icon: 'alert-octagon-outline' },
    { service: 'Suwaseriya', number: '1990', icon: 'hospital-building' },
    { service: 'Poison Control', number: '0112695112', icon: 'flask-outline' },
    { service: 'Mental Health', number: '1926', icon: 'brain' },
    { service: 'Traffic Police', number: '0112433333', icon: 'car-emergency' },
];

const FIRST_AID_TIPS = [
    {
        title: 'Heart Attack',
        icon: 'heart-pulse',
        steps: 'Call 1990 immediately. Help the person sit comfortably. Loosen tight clothing. If conscious and not allergic, give aspirin.',
    },
    {
        title: 'Stroke',
        icon: 'brain',
        steps: 'Note the time symptoms started. Call 1990. Keep person still and comfortable. Do not give food or water.',
    },
    {
        title: 'Choking',
        icon: 'emoticon-sick-outline',
        steps: 'Encourage coughing. Give 5 back blows. If ineffective, perform Heimlich maneuver. Call 1990 if unresponsive.',
    },
    {
        title: 'Burns',
        icon: 'fire',
        steps: 'Cool with running water for 20 minutes. Do not use ice. Cover with clean bandage. Seek medical attention.',
    },
];

const MAJOR_HOSPITALS = [
    { name: 'National Hospital of Sri Lanka', location: 'Colombo 10' },
    { name: 'Colombo South Teaching Hospital', location: 'Kalubowila, Dehiwala' },
    { name: 'Asiri Medical Hospital', location: 'Colombo 05' },
    { name: 'Lanka Hospitals', location: 'Colombo 05' },
    { name: 'Durdans Hospital', location: 'Colombo 03' },
];

const EmergencyScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [expandedTip, setExpandedTip] = useState<number | null>(null);

    const cardWidth = (width - spacing.xl * 2 - spacing.sm) / 2;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.emergency }]}>{t('patient.emergency')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity
                    style={styles.emergencyBanner}
                    onPress={() => Alert.alert('Dialing 119...', 'Please call emergency services immediately.')}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="phone-alert" size={28} color="#fff" />
                    <View style={styles.bannerTextWrap}>
                        <Text style={styles.bannerTitle}>Emergency? Call 119 immediately</Text>
                        <Text style={styles.bannerSubtitle}>Tap to call emergency services</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>{t('patient.emergencyNumbers')}</Text>

                <View style={styles.numbersGrid}>
                    {EMERGENCY_NUMBERS.map((item, index) => (
                        <View key={index} style={[styles.numberCard, { width: cardWidth }]}>
                            <IconWrap name={item.icon} variant="tinted" size="md" />
                            <Text style={styles.serviceName}>{item.service}</Text>
                            <Text style={styles.serviceNumber}>{item.number}</Text>
                            <TouchableOpacity
                                style={styles.callBtn}
                                onPress={() => Alert.alert(`Dialing ${item.number}...`, `Connecting to ${item.service}`)}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons name="phone" size={14} color="#fff" />
                                <Text style={styles.callBtnText}>Call</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <Text style={styles.sectionLabel}>{t('patient.firstAidTips')}</Text>

                {FIRST_AID_TIPS.map((tip, index) => {
                    const isOpen = expandedTip === index;
                    return (
                        <View key={index} style={styles.tipCard}>
                            <TouchableOpacity
                                style={styles.tipHeader}
                                onPress={() => setExpandedTip(isOpen ? null : index)}
                                activeOpacity={0.7}
                            >
                                <IconWrap name={tip.icon} variant="tinted" size="sm" />
                                <Text style={styles.tipTitle}>{tip.title}</Text>
                                <MaterialCommunityIcons
                                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                            {isOpen ? (
                                <View style={styles.tipContent}>
                                    <Text style={styles.tipSteps}>{tip.steps}</Text>
                                </View>
                            ) : null}
                        </View>
                    );
                })}

                <Text style={styles.sectionLabel}>{t('patient.majorHospitals')}</Text>

                <View style={styles.hospitalsCard}>
                    {MAJOR_HOSPITALS.map((hospital, index) => (
                        <View key={index} style={[styles.hospitalRow, index < MAJOR_HOSPITALS.length - 1 && styles.hospitalRowBorder]}>
                            <IconWrap name="hospital-building" variant="tinted" size="sm" />
                            <View style={styles.hospitalInfo}>
                                <Text style={styles.hospitalName}>{hospital.name}</Text>
                                <Text style={styles.hospitalLocation}>{hospital.location}</Text>
                            </View>
                        </View>
                    ))}
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
    headerTitle: { flex: 1, ...typography.h3, textAlign: 'center', fontWeight: '700' },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    emergencyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.emergency,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        gap: spacing.md,
    },
    bannerTextWrap: { flex: 1 },
    bannerTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
    bannerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
    sectionLabel: {
        ...typography.bodySmall,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    numbersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
    numberCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    serviceName: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
    serviceNumber: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    callBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 12, gap: 4, backgroundColor: colors.primary },
    callBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    tipCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    tipHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
    tipTitle: { flex: 1, ...typography.body, fontWeight: '600', color: colors.textPrimary },
    tipContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
    tipSteps: { ...typography.body, color: colors.textSecondary, lineHeight: 24, paddingTop: spacing.md },
    hospitalsCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: spacing.xl,
    },
    hospitalRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
    hospitalRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    hospitalInfo: { flex: 1 },
    hospitalName: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary },
    hospitalLocation: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});

export default EmergencyScreen;
