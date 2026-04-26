import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import Button from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
  iconBgColor?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor,
  iconBgColor,
}) => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const resolvedIconColor = iconColor ?? colors.textDisabled;
  const resolvedIconBgColor = iconBgColor ?? colors.borderLight;
  return (
    <View style={styles.container} accessibilityRole="text" accessibilityLabel={`${title}. ${description}`}>
      <View style={[styles.iconContainer, { backgroundColor: resolvedIconBgColor }]} importantForAccessibility="no-hide-descendants">
        <MaterialCommunityIcons
          name={icon as any}
          size={48}
          color={resolvedIconColor}
          accessibilityElementsHidden
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="sm"
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxxl,
    paddingHorizontal: spacing.xxxl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xxl,
    maxWidth: 280,
  },
  actionButton: {
    minWidth: 160,
  },
});

export default EmptyState;
