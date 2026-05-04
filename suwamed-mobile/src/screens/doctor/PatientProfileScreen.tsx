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
import client from '../../api/client';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import IconWrap, { IconWrapVariant } from '../../components/common/IconWrap';

const calculateAge = (dob: string): string => {
    if (!dob) return 'N/A';
    const diff = Date.now() - new Date(dob).getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return `${age} yrs`;
};

const PatientProfileScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const route = useRoute<any>();
    const { patientId, patient: paramPatient } = route.params;

    const [patient, setPatient] = useState<any>(paramPatient || null);
    const [loading, setLoading] = useState(!paramPatient);

    const fetchPatient = async () => {
        try {
            setLoading(true);
            const res = await client.get(`/doctors/patients/${patientId}`);
            setPatient(res.data?.data || res.data);
        } catch (err) {
            console.log('Patient fetch error:', err);
            Alert.alert('Error', 'Failed to load patient profile.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => {
        if (!paramPatient) fetchPatient();
    }, [patientId]));

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('doctor.patientProfile')}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    if (!patient) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('doctor.patientProfile')}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="account-off" size={56} color={colors.textDisabled} />
                    <Text style={styles.emptyText}>{t('doctor.patientNotFound')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient';
    const initials = `${(patient.firstName || '?')[0]}${(patient.lastName || '?')[0]}`.toUpperCase();
    const age = calculateAge(patient.dateOfBirth);
    const gender = patient.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : 'N/A';

    // Vitals → outlined teal. Risk flags (allergies, chronic conditions) → warning amber when present.
    const healthData: Array<{ label: string; value: string; icon: string; variant: IconWrapVariant }> = [
        { label: 'Blood Group', value: patient.bloodGroup || 'N/A', icon: 'water-outline', variant: 'outlined' },
        { label: 'Height', value: patient.height ? `${patient.height} cm` : 'N/A', icon: 'human-male-height', variant: 'outlined' },
        { label: 'Weight', value: patient.weight ? `${patient.weight} kg` : 'N/A', icon: 'scale-bathroom', variant: 'outlined' },
        {
            label: 'Allergies',
            value: patient.allergies?.length ? patient.allergies.join(', ') : 'None',
            icon: 'alert-circle-outline',
            variant: patient.allergies?.length ? 'warning' : 'outlined',
        },
        {
            label: 'Chronic Conditions',
            value: patient.chronicConditions?.length ? patient.chronicConditions.join(', ') : 'None',
            icon: 'heart-pulse',
            variant: patient.chronicConditions?.length ? 'warning' : 'outlined',
        },
    ];

    const lastVisitStr = patient.lastAppointment
        ? new Date(patient.lastAppointment.date || patient.lastAppointment).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{fullName}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.initials}>{initials}</Text>
                    </View>
                    <Text style={styles.patientName}>{fullName}</Text>
                    <View style={styles.tagRow}>
                        <View style={styles.tag}>
                            <MaterialCommunityIcons name="gender-male-female" size={12} color={colors.textSecondary} />
                            <Text style={styles.tagText}>{gender}</Text>
                        </View>
                        <View style={styles.tag}>
                            <MaterialCommunityIcons name="cake-variant" size={12} color={colors.textSecondary} />
                            <Text style={styles.tagText}>{age}</Text>
                        </View>
                    </View>
                    <View style={styles.contactRow}>
                        {patient.phone ? (
                            <View style={styles.contactItem}>
                                <MaterialCommunityIcons name="phone-outline" size={14} color={colors.textSecondary} />
                                <Text style={styles.contactText}>{patient.phone}</Text>
                            </View>
                        ) : null}
                        {patient.email ? (
                            <View style={styles.contactItem}>
                                <MaterialCommunityIcons name="email-outline" size={14} color={colors.textSecondary} />
                                <Text style={styles.contactText}>{patient.email}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{patient.totalVisits || 0}</Text>
                        <Text style={styles.statLabel}>{t('doctor.totalVisits')}</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardBorder]}>
                        <Text style={styles.statValue}>{lastVisitStr}</Text>
                        <Text style={styles.statLabel}>{t('doctor.lastVisit')}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t('patient.healthInfo')}</Text>
                    {healthData.map((item, i) => (
                        <View key={i} style={[styles.healthRow, i < healthData.length - 1 && styles.healthRowBorder]}>
                            <IconWrap name={item.icon} variant={item.variant} size="sm" />
                            <View style={styles.healthContent}>
                                <Text style={styles.healthLabel}>{item.label}</Text>
                                <Text style={styles.healthValue}>{item.value}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.actionsCard}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('PatientHealthRecordsScreen', { patientId, patientName: fullName })}
                        activeOpacity={0.7}
                    >
                        <IconWrap name="folder-heart-outline" variant="tinted" size="md" />
                        <Text style={styles.actionText}>{t('doctor.viewHealthRecords')}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
                    </TouchableOpacity>
                    <View style={styles.actionDivider} />
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => Alert.alert('Write Prescription', 'Please open a prescription from an active appointment.')}
                        activeOpacity={0.7}
                    >
                        <IconWrap name="prescription" variant="tinted" size="md" />
                        <Text style={styles.actionText}>{t('doctor.writePrescription')}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
                    </TouchableOpacity>
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
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
    profileCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.xxl,
        alignItems: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    initials: { fontSize: 28, fontWeight: '700', color: colors.primary },
    patientName: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
    tagRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.borderLight, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 10, gap: 4 },
    tagText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
    contactRow: { gap: spacing.sm },
    contactItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    contactText: { ...typography.caption, color: colors.textSecondary },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    statCard: { flex: 1, alignItems: 'center', padding: spacing.lg },
    statCardBorder: { borderLeftWidth: 1, borderLeftColor: colors.border },
    statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
    healthRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
    healthRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    healthContent: { flex: 1 },
    healthLabel: { ...typography.caption, color: colors.textSecondary },
    healthValue: { ...typography.bodySmall, fontWeight: '500', color: colors.textPrimary, marginTop: 2 },
    actionsCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    actionBtn: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
    actionText: { flex: 1, ...typography.body, fontWeight: '500', color: colors.textPrimary },
    actionDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing.lg + 40 + spacing.md },
});

export default PatientProfileScreen;
