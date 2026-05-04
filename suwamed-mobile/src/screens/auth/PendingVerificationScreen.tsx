import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
const PendingVerificationScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  const { logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="clock-check-outline" size={64} color={colors.warning} />
        </View>

        <Text style={styles.title}>{t('auth.pendingVerification')}</Text>

        <Text style={styles.message}>
          {t('auth.pendingVerificationMsg')}
        </Text>

        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            {t('auth.pendingVerificationInfo')}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button title={t('auth.signOut')} onPress={logout} fullWidth variant="outline" />
        </View>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
  },
});

export default PendingVerificationScreen;
