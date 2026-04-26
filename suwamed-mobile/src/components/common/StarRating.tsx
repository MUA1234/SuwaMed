import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showLabel?: boolean;
  color?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 24,
  interactive = false,
  onRatingChange,
  showLabel = false,
  color,
}) => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const resolvedColor = color ?? colors.accent;
  const getStarIcon = (index: number) => {
    const starPosition = index + 1;
    if (rating >= starPosition) {
      return 'star' as const;
    }
    if (rating >= starPosition - 0.5) {
      return 'star-half-full' as const;
    }
    return 'star-outline' as const;
  };

  const handlePress = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <View
      style={styles.container}
      accessibilityRole={interactive ? 'adjustable' : undefined}
      accessibilityLabel={`Rating: ${rating} out of ${maxStars} stars`}
      accessibilityValue={{ min: 0, max: maxStars, now: rating }}
    >
      <View style={styles.starsRow}>
        {Array.from({ length: maxStars }, (_, index) => {
          const iconName = getStarIcon(index);
          if (interactive) {
            return (
              <Pressable
                key={index}
                onPress={() => handlePress(index)}
                style={styles.starButton}
                accessibilityRole="button"
                accessibilityLabel={`Rate ${index + 1} star${index > 0 ? 's' : ''}`}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={size}
                  color={resolvedColor}
                />
              </Pressable>
            );
          }
          return (
            <MaterialCommunityIcons
              key={index}
              name={iconName}
              size={size}
              color={resolvedColor}
              style={styles.star}
            />
          );
        })}
      </View>
      {showLabel && (
        <Text style={styles.label}>
          {rating.toFixed(1)}/{maxStars}
        </Text>
      )}
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
  starButton: {
    marginRight: 2,
    padding: 2,
  },
  label: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});

export default StarRating;
