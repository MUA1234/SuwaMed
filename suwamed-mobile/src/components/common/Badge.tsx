import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, borderRadius } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';
type BadgeSize = 'small' | 'medium';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const getVariantColors = (colors: ThemeColors): Record<BadgeVariant, { bg: string; text: string }> => ({
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  error: { bg: colors.errorLight, text: colors.error },
  info: { bg: colors.infoLight, text: colors.info },
  default: { bg: colors.background, text: colors.textSecondary },
});

const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'medium',
}) => {
  const { theme: colors } = useTheme();
  const colorScheme = getVariantColors(colors)[variant];
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colorScheme.bg,
          paddingVertical: isSmall ? 2 : spacing.xs,
          paddingHorizontal: isSmall ? spacing.sm : spacing.md,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${label} status`}
    >
      <Text
        style={[
          styles.label,
          {
            color: colorScheme.text,
            fontSize: isSmall ? 10 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
});

export default Badge;
