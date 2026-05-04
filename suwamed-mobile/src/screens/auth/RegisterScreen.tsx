import React, { useState, useRef, useEffect, useCallback } from 'react';
import FadeIn from '../../components/common/FadeIn';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthStackParamList } from '../../types/navigation.types';
import * as authApi from '../../api/auth.api';
import client from '../../api/client';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useToast } from '../../components/common/Toast';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { SRI_LANKAN_DISTRICTS, SPECIALIZATIONS } from '../../config/constants';

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;
type RegisterRouteProp = RouteProp<AuthStackParamList, 'Register'>;

// --- Password Strength Helpers ---
type PasswordStrength = 'none' | 'weak' | 'fair' | 'good' | 'strong';

const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password) return 'none';
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;

  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  if (score === 3 || score === 4) return 'good';
  return 'strong';
};

// Strength colors are kept semantic (warning/success). Only the "weak" tier uses the
// muted error coral — never the loud crimson reserved for true emergencies.
const getStrengthConfig = (colors: ThemeColors): Record<PasswordStrength, { label: string; color: string; width: string; meetsMinimum: boolean }> => ({
  none:   { label: '',       color: 'transparent',     width: '0%',   meetsMinimum: false },
  weak:   { label: 'Weak',   color: colors.error,      width: '25%',  meetsMinimum: false },
  fair:   { label: 'Fair',   color: colors.warning,    width: '50%',  meetsMinimum: false },
  good:   { label: 'Good',   color: colors.primary,    width: '75%',  meetsMinimum: true },
  strong: { label: 'Strong', color: colors.success,    width: '100%', meetsMinimum: true },
});

// --- Validation Schema ---
const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(9, 'Please enter a valid phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters').regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
    confirmPassword: z.string(),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    district: z.string().optional(),
    // Doctor-specific fields
    slmcRegistrationNo: z.string().optional(),
    specialization: z.array(z.string()).optional(),
    consultationFee: z.string().optional(),
    experience: z.string().optional(),
    bio: z.string().max(500).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;


