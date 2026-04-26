import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../types/navigation.types';
import Button from '../../components/common/Button';
import { useSettingsStore } from '../../store/settingsStore';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius, typography, gradients } from '../../config/theme';

type ConsentNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OnboardingConsent'>;

const OnboardingConsentScreen: React.FC = () => {
  const navigation = useNavigation<ConsentNavigationProp>();
  const { t } = useTranslation();
  const { theme: colors } = useTheme();
  const { acceptConsent } = useSettingsStore();

  const [agreedMedical, setAgreedMedical] = useState(false);
  const [agreedData, setAgreedData] = useState(false);
  const [agreedAge, setAgreedAge] = useState(false);

  const allAccepted = agreedMedical && agreedData && agreedAge;

  const handleAccept = async () => {
    if (!allAccepted) {
      Alert.alert(t('common.error'), t('consent.mustAcceptAll'));
      return;
    }
    await acceptConsent();
    navigation.replace('Welcome');
  };

  const s = getStyles(colors);

  const renderCheckbox = (checked: boolean, onPress: () => void, label: React.ReactNode) => (
    <TouchableOpacity style={s.checkboxRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.checkbox, checked && s.checkboxChecked]}>
        {checked && <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />}
      </View>
      <View style={s.checkboxLabel}>{label}</View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.heroIconWrap}>
          <LinearGradient colors={gradients.hero} style={s.heroIcon}>
            <MaterialCommunityIcons name="shield-check" size={40} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <Text style={s.title}>{t('consent.title')}</Text>
        <Text style={s.subtitle}>{t('consent.subtitle')}</Text>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <MaterialCommunityIcons name="medical-bag" size={20} color={colors.error} />
            <Text style={s.cardTitle}>{t('consent.medicalDisclaimerTitle')}</Text>
          </View>
          <Text style={s.cardBody}>{t('consent.medicalDisclaimerBody')}</Text>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <MaterialCommunityIcons name="database-lock" size={20} color={colors.primary} />
            <Text style={s.cardTitle}>{t('consent.dataUseTitle')}</Text>
          </View>
          <Text style={s.cardBody}>{t('consent.dataUseBody')}</Text>
        </View>

        <View style={s.checkboxes}>
          {renderCheckbox(
            agreedMedical,
            () => setAgreedMedical((v) => !v),
            <Text style={s.checkboxText}>{t('consent.consentLineMedical')}</Text>,
          )}
          {renderCheckbox(
            agreedData,
            () => setAgreedData((v) => !v),
            <Text style={s.checkboxText}>
              {t('consent.consentLineData', { terms: '', privacy: '' })
                .replace('  ', ' ')
                .trim()}
              {'  '}
              <Text style={s.link} onPress={() => navigation.navigate('Terms')}>
                {t('common.termsOfService')}
              </Text>
              {' · '}
              <Text style={s.link} onPress={() => navigation.navigate('Privacy')}>
                {t('common.privacyPolicy')}
              </Text>
            </Text>,
          )}
          {renderCheckbox(
            agreedAge,
            () => setAgreedAge((v) => !v),
            <Text style={s.checkboxText}>{t('consent.consentLineAge')}</Text>,
          )}
        </View>

        <Button
          title={t('consent.acceptAndContinue')}
          onPress={handleAccept}
          fullWidth
          size="lg"
          disabled={!allAccepted}
          iconRight="arrow-right"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
    heroIconWrap: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },
    heroIcon: {
      width: 76,
      height: 76,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    cardTitle: {
      ...typography.h3,
      fontSize: 15,
      color: colors.textPrimary,
    },
    cardBody: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    checkboxes: {
      marginTop: spacing.md,
      marginBottom: spacing.xl,
      gap: spacing.md,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    checkboxChecked: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    checkboxLabel: { flex: 1 },
    checkboxText: {
      ...typography.bodySmall,
      color: colors.textPrimary,
      lineHeight: 20,
    },
    link: {
      color: colors.primary,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
  });

export default OnboardingConsentScreen;
