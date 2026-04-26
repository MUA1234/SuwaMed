import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing } from '../../config/theme';

type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

interface AvatarProps {
  source?: string;
  size?: AvatarSize;
  name?: string;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  style?: StyleProp<ViewStyle>;
}

const sizeMap: Record<AvatarSize, number> = {
  small: 40,
  medium: 60,
  large: 80,
  xlarge: 120,
};

const fontSizeMap: Record<AvatarSize, number> = {
  small: 14,
  medium: 20,
  large: 28,
  xlarge: 40,
};

const statusDotSizeMap: Record<AvatarSize, number> = {
  small: 10,
  medium: 14,
  large: 18,
  xlarge: 24,
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getColorFromName = (name: string): string => {
  const avatarColors = [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.info,
    colors.success,
    colors.primaryDark,
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const Avatar: React.FC<AvatarProps> = ({
  source,
  size = 'medium',
  name,
  showOnlineStatus = false,
  isOnline = false,
  style,
}) => {
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const statusDotSize = statusDotSizeMap[size];

  return (
    <View
      style={[{ width: dimension, height: dimension }, style]}
      accessibilityRole="image"
      accessibilityLabel={name ? `${name}'s avatar${showOnlineStatus ? (isOnline ? ', online' : ', offline') : ''}` : 'User avatar'}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              backgroundColor: name ? getColorFromName(name) : colors.textDisabled,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>
            {name ? getInitials(name) : '?'}
          </Text>
        </View>
      )}
      {showOnlineStatus && (
        <View
          style={[
            styles.statusDot,
            {
              width: statusDotSize,
              height: statusDotSize,
              borderRadius: statusDotSize / 2,
              backgroundColor: isOnline ? colors.success : colors.textDisabled,
              borderWidth: statusDotSize * 0.15,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderColor: colors.surface,
  },
});

export default Avatar;
