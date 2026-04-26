import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows, gradients } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconRight?: string;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const sizeStyles: Record<ButtonSize, { height: number; paddingH: number; fontSize: number }> = {
  sm: { height: 38, paddingH: 14, fontSize: 13 },
  md: { height: 48, paddingH: 20, fontSize: 15 },
  lg: { height: 56, paddingH: 28, fontSize: 16 },
};

const getVariantStyles = (
  variant: ButtonVariant,
  disabled: boolean,
  colors: ThemeColors,
): { container: ViewStyle; text: TextStyle; iconColor: string; useGradient: boolean; gradientColors: [string, string] } => {
  const base = {
    container: {} as ViewStyle,
    text: {} as TextStyle,
    iconColor: '',
    useGradient: false,
    gradientColors: ['transparent', 'transparent'] as [string, string],
  };

  switch (variant) {
    case 'primary':
      base.useGradient = !disabled;
      base.gradientColors = disabled ? ['#94A3B8', '#94A3B8'] : gradients.primary;
      base.container = {
        backgroundColor: disabled ? colors.textDisabled : colors.primary,
      };
      base.text = { color: '#FFFFFF' };
      base.iconColor = '#FFFFFF';
      break;
    case 'secondary':
      base.useGradient = !disabled;
      base.gradientColors = disabled ? ['#94A3B8', '#94A3B8'] : gradients.secondary;
      base.container = {
        backgroundColor: disabled ? colors.textDisabled : colors.secondary,
      };
      base.text = { color: '#FFFFFF' };
      base.iconColor = '#FFFFFF';
      break;
    case 'outline':
      base.container = {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: disabled ? colors.textDisabled : colors.primary,
      };
      base.text = { color: disabled ? colors.textDisabled : colors.primary };
      base.iconColor = disabled ? colors.textDisabled : colors.primary;
      break;
    case 'ghost':
      base.container = {
        backgroundColor: disabled ? 'transparent' : colors.primaryLight,
      };
      base.text = { color: disabled ? colors.textDisabled : colors.primary };
      base.iconColor = disabled ? colors.textDisabled : colors.primary;
      break;
    case 'danger':
      base.container = {
        backgroundColor: disabled ? colors.textDisabled : colors.error,
      };
      base.text = { color: '#FFFFFF' };
      base.iconColor = '#FFFFFF';
      break;
  }

  return base;
};

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  fullWidth = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme: colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const variantStyles = getVariantStyles(variant, disabled || loading, colors);
  const sizeStyle = sizeStyles[size];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const innerContent = (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color as string}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && (
            <MaterialCommunityIcons
              name={icon as any}
              size={sizeStyle.fontSize + 4}
              color={variantStyles.iconColor}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.text,
              variantStyles.text,
              { fontSize: sizeStyle.fontSize },
            ]}
          >
            {title}
          </Text>
          {iconRight && (
            <MaterialCommunityIcons
              name={iconRight as any}
              size={sizeStyle.fontSize + 2}
              color={variantStyles.iconColor}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </>
  );

  const containerStyle: ViewStyle = {
    height: sizeStyle.height,
    paddingHorizontal: sizeStyle.paddingH,
    borderRadius: borderRadius.sm,
    ...variantStyles.container,
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && { width: '100%' },
        variant === 'primary' || variant === 'secondary'
          ? shadows.md
          : undefined,
      ]}
    >
      {variantStyles.useGradient ? (
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || title}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled: disabled || loading, busy: loading }}
          style={fullWidth ? { width: '100%' } : undefined}
        >
          <LinearGradient
            colors={variantStyles.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.container,
              containerStyle,
              { backgroundColor: undefined, borderWidth: 0 },
              fullWidth && { width: '100%' },
              style,
            ]}
          >
            {innerContent}
          </LinearGradient>
        </Pressable>
      ) : (
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || title}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled: disabled || loading, busy: loading }}
          style={[
            styles.container,
            containerStyle,
            fullWidth && { width: '100%' },
            style,
          ]}
        >
          {innerContent}
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});

export default Button;
