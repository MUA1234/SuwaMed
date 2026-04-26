import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../config/theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';
type BadgeSize = 'small' | 'medium';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#D1FAE5', text: colors.success },
  warning: { bg: '#FEF3C7', text: '#92400E' },
  error: { bg: '#FEE2E2', text: colors.error },
  info: { bg: '#DBEAFE', text: colors.info },
  default: { bg: colors.background, text: colors.textSecondary },
};

const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'medium',
}) => {
  const colorScheme = variantColors[variant];
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
