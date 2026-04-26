import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../types/navigation.types';
import Button from '../../components/common/Button';
import { colors, spacing, borderRadius, typography, shadows } from '../../config/theme';

type OnboardingNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

interface OnboardingPage {
  id: string;
  icon: string;
  title: string;
  description: string;
  gradient: [string, string];
  iconBg: string;
}

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const { t } = useTranslation();

  const pages: OnboardingPage[] = [
    {
      id: '1',
      icon: 'doctor',
      title: t('onboarding.page1Title'),
      description: t('onboarding.page1Desc'),
      gradient: ['#2563EB', '#1D4ED8'],
      iconBg: '#DBEAFE',
    },
    {
      id: '2',
      icon: 'stethoscope',
      title: t('onboarding.page2Title'),
      description: t('onboarding.page2Desc'),
      gradient: ['#0D9488', '#0F766E'],
      iconBg: '#CCFBF1',
    },
    {
      id: '3',
      icon: 'video',
      title: t('onboarding.page3Title'),
      description: t('onboarding.page3Desc'),
      gradient: ['#F97316', '#EA580C'],
      iconBg: '#FFF7ED',
    },
    {
      id: '4',
      icon: 'file-document-multiple',
      title: t('onboarding.page4Title'),
      description: t('onboarding.page4Desc'),
      gradient: ['#8B5CF6', '#7C3AED'],
      iconBg: '#F5F3FF',
    },
  ];
  const flatListRef = useRef<FlatList<OnboardingPage>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < pages.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.navigate('RoleSelection');
    }
  };

  const handleSkip = () => {
    navigation.navigate('RoleSelection');
  };

  const renderPage = ({ item }: { item: OnboardingPage }) => (
    <View style={styles.page}>
      <View style={styles.iconSection}>
        <View style={[styles.iconOuterRing, { borderColor: item.gradient[0] + '15' }]}>
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={64}
              color="#FFFFFF"
            />
          </LinearGradient>
        </View>
      </View>
      <View style={styles.textSection}>
        <Text style={styles.pageTitle}>{item.title}</Text>
        <Text style={styles.pageDescription}>{item.description}</Text>
      </View>
    </View>
  );

  const isLastPage = currentIndex === pages.length - 1;
  const currentPage = pages[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.stepCounter}>
          <Text style={styles.stepText}>
            {currentIndex + 1}
            <Text style={styles.stepTotal}> / {pages.length}</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.7}>
          <Text style={styles.skipText}>{t('common.skip')}</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {pages.map((page, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex
                  ? [styles.activeDot, { backgroundColor: currentPage.gradient[0] }]
                  : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        <Button
          title={isLastPage ? t('auth.getStarted') : t('common.next')}
          onPress={handleNext}
          fullWidth
          size="lg"
          iconRight={isLastPage ? 'check' : 'arrow-right'}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
  },
  stepCounter: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepTotal: {
    color: colors.textDisabled,
    fontWeight: '500',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: 4,
  },
  skipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  page: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  iconSection: {
    marginBottom: spacing.xxxl + 8,
  },
  iconOuterRing: {
    width: width * 0.56,
    height: width * 0.56,
    borderRadius: width * 0.28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: width * 0.48,
    height: width * 0.48,
    borderRadius: width * 0.24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  textSection: {
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  pageDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 28,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: colors.border,
  },
});

export default OnboardingScreen;
