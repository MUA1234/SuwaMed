import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  StyleProp,
  KeyboardTypeOptions,
  Pressable,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  secureTextEntry?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  maxLength?: number;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  keyboardType,
  autoCapitalize,
  multiline = false,
  maxLength,
  editable = true,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = error
    ? colors.error
    : borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.border, colors.primary],
      });

  const iconColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.textSecondary;

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={[styles.label, error && styles.labelError]}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor },
          isFocused && styles.inputFocused,
          multiline && styles.multiline,
          !editable && styles.disabled,
          error && styles.inputError,
        ]}
      >
        {leftIcon && (
          <MaterialCommunityIcons
            name={leftIcon as any}
            size={20}
            color={iconColor}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          maxLength={maxLength}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label || placeholder}
          accessibilityState={{ disabled: !editable }}
          accessibilityHint={error ? `Error: ${error}` : hint}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            { color: editable ? colors.textPrimary : colors.textDisabled },
          ]}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} style={styles.rightIcon} hitSlop={8}>
            <MaterialCommunityIcons
              name={rightIcon as any}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </Animated.View>
      {error && (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle" size={13} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg + 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  labelError: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    minHeight: 50,
  },
  inputFocused: {
    ...shadows.sm,
    backgroundColor: '#FAFBFF',
  },
  inputError: {
    backgroundColor: '#FFF5F5',
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: spacing.md,
    letterSpacing: 0.1,
  },
  multiline: {
    minHeight: 110,
    alignItems: 'flex-start',
    paddingTop: spacing.md,
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  disabled: {
    backgroundColor: colors.background,
    opacity: 0.7,
  },
  leftIcon: {
    marginRight: spacing.sm + 2,
  },
  rightIcon: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs + 2,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs + 2,
  },
});

export default Input;
