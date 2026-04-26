import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { spacing } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'small' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullScreen = false,
  message,
  size = 'large',
}) => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  if (fullScreen) {
    return (
      <View style={styles.fullScreen} accessibilityRole="progressbar" accessibilityLabel={message || 'Loading'}>
        <View style={styles.spinnerBox}>
          <ActivityIndicator size={size} color={colors.primary} />
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.inline} accessibilityRole="progressbar" accessibilityLabel={message || 'Loading'}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  spinnerBox: {
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  message: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default LoadingSpinner;