// --- Password Strength Indicator ---
const PasswordStrengthBar: React.FC<{ password: string }> = ({ password }) => {
  const { theme: colors } = useTheme();
  const pswStyles = makePswStyles(colors);
  const strength = getPasswordStrength(password);
  const config = getStrengthConfig(colors)[strength];
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const targetWidth = strength === 'none' ? 0 : strength === 'weak' ? 0.25 : strength === 'fair' ? 0.5 : strength === 'good' ? 0.75 : 1;
    Animated.spring(barAnim, { toValue: targetWidth, useNativeDriver: false, tension: 80, friction: 10 }).start();
  }, [strength]);

  if (!password) return null;

  const requirements = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
  ];

  return (
    <View style={pswStyles.container}>
      <View style={pswStyles.barTrack}>
        <Animated.View
          style={[
            pswStyles.barFill,
            {
              backgroundColor: config.color,
              width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
      <Text style={[pswStyles.label, { color: config.color }]}>{config.label}</Text>
      <View style={pswStyles.requirements}>
        {requirements.map((req) => (
          <View key={req.label} style={pswStyles.reqRow}>
            <MaterialCommunityIcons
              name={req.met ? 'check-circle' : 'circle-outline'}
              size={14}
              color={req.met ? colors.success : colors.textDisabled}
            />
            <Text style={[pswStyles.reqText, req.met && pswStyles.reqTextMet]}>{req.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const makePswStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { marginTop: -spacing.sm, marginBottom: spacing.md },
  barTrack: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: spacing.xs },
  barFill: { height: '100%', borderRadius: 2 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: spacing.xs },
  requirements: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '45%' },
  reqText: { fontSize: 11, color: colors.textDisabled },
  reqTextMet: { color: colors.success },
});

// =========================
//       MAIN SCREEN
// =========================
const RegisterScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<RegisterNavigationProp>();
  const route = useRoute<RegisterRouteProp>();
  const { t } = useTranslation();

  const role = route.params?.role || 'patient';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showSpecializationModal, setShowSpecializationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [slmcVerified, setSlmcVerified] = useState(false);
  const [slmcVerifying, setSlmcVerifying] = useState(false);
  const { showToast } = useToast();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      gender: '',
      district: '',
      slmcRegistrationNo: '',
      specialization: [],
      consultationFee: '',
      experience: '',
      bio: '',
    },
  });

  const selectedGender = watch('gender');
  const selectedDistrict = watch('district');
  const watchedPassword = watch('password');
  const passwordStrength = getPasswordStrength(watchedPassword);

  // SLMC auto-verify
  const slmcVerifyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const verifySlmc = useCallback(async (slmcNo: string) => {
    if (!/^SLMC-\d{5}$/i.test(slmcNo)) {
      setSlmcVerified(false);
      return;
    }

    setSlmcVerifying(true);
    try {
      const res = await client.get(`/slmc/verify/${slmcNo.toUpperCase()}`);
      const data = res.data.data;

      // Auto-fill form fields
      setValue('specialization', data.specialization);
      setValue('consultationFee', String(data.consultationFee));
      setValue('experience', String(data.experience));
      setValue('bio', `${data.specialization.join(', ')} at ${data.hospital}. ${data.experience} years of experience.`);

      setSlmcVerified(true);
      showToast('success', 'SLMC Verified', 'Details auto-filled from SLMC registry');
    } catch (error: any) {
      setSlmcVerified(false);
      const msg = error?.response?.data?.message || 'Failed to verify SLMC number';
      showToast('error', 'SLMC Verification Failed', msg);
    } finally {
      setSlmcVerifying(false);
    }
  }, [setValue, showToast]);

  const handleSlmcChange = useCallback((text: string, onChange: (val: string) => void) => {
    const upper = text.toUpperCase();
    onChange(upper);
    setSlmcVerified(false);

    if (slmcVerifyTimeout.current) {
      clearTimeout(slmcVerifyTimeout.current);
    }

    if (/^SLMC-\d{5}$/i.test(upper)) {
      slmcVerifyTimeout.current = setTimeout(() => verifySlmc(upper), 500);
    }
  }, [verifySlmc]);

  const onSubmit = async (data: RegisterFormData) => {
    if (!agreedToTerms) {
      setErrorMessage('You must agree to the Terms & Conditions');
      return;
    }

    if (!getStrengthConfig(colors)[passwordStrength].meetsMinimum) {
      setErrorMessage('Your password is too weak. Please choose a stronger password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const { confirmPassword, consultationFee, experience, ...registerData } = data;
      // Ensure phone has +94 prefix
      const phone = registerData.phone.startsWith('+94') ? registerData.phone : `+94${registerData.phone.replace(/^0/, '')}`;
      const payload: any = {
        ...registerData,
        phone,
        role,
      };
      // Add doctor-specific numeric fields
      if (role === 'doctor') {
        payload.consultationFee = consultationFee ? parseFloat(consultationFee) : 0;
        if (experience) payload.experience = parseInt(experience, 10);
      }
      await authApi.register(payload);
      // Navigate to OTP verification screen
      navigation.navigate('OTPVerification', { phone, role });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || t('common.error');
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const genderOptions = [
    { label: 'Male', value: 'male', icon: 'gender-male' as const },
    { label: 'Female', value: 'female', icon: 'gender-female' as const },
    { label: 'Other', value: 'other', icon: 'gender-non-binary' as const },
  ];

  // Format phone: strip leading zero, only digits
  const handlePhoneChange = (text: string, onChange: (val: string) => void) => {
    // Only allow digits
    const digits = text.replace(/[^\d]/g, '');
    // If starts with 0, remove it
    const cleaned = digits.startsWith('0') ? digits.substring(1) : digits;
    // Limit to 9 digits (Sri Lankan number without country code)
    onChange(cleaned.substring(0, 9));
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
          {/* Header */}
          <FadeIn delay={0}>
            <View style={styles.headerSection}>
              <View style={styles.headerIconContainer}>
                <MaterialCommunityIcons
                  name={role === 'doctor' ? 'stethoscope' : 'account-plus'}
                  size={28}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.heading}>{t('auth.registerTitle')}</Text>
              <Text style={styles.subtitle}>
                {role === 'doctor'
                  ? 'Create your healthcare provider account'
                  : 'Create your patient account'}
              </Text>
            </View>
          </FadeIn>

          {errorMessage ? (
            <FadeIn delay={0}>
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            </FadeIn>
          ) : null}

          {/* Name Fields */}
          <FadeIn delay={50}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account-outline" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>{t('patient.personalInfo')}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Controller
                    control={control}
                    name="firstName"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label={t('auth.firstName')}
                        value={value}
                        onChangeText={onChange}
                        placeholder="John"
                        error={errors.firstName?.message}
                        leftIcon="account"
                        autoCapitalize="words"
                      />
                    )}
                  />
                </View>
                <View style={styles.halfField}>
                  <Controller
                    control={control}
                    name="lastName"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label={t('auth.lastName')}
                        value={value}
                        onChangeText={onChange}
                        placeholder="Doe"
                        error={errors.lastName?.message}
                        autoCapitalize="words"
                      />
                    )}
                  />
                </View>
              </View>

              {/* Date of Birth */}
              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t('auth.dateOfBirth')}
                    value={value || ''}
                    onChangeText={onChange}
                    placeholder="YYYY-MM-DD"
                    error={errors.dateOfBirth?.message}
                    leftIcon="calendar"
                    keyboardType="numbers-and-punctuation"
                  />
                )}
              />

              {/* Gender */}
              <View style={styles.genderSection}>
                <Text style={styles.fieldLabel}>{t('auth.gender')}</Text>
                <View style={styles.genderRow}>
                  {genderOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.genderChip,
                        selectedGender === option.value && styles.genderChipSelected,
                      ]}
                      onPress={() => setValue('gender', option.value)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={option.icon}
                        size={18}
                        color={selectedGender === option.value ? colors.primary : colors.textSecondary}
                        style={{ marginBottom: 2 }}
                      />
                      <Text
                        style={[
                          styles.genderChipText,
                          selectedGender === option.value && styles.genderChipTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* District */}
              <View style={styles.districtSection}>
                <Text style={styles.fieldLabel}>{t('auth.district')}</Text>
                <TouchableOpacity
                  style={styles.districtSelector}
                  onPress={() => setShowDistrictModal(true)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={20}
                    color={selectedDistrict ? colors.primary : colors.textSecondary}
                    style={styles.districtIcon}
                  />
                  <Text
                    style={[
                      styles.districtText,
                      !selectedDistrict && styles.districtPlaceholder,
                    ]}
                  >
                    {selectedDistrict || t('auth.selectDistrict')}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </FadeIn>

          {/* Contact Fields */}
          <FadeIn delay={100}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="at" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Contact Details</Text>
              </View>

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t('auth.email')}
                    value={value}
                    onChangeText={onChange}
                    placeholder="john@example.com"
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    leftIcon="email"
                  />
                )}
              />

              {/* Phone with country code prefix */}
              <View style={styles.phoneWrapper}>
                <Text style={styles.fieldLabel}>{t('auth.phone')}</Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, value } }) => (
                    <View style={[
                      styles.phoneContainer,
                      errors.phone && { borderColor: colors.error },
                    ]}>
                      <View style={styles.countryCodeBox}>
                        <Text style={styles.flag}>🇱🇰</Text>
                        <Text style={styles.countryCode}>+94</Text>
                      </View>
                      <View style={styles.phoneDivider} />
                      <View style={styles.phoneInputWrapper}>
                        <Input
                          value={value}
                          onChangeText={(text) => handlePhoneChange(text, onChange)}
                          placeholder="7X XXX XXXX"
                          keyboardType="phone-pad"
                          maxLength={9}
                          style={styles.phoneInputOverride}
                        />
                      </View>
                    </View>
                  )}
                />
                {errors.phone && (
                  <Text style={styles.fieldError}>{errors.phone.message}</Text>
                )}
              </View>
            </View>
          </FadeIn>

          {/* Doctor-specific Fields */}
          {role === 'doctor' && (
            <FadeIn delay={125}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="stethoscope" size={18} color={colors.primary} />
                  <Text style={styles.sectionTitle}>{t('doctor.professionalDetails')}</Text>
                </View>

                <Controller
                  control={control}
                  name="slmcRegistrationNo"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <View style={styles.slmcRow}>
                        <View style={styles.slmcInputWrapper}>
                          <Input
                            label="SLMC Registration No. *"
                            value={value || ''}
                            onChangeText={(text) => handleSlmcChange(text, onChange)}
                            placeholder="e.g. SLMC-12345"
                            error={errors.slmcRegistrationNo?.message}
                            leftIcon="card-account-details"
                            autoCapitalize="characters"
                          />
                        </View>
                        {slmcVerifying && (
                          <ActivityIndicator size="small" color={colors.primary} style={styles.slmcBadge} />
                        )}
                        {slmcVerified && !slmcVerifying && (
                          <MaterialCommunityIcons
                            name="check-decagram"
                            size={24}
                            color={colors.success}
                            style={styles.slmcBadge}
                          />
                        )}
                      </View>
                    </View>
                  )}
                />

                {/* Specialization Picker */}
                <View style={styles.districtSection}>
                  <Text style={styles.fieldLabel}>Specialization *</Text>
                  <TouchableOpacity
                    style={[styles.districtSelector, slmcVerified && styles.readOnlyField]}
                    onPress={() => !slmcVerified && setShowSpecializationModal(true)}
                    activeOpacity={slmcVerified ? 1 : 0.7}
                    disabled={slmcVerified}
                  >
                    <MaterialCommunityIcons
                      name="medical-bag"
                      size={20}
                      color={watch('specialization')?.length ? colors.primary : colors.textSecondary}
                      style={styles.districtIcon}
                    />
                    <Text
                      style={[
                        styles.districtText,
                        !watch('specialization')?.length && styles.districtPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {watch('specialization')?.length
                        ? watch('specialization')!.join(', ')
                        : 'Select specialization(s)'}
                    </Text>
                    {!slmcVerified && (
                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={20}
                        color={colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Controller
                      control={control}
                      name="consultationFee"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          label="Consultation Fee (LKR) *"
                          value={value || ''}
                          onChangeText={onChange}
                          placeholder="e.g. 2500"
                          error={errors.consultationFee?.message}
                          keyboardType="numeric"
                          leftIcon="currency-usd"
                          editable={!slmcVerified}
                        />
                      )}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Controller
                      control={control}
                      name="experience"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          label="Experience (years)"
                          value={value || ''}
                          onChangeText={onChange}
                          placeholder="e.g. 5"
                          keyboardType="numeric"
                          leftIcon="briefcase-clock"
                          editable={!slmcVerified}
                        />
                      )}
                    />
                  </View>
                </View>

                <Controller
                  control={control}
                  name="bio"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label={t('doctor.bio')}
                      value={value || ''}
                      onChangeText={onChange}
                      placeholder="Brief description about yourself..."
                      multiline
                      maxLength={500}
                      leftIcon="text"
                      editable={!slmcVerified}
                    />
                  )}
                />
              </View>
            </FadeIn>
          )}

          {/* Password Fields */}
          <FadeIn delay={150}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="shield-lock-outline" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>{t('common.security')}</Text>
              </View>

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t('auth.password')}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Create a strong password"
                    error={errors.password?.message}
                    secureTextEntry={!showPassword}
                    leftIcon="lock"
                    rightIcon={showPassword ? 'eye-off' : 'eye'}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                  />
                )}
              />

              {/* Password Strength Indicator */}
              <PasswordStrengthBar password={watchedPassword} />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t('auth.confirmPassword')}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Re-enter your password"
                    error={errors.confirmPassword?.message}
                    secureTextEntry={!showConfirmPassword}
                    leftIcon="lock-check"
                    rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                )}
              />
            </View>
          </FadeIn>

          {/* Terms & Submit */}
          <FadeIn delay={200}>
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={agreedToTerms ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={24}
                color={agreedToTerms ? colors.primary : colors.textSecondary}
              />
              <Text style={styles.termsText}>{t('auth.agreeTerms')}</Text>
            </TouchableOpacity>

            <View style={styles.submitSection}>
              <Button
                title={t('common.register')}
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                disabled={!agreedToTerms}
                fullWidth
              />
            </View>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginText}>
                {t('auth.alreadyHaveAccount')}{' '}
                <Text style={styles.loginTextBold}>{t('common.login')}</Text>
              </Text>
            </TouchableOpacity>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* District Modal */}
      <Modal
        visible={showDistrictModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('auth.selectDistrict')}</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SRI_LANKAN_DISTRICTS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.districtItem,
                    selectedDistrict === item && styles.districtItemSelected,
                  ]}
                  onPress={() => {
                    setValue('district', item);
                    setShowDistrictModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.districtItemText,
                      selectedDistrict === item && styles.districtItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {selectedDistrict === item && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Specialization Modal (multi-select) */}
      <Modal
        visible={showSpecializationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSpecializationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Specialization(s)</Text>
              <TouchableOpacity onPress={() => setShowSpecializationModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SPECIALIZATIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const currentSpecs = watch('specialization') || [];
                const isSelected = currentSpecs.includes(item);
                return (
                  <Pressable
                    style={[
                      styles.districtItem,
                      isSelected && styles.districtItemSelected,
                    ]}
                    onPress={() => {
                      const updated = isSelected
                        ? currentSpecs.filter((s) => s !== item)
                        : [...currentSpecs, item];
                      setValue('specialization', updated);
                    }}
                  >
                    <Text
                      style={[
                        styles.districtItemText,
                        isSelected && styles.districtItemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    <MaterialCommunityIcons
                      name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={20}
                      color={isSelected ? colors.primary : colors.textDisabled}
                    />
                  </Pressable>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// =========================
//         STYLES
// =========================
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl + 20,
  },

  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorBannerText: {
    ...typography.bodySmall,
    color: colors.error,
    marginLeft: spacing.sm,
    flex: 1,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Fields
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  fieldError: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },

  // Phone
  phoneWrapper: {
    marginBottom: spacing.lg,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  flag: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  phoneDivider: {
    width: 1.5,
    height: 28,
    backgroundColor: colors.border,
  },
  phoneInputWrapper: {
    flex: 1,
    marginBottom: -spacing.lg, // compensate for Input's built-in marginBottom
  },
  phoneInputOverride: {
    marginBottom: 0,
    borderWidth: 0,
  },

  // Gender
  genderSection: {
    marginBottom: spacing.lg,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderChip: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  genderChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  genderChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  genderChipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  // District
  slmcRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slmcInputWrapper: {
    flex: 1,
  },
  slmcBadge: {
    marginLeft: -spacing.xl,
    marginTop: spacing.sm,
  },
  readOnlyField: {
    backgroundColor: colors.background,
    opacity: 0.8,
  },
  districtSection: {
    marginBottom: spacing.xs,
  },
  districtSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  districtIcon: {
    marginRight: spacing.sm,
  },
  districtText: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  districtPlaceholder: {
    color: colors.textDisabled,
  },

  // Terms & Submit
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  termsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  submitSection: {
    marginBottom: spacing.lg,
  },
  loginLink: {
    alignItems: 'center',
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  loginText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  loginTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '70%',
    paddingBottom: spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  districtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  districtItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  districtItemText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  districtItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;
