import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../types/navigation.types';
import Button from '../../components/common/Button';
import * as authApi from '../../api/auth.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
type OTPNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;
type OTPRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

const OTPVerificationScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<OTPNavigationProp>();
  const route = useRoute<OTPRouteProp>();
  const { t } = useTranslation();

  const phone = route.params?.phone || '';

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const maskPhone = (value: string): string => {
    if (value.length <= 6) return value;
    const start = value.slice(0, 4);
    const end = value.slice(-2);
    const masked = '*'.repeat(value.length - 6);
    return `${start}${masked}${end}`;
  };

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    setError('');
    const newOtp = [...otp];

    if (text.length > 1) {
      const digits = text.replace(/[^0-9]/g, '').split('');
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newOtp[index] = text.replace(/[^0-9]/g, '');
      setOtp(newOtp);

      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    const filledOtp = newOtp.join('');
    if (filledOtp.length === 6 && newOtp.every((d) => d !== '')) {
      handleVerify(filledOtp);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = useCallback(async (code: string) => {
    setIsLoading(true);
    setError('');

    try {
      await authApi.verifyOTP({ phone, otp: code });
      // Verification successful — navigate to Login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t('auth.invalidVerificationCode');
      setError(msg);
      // Clear the OTP inputs so user can retry
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [phone, navigation]);

  const handleResend = async () => {
    setCanResend(false);
    setTimer(60);
    setOtp(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();

    try {
      await authApi.resendOTP(phone);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('auth.failedResendCode'));
    }
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        <View style={styles.headerSection}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-check" size={40} color={colors.primary} />
          </View>
          <Text style={styles.heading}>{t('auth.verifyYourPhone')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.otpSubtitle')}{'\n'}
            <Text style={styles.phoneText}>{maskPhone(phone)}</Text>
          </Text>
          <View style={styles.emailHintRow}>
            <MaterialCommunityIcons name="email-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.emailHintText}>{t('auth.otpCheckInbox')}</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null,
                error ? styles.otpInputError : null,
              ]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? 6 : 1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        <View style={styles.timerSection}>
          {!canResend ? (
            <Text style={styles.timerText}>
              {t('auth.resendCodeIn')}{' '}
              <Text style={styles.timerValue}>{formatTimer(timer)}</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendText}>{t('auth.resendCode')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.changePhoneLink}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color={colors.primary} />
          <Text style={styles.changePhoneText}>{t('auth.changePhoneNumber')}</Text>
        </TouchableOpacity>
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
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneText: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emailHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  emailHintText: {
    ...typography.caption,
    color: colors.textSecondary,
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  otpInputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  timerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  timerValue: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  resendText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  changePhoneLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  changePhoneText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default OTPVerificationScreen;
