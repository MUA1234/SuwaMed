import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../types/navigation.types';
import Button from '../../components/common/Button';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import { spacing, borderRadius, typography, shadows, gradients } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
type WelcomeNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const { width, height } = Dimensions.get('window');

const WelcomeScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<WelcomeNavigationProp>();
  const { t } = useTranslation();

  const logoAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const bottomAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.parallel([
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bottomAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.languageSwitcherContainer}>
        <LanguageSwitcher />
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoAnim,
              transform: [{ scale: logoAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoCircle}
          >
            <MaterialCommunityIcons
              name="hospital-box"
              size={44}
              color="#FFFFFF"
            />
          </LinearGradient>
          <Text style={styles.appName}>{t('common.appName')}</Text>
          <Text style={styles.tagline}>{t('common.tagline')}</Text>
        </Animated.View>

        <Animated.View style={[styles.illustrationContainer, { opacity: contentAnim }]}>
          <View style={styles.illustrationOuter}>
            <LinearGradient
              colors={gradients.heroSoft}
              style={styles.illustration}
            >
              <MaterialCommunityIcons
                name="heart-pulse"
                size={72}
                color={colors.primary}
              />
            </LinearGradient>
          </View>
          {/* Floating decorative elements */}
          <Animated.View style={[styles.floatingDot, styles.dotTopLeft]}>
            <LinearGradient colors={['#F97316', '#FB923C']} style={styles.dotGradient} />
          </Animated.View>
          <Animated.View style={[styles.floatingDot, styles.dotTopRight]}>
            <LinearGradient colors={['#8B5CF6', '#A78BFA']} style={styles.dotGradientSm} />
          </Animated.View>
          <Animated.View style={[styles.floatingDot, styles.dotBottomLeft]}>
            <LinearGradient colors={['#10B981', '#34D399']} style={styles.dotGradientSm} />
          </Animated.View>
          <Animated.View style={[styles.floatingDot, styles.dotBottomRight]}>
            <LinearGradient colors={gradients.primary} style={styles.dotGradientXs} />
          </Animated.View>

          {/* Feature pills */}
          <View style={[styles.featurePill, styles.pillLeft]}>
            <MaterialCommunityIcons name="video" size={14} color={colors.primary} />
            <Text style={styles.pillText}>{t('patient.videoConsult')}</Text>
          </View>
          <View style={[styles.featurePill, styles.pillRight]}>
            <MaterialCommunityIcons name="shield-check" size={14} color={colors.success} />
            <Text style={styles.pillText}>{t('patient.verifiedDoctors')}</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: contentAnim,
              transform: [{ translateY: bottomAnim }],
            },
          ]}
        >
          <Button
            title={t('auth.getStarted')}
            onPress={() => navigation.navigate('Onboarding')}
            fullWidth
            size="lg"
            iconRight="arrow-right"
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              {t('auth.alreadyHaveAccount')}{' '}
              <Text style={styles.loginTextBold}>{t('common.login')}</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  languageSwitcherContainer: {
    position: 'absolute',
    top: 54,
    right: spacing.xl,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: 90,
    paddingBottom: spacing.xxxl,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: width * 0.7,
    height: width * 0.7,
  },
  illustrationOuter: {
    ...shadows.xl,
  },
  illustration: {
    width: width * 0.42,
    height: width * 0.42,
    borderRadius: width * 0.21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingDot: {
    position: 'absolute',
  },
  dotTopLeft: {
    top: 10,
    left: 20,
  },
  dotTopRight: {
    top: 30,
    right: 15,
  },
  dotBottomLeft: {
    bottom: 40,
    left: 15,
  },
  dotBottomRight: {
    bottom: 20,
    right: 30,
  },
  dotGradient: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  dotGradientSm: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotGradientXs: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  featurePill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: 6,
    ...shadows.md,
  },
  pillLeft: {
    left: -10,
    bottom: 70,
  },
  pillRight: {
    right: -15,
    top: 70,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  loginLink: {
    marginTop: spacing.xl,
    padding: spacing.sm,
  },
  loginText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  loginTextBold: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default WelcomeScreen;
