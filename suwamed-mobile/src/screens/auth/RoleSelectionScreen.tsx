import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Pressable,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../types/navigation.types';
import Button from '../../components/common/Button';
import { spacing, borderRadius, typography, shadows, gradients } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
type RoleSelectionNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RoleSelection'>;

type Role = 'patient' | 'doctor';

const RoleSelectionScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<RoleSelectionNavigationProp>();
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const patientScale = useRef(new Animated.Value(1)).current;
  const doctorScale = useRef(new Animated.Value(1)).current;

  const handleSelect = (role: Role) => {
    setSelectedRole(role);
    const anim = role === 'patient' ? patientScale : doctorScale;
    const otherAnim = role === 'patient' ? doctorScale : patientScale;
    Animated.parallel([
      Animated.spring(anim, { toValue: 1.02, useNativeDriver: true, speed: 50, bounciness: 10 }),
      Animated.spring(otherAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
  };

  const handleContinue = () => {
    if (selectedRole) {
      navigation.navigate('Register', { role: selectedRole });
    }
  };

  const renderRoleCard = (
    role: Role,
    icon: string,
    title: string,
    description: string,
    gradient: [string, string],
    features: string[],
    scaleAnim: Animated.Value,
  ) => {
    const isSelected = selectedRole === role;
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={[
            styles.roleCard,
            isSelected && styles.roleCardSelected,
          ]}
          onPress={() => handleSelect(role)}
        >
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={isSelected ? gradient : [colors.borderLight, colors.border]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <MaterialCommunityIcons
                name={icon as any}
                size={32}
                color={isSelected ? '#FFFFFF' : colors.textSecondary}
              />
            </LinearGradient>
            <View style={styles.cardTitleSection}>
              <Text style={[styles.roleTitle, isSelected && styles.roleTitleSelected]}>
                {title}
              </Text>
              <Text style={styles.roleDescription}>{description}</Text>
            </View>
            <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
              {isSelected && <View style={styles.radioInner} />}
            </View>
          </View>
          {isSelected && (
            <View style={styles.featuresSection}>
              {features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.heading}>{t('auth.joinAs')}</Text>
          <Text style={styles.subtitle}>{t('auth.roleSelection')}</Text>
        </View>

        <View style={styles.cardsContainer}>
          {renderRoleCard(
            'patient',
            'account-heart',
            t('auth.patient'),
            t('auth.lookingForDoctor'),
            gradients.primary,
            [t('auth.patientFeature1'), t('auth.patientFeature2'), t('auth.patientFeature3')],
            patientScale,
          )}
          {renderRoleCard(
            'doctor',
            'medical-bag',
            t('auth.doctor'),
            t('auth.healthcareProvider'),
            gradients.secondary,
            [t('auth.doctorFeature1'), t('auth.doctorFeature2'), t('auth.doctorFeature3')],
            doctorScale,
          )}
        </View>

        <View style={styles.bottomSection}>
          <Button
            title={t('common.next')}
            onPress={handleContinue}
            disabled={!selectedRole}
            fullWidth
            size="lg"
            iconRight="arrow-right"
          />
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
    paddingHorizontal: spacing.xxl,
    justifyContent: 'space-between',
  },
  headerSection: {
    paddingTop: spacing.xl,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    ...shadows.sm,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cardsContainer: {
    gap: spacing.lg,
  },
  roleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.sm,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FAFBFF',
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  cardTitleSection: {
    flex: 1,
  },
  roleTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  roleTitleSelected: {
    color: colors.primary,
  },
  roleDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  featuresSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  bottomSection: {
    paddingBottom: spacing.xxxl,
  },
});

export default RoleSelectionScreen;
