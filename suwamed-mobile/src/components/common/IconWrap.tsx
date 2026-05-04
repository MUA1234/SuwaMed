import React from 'react';
import { View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { borderRadius } from '../../config/theme';

// IconWrap is the single canonical way to render an icon in this app.
// "plain" — no background, just the icon; the default everywhere.
// "tinted" — barely-there primary-tinted background, for cards that need a hit-target hint.
// "outlined" — hairline ring, no fill.
// "accent" / "emergency" — reserved for true semantics, never decoration.
export type IconWrapVariant = 'plain' | 'tinted' | 'outlined' | 'accent' | 'emergency' | 'success' | 'warning';
export type IconWrapSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE: Record<IconWrapSize, { box: number; icon: number; radius: number }> = {
  sm: { box: 32, icon: 18, radius: borderRadius.sm },
  md: { box: 40, icon: 22, radius: borderRadius.md },
  lg: { box: 48, icon: 26, radius: borderRadius.md },
  xl: { box: 60, icon: 32, radius: borderRadius.lg },
};

interface IconWrapProps {
  name: string;
  variant?: IconWrapVariant;
  size?: IconWrapSize;
  color?: string;
  style?: ViewStyle;
}

const IconWrap: React.FC<IconWrapProps> = ({
  name,
  variant = 'plain',
  size = 'md',
  color,
  style,
}) => {
  const { theme: colors } = useTheme();
  const dim = SIZE[size];

  let bg: string = 'transparent';
  let fg: string = color ?? colors.primary;
  let border: string = 'transparent';
  let borderWidth = 0;

  switch (variant) {
    case 'plain':
      break;
    case 'tinted':
      bg = colors.primaryLight;
      fg = color ?? colors.primary;
      break;
    case 'outlined':
      border = colors.primary;
      borderWidth = 1.25;
      break;
    case 'accent':
      bg = colors.secondaryLight;
      fg = color ?? colors.secondary;
      break;
    case 'success':
      bg = colors.successLight;
      fg = color ?? colors.success;
      break;
    case 'warning':
      bg = colors.warningLight;
      fg = color ?? colors.warning;
      break;
    case 'emergency':
      bg = colors.emergencyLight;
      fg = color ?? colors.emergency;
      break;
  }

  return (
    <View
      style={[
        {
          width: dim.box,
          height: dim.box,
          borderRadius: dim.radius,
          backgroundColor: bg,
          borderColor: border,
          borderWidth,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <MaterialCommunityIcons name={name as any} size={dim.icon} color={fg} />
    </View>
  );
};

export default IconWrap;
