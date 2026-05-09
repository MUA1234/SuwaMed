import React from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const PHARMACIES = [
    { name: 'Keells Super Pharmacy', areas: 'Island-wide', phone: '+94 11 230 0000', type: 'Chain' },
    { name: 'Cargills Food City Pharmacy', areas: 'Island-wide', phone: '+94 11 248 4000', type: 'Chain' },
    { name: 'Laugfs Pharmacy', areas: 'Western Province', phone: '+94 11 567 8900', type: 'Chain' },
    { name: 'Asiri Pharmacy', areas: 'Colombo', phone: '+94 11 452 3300', type: 'Hospital Pharmacy' },
    { name: 'Durdans Pharmacy', areas: 'Colombo', phone: '+94 11 540 0000', type: 'Hospital Pharmacy' },
    { name: 'National Hospital Pharmacy', areas: 'Colombo', phone: '+94 11 269 1111', type: 'Government' },
    { name: 'Lanka Hospitals Pharmacy', areas: 'Colombo', phone: '+94 11 553 0000', type: 'Hospital Pharmacy' },
];

const getTypeConfig = (colors: ThemeColors): Record<string, { color: string; bg: string }> => ({
    Chain:               { color: colors.primary,   bg: colors.primaryLight },
    'Hospital Pharmacy': { color: colors.secondary, bg: colors.secondaryLight },
    Government:          { color: colors.success,   bg: colors.successLight },
});

const NearbyPharmaciesScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const typeConfig = getTypeConfig(colors);
    const navigation = useNavigation();
    const { t } = useTranslation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.pharmacies')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={PHARMACIES}
                keyExtractor={(item, index) => `${item.name}-${index}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.infoBanner}>
                        <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
                        <Text style={styles.infoBannerText}>Major pharmacy chains in Sri Lanka</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const tc = typeConfig[item.type] || typeConfig.Chain;
                    return (
                        <View style={styles.card}>
                            <View style={styles.cardTop}>
                                <View style={styles.iconWrap}>
                                    <MaterialCommunityIcons name="pharmacy" size={24} color={colors.primary} />
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.pharmacyName}>{item.name}</Text>
                                    <View style={styles.cardMeta}>
                                        <View style={[styles.typeBadge, { backgroundColor: tc.bg }]}>
                                            <Text style={[styles.typeText, { color: tc.color }]}>{item.type}</Text>
                                        </View>
                                        <View style={styles.areasWrap}>
                                            <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.textSecondary} />
                                            <Text style={styles.areasText}>{item.areas}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {item.phone ? (
                                <TouchableOpacity
                                    style={styles.phoneRow}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        const tel = `tel:${item.phone.replace(/\s/g, '')}`;
                                        Linking.openURL(tel).catch(() => {});
                                    }}
                                >
                                    <MaterialCommunityIcons name="phone-outline" size={14} color={colors.textSecondary} />
                                    <Text style={styles.phoneText}>{item.phone}</Text>
                                </TouchableOpacity>
                            ) : null}

                            <TouchableOpacity
                                style={styles.directionsBtn}
                                onPress={async () => {
                                    const query = encodeURIComponent(`${item.name} ${item.areas} Sri Lanka`);
                                    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
                                    try {
                                        const supported = await Linking.canOpenURL(url);
                                        if (supported) await Linking.openURL(url);
                                        else Alert.alert(t('common.error') || 'Error', t('patient.cannotOpenMaps') || 'Unable to open maps on this device.');
                                    } catch {
                                        Alert.alert(t('common.error') || 'Error', t('patient.cannotOpenMaps') || 'Unable to open maps on this device.');
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons name="directions" size={16} color={colors.primary} />
                                <Text style={styles.directionsBtnText}>{t('patient.directions')}</Text>
                            </TouchableOpacity>
                        </View>
                    );
                }}
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
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    infoBannerText: { ...typography.bodySmall, color: colors.primary, fontWeight: '500', flex: 1 },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    cardInfo: { flex: 1 },
    pharmacyName: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
    typeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10 },
    typeText: { fontSize: 11, fontWeight: '600' },
    areasWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    areasText: { ...typography.caption, color: colors.textSecondary },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
    phoneText: { ...typography.bodySmall, color: colors.textSecondary },
    directionsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryLight,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.sm,
        gap: spacing.xs,
    },
    directionsBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});

export default NearbyPharmaciesScreen;
