import React, { useState, useCallback } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, FlatList,
    TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getDoctors } from '../../api/doctor.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import IconWrap from '../../components/common/IconWrap';

// Specialization → outlined teal icon. Distinction comes from the icon glyph
// and the name — no per-row color, per the Calm Healing direction.
const SPEC_ICONS: Record<string, string> = {
    'General Practitioner': 'stethoscope',
    'Cardiologist': 'heart-pulse',
    'Dermatologist': 'face-man-outline',
    'Endocrinologist': 'flask-outline',
    'Gastroenterologist': 'stomach',
    'Gynecologist': 'gender-female',
    'Neurologist': 'brain',
    'Oncologist': 'ribbon',
    'Ophthalmologist': 'eye-outline',
    'Orthopedic Surgeon': 'bone',
    'Pediatrician': 'baby-face-outline',
    'Psychiatrist': 'head-cog-outline',
    'Pulmonologist': 'lungs',
    'Radiologist': 'radioactive',
    'Urologist': 'human-male',
    'ENT Specialist': 'ear-hearing',
    'Nephrologist': 'water-outline',
    'Rheumatologist': 'hand-wave-outline',
    'Allergist': 'flower-pollen-outline',
    'Anesthesiologist': 'needle',
};

interface SpecItem { name: string; count: number }

const SpecializationsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [specs, setSpecs] = useState<SpecItem[]>([]);

    const fetchSpecs = async () => {
        try {
            const res = await getDoctors();
            const doctors: any[] = res.data || [];
            const countMap: Record<string, number> = {};
            for (const doc of doctors) {
                for (const s of (doc.specialization || [])) {
                    countMap[s] = (countMap[s] || 0) + 1;
                }
            }
            const list = Object.entries(countMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);
            setSpecs(list);
        } catch (err) {
            console.log('Specs fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchSpecs(); }, []));

    const renderItem = ({ item }: { item: SpecItem }) => {
        const icon = SPEC_ICONS[item.name] || 'stethoscope';
        return (
            <View style={styles.row}>
                <IconWrap name={icon} variant="outlined" size="md" />
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.count} {item.count === 1 ? 'doctor' : 'doctors'}</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('patient.specializations')}</Text>
                    <View style={{ width: 80 }} />
                </View>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.specializations')}</Text>
                <View style={{ width: 80 }} />
            </View>

            <View style={styles.countBanner}>
                <MaterialCommunityIcons name="format-list-bulleted" size={18} color={colors.primary} />
                <Text style={styles.countText}>{specs.length} specializations · {specs.reduce((s, i) => s + i.count, 0)} doctors</Text>
            </View>

            <FlatList
                data={specs}
                keyExtractor={(item) => item.name}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
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
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    countBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    countText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
    list: { padding: spacing.xl, paddingBottom: 100, gap: spacing.sm },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    name: { ...typography.body, fontWeight: '500', color: colors.textPrimary, flex: 1 },
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.primaryLight,
    },
    badgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
});

export default SpecializationsScreen;
