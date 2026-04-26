import React, { useRef } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Animated,
} from 'react-native';
import { spacing, borderRadius, shadows } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

type CardVariant = 'elevated' | 'outlined' | 'filled';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: CardVariant;
  noPadding?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
  noPadding = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const variantStyle: ViewStyle =
    variant === 'outlined'
      ? { borderWidth: 1, borderColor: colors.border }
      : variant === 'filled'
      ? { backgroundColor: colors.background }
      : {};

  const shadowStyle = variant === 'elevated' ? shadows.md : shadows.none;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }).start();
    }
  };

  const containerStyle = [
    styles.container,
    shadowStyle,
    variantStyle,
    noPadding && { padding: 0 },
    style,
  ];

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          style={containerStyle}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
});

export default Card;
