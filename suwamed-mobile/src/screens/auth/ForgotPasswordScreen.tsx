import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../types/navigation.types';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { forgotPassword } from '../../api/auth.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const { t } = useTranslation();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendResetCode = async () => {
    setError('');

    if (!emailOrPhone.trim()) {
      setError('Please enter your email or phone number');
      return;
    }

    const isEmail = emailOrPhone.includes('@');
    const isPhone = /^\+?\d{10,}$/.test(emailOrPhone.replace(/\s/g, ''));

    if (!isEmail && !isPhone) {
      setError('Please enter a valid email address or phone number');
      return;
    }

    setIsLoading(true);

    try {
      const isEmail = emailOrPhone.includes('@');
      const payload = isEmail ? { email: emailOrPhone.trim() } : { phone: emailOrPhone.trim() };
      await forgotPassword(payload);
      navigation.navigate('ResetPassword', { emailOrPhone: emailOrPhone.trim() });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="lock-reset" size={40} color={colors.primary} />
            </View>
            <Text style={styles.heading}>{t('auth.forgotPasswordTitle')}</Text>
            <Text style={styles.description}>
              {t('auth.forgotPasswordDesc')}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formSection}>
            <Input
              label={t('auth.emailOrPhone')}
              value={emailOrPhone}
              onChangeText={(text) => {
                setEmailOrPhone(text);
                if (error) setError('');
              }}
              placeholder="john@example.com or +94XXXXXXXXX"
              leftIcon="email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Button
              title={t('auth.sendResetCode')}
              onPress={handleSendResetCode}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              style={styles.submitButton}
            />
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <MaterialCommunityIcons name="arrow-left" size={16} color={colors.primary} />
              <Text style={styles.loginLinkText}>{t('auth.backToLogin')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  heading: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginLeft: spacing.sm,
    flex: 1,
  },
  formSection: {
    flex: 1,
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.xxxl,
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  loginLinkText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
