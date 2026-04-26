import React from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const managementItems = [
    {
        title: 'Content Management',
        icon: 'book-open-variant',
        color: '#1A73E8',
        bg: '#EBF5FF',
        screen: 'SpecializationsScreen',
    },
    {
        title: 'Health Tips',
        icon: 'lightbulb-outline',
        color: '#F59E0B',
        bg: '#FFFBEB',
        screen: 'HealthTipsManagementScreen',
    },
    {
        title: 'System Settings',
        icon: 'cog-outline',
        color: '#8B5CF6',
        bg: '#F5F3FF',
        screen: 'SystemSettingsScreen',
    },
    {
        title: 'Data Export',
        icon: 'download-outline',
        color: '#10B981',
        bg: '#ECFDF5',
        screen: null,
        alert: 'Data export coming soon',
    },
    {
        title: 'Backup & Restore',
        icon: 'cloud-outline',
        color: '#EC4899',
        bg: '#FDF2F8',
        screen: null,
        alert: 'Coming soon',
    },
    {
        title: 'Support Tickets',
        icon: 'help-circle-outline',
        color: '#DC2626',
        bg: '#FEF2F2',
        screen: null,
        alert: 'Coming soon',
    },
];

const ManagementScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();

    const handlePress = (item: typeof managementItems[0]) => {
        if (item.screen) {
            navigation.navigate(item.screen);
        } else if (item.alert) {
            Alert.alert('Coming Soon', item.alert);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.heading}>{t('admin.management')}</Text>
                <Text style={styles.subtitle}>System administration tools</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                <View style={styles.grid}>
                    {managementItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.card}
                            activeOpacity={0.7}
                            onPress={() => handlePress(item)}
                        >
                            <View style={styles.cardLeft}>
                                <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
                                    <MaterialCommunityIcons
                                        name={item.icon as any}
                                        size={24}
                                        color={item.color}
                                    />
                                </View>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                            </View>
                            <MaterialCommunityIcons
                                name="chevron-right"
                                size={20}
                                color={colors.textDisabled}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.lg,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    heading: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    scroll: { padding: spacing.xl, paddingBottom: 100 },
    grid: { gap: spacing.md },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
});

export default ManagementScreen;
