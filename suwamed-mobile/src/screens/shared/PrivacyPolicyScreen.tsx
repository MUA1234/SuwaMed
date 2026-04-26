import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, typography } from '../../config/theme';

const PRIVACY_SECTIONS = [
  { title: 'privacy.section1Title', body: 'privacy.section1Body' },
  { title: 'privacy.section2Title', body: 'privacy.section2Body' },
  { title: 'privacy.section3Title', body: 'privacy.section3Body' },
  { title: 'privacy.section4Title', body: 'privacy.section4Body' },
  { title: 'privacy.section5Title', body: 'privacy.section5Body' },
  { title: 'privacy.section6Title', body: 'privacy.section6Body' },
  { title: 'privacy.section7Title', body: 'privacy.section7Body' },
];

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { theme: colors } = useTheme();
  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} accessibilityLabel={t('common.back')}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>{t('privacy.title')}</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.lastUpdated}>{t('privacy.lastUpdated')}</Text>
        {PRIVACY_SECTIONS.map((section) => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{t(section.title)}</Text>
            <Text style={s.sectionBody}>{t(section.body)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
    lastUpdated: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.h3,
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    sectionBody: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },
  });

export default PrivacyPolicyScreen;
