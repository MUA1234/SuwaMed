import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../types/navigation.types';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { resetPassword } from '../../api/auth.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
type ResetPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

type PasswordStrength = 'weak' | 'medium' | 'strong';

const getPasswordStrength = (password: string): PasswordStrength => {
  if (password.length === 0) return 'weak';
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasLetters = /[a-zA-Z]/.test(password);

  if (password.length >= 8 && hasUpper && hasLower && hasNumber) {
    return 'strong';
  }

  if (password.length >= 6 && hasLetters && hasNumber) {
    return 'medium';
  }

  return 'weak';
};

const getStrengthColor = (strength: PasswordStrength, colors: ThemeColors): string => {
  switch (strength) {
    case 'weak':
      return colors.error;
    case 'medium':
      return '#F59E0B';
    case 'strong':
      return colors.success;
  }
};

const getStrengthWidth = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'weak':
      return '33%';
    case 'medium':
      return '66%';
    case 'strong':
      return '100%';
  }
};

const getStrengthLabel = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'medium':
      return 'Medium';
    case 'strong':
      return 'Strong';
  }
};

const ResetPasswordScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<ResetPasswordNavigationProp>();
  const route = useRoute<ResetPasswordRouteProp>();
  const { t } = useTranslation();

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const passwordStrength = getPasswordStrength(newPassword);

  const handleOtpChange = (text: string, index: number) => {
    setError('');
    const newOtpArr = [...otp];

    if (text.length > 1) {
      const digits = text.replace(/[^0-9]/g, '').split('');
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtpArr[index + i] = digit;
        }
      });
      setOtp(newOtpArr);
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
    } else {
      newOtpArr[index] = text.replace(/[^0-9]/g, '');
      setOtp(newOtpArr);

      if (text && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtpArr = [...otp];
      newOtpArr[index - 1] = '';
      setOtp(newOtpArr);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async () => {
    setError('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const emailOrPhone = route.params?.emailOrPhone || '';
      const isEmail = emailOrPhone.includes('@');
      const payload = isEmail
        ? { email: emailOrPhone, otp: otpCode, newPassword }
        : { phone: emailOrPhone, otp: otpCode, newPassword };
      await resetPassword(payload);
      Alert.alert(
        'Password Reset Successful',
        'Your password has been reset successfully. Please login with your new password.',
        [
          {
            text: 'Login',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the verification code and your new password
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Verification Code</Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  otpRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : null,
                  error && otp.join('').length < 6 ? styles.otpInputError : null,
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={index === 0 ? 6 : 1}
                selectTextOnFocus
              />
            ))}
          </View>

          <Input
            label="New Password"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              if (error) setError('');
            }}
            placeholder="Enter new password"
            secureTextEntry={!showNewPassword}
            leftIcon="lock"
            rightIcon={showNewPassword ? 'eye-off' : 'eye'}
            onRightIconPress={() => setShowNewPassword(!showNewPassword)}
          />

          {newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBarBackground}>
                <View
                  style={[
                    styles.strengthBarFill,
                    {
                      width: getStrengthWidth(passwordStrength) as any,
                      backgroundColor: getStrengthColor(passwordStrength, colors),
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.strengthLabel,
                  { color: getStrengthColor(passwordStrength, colors) },
                ]}
              >
                {getStrengthLabel(passwordStrength)}
              </Text>
            </View>
          )}

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (error) setError('');
            }}
            placeholder="Re-enter new password"
            secureTextEntry={!showConfirmPassword}
            leftIcon="lock-check"
            rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
            onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          <View style={styles.submitSection}>
            <Button
              title="Reset Password"
              onPress={handleResetPassword}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl + 20,
    paddingBottom: spacing.xxxl,
  },
  heading: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    lineHeight: 24,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  strengthContainer: {
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
  },
  strengthBarBackground: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    ...typography.caption,
    fontWeight: '500',
  },
  submitSection: {
    marginTop: spacing.lg,
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
  },
});

export default ResetPasswordScreen;
