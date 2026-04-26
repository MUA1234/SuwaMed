import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius } from '../../config/theme';
import BottomSheet from './BottomSheet';

interface LanguageSwitcherProps {
  style?: StyleProp<ViewStyle>;
}

interface LanguageOption {
  code: string;
  label: string;
}

const languages: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'si', label: '\u0DC3\u0DD2\u0D82\u0DC4\u0DBD' },
  { code: 'ta', label: '\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD' },
];

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ style }) => {
  const { i18n } = useTranslation();
  const [visible, setVisible] = useState(false);

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    setVisible(false);
  };

  return (
    <View style={style}>
      <Pressable style={styles.chip} onPress={() => setVisible(true)}>
        <MaterialCommunityIcons
          name="translate"
          size={18}
          color={colors.primary}
        />
        <Text style={styles.chipText}>{currentLanguage.label}</Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>

      <BottomSheet
        visible={visible}
        onDismiss={() => setVisible(false)}
        title="Select Language"
        height={35}
      >
        {languages.map((lang) => {
          const isActive = i18n.language === lang.code;
          return (
            <Pressable
              key={lang.code}
              style={[styles.option, isActive && styles.optionActive]}
              onPress={() => handleSelect(lang.code)}
            >
              <Text
                style={[styles.optionText, isActive && styles.optionTextActive]}
              >
                {lang.label}
              </Text>
              {isActive && (
                <MaterialCommunityIcons
                  name="check"
                  size={22}
                  color={colors.primary}
                />
              )}
            </Pressable>
          );
        })}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginHorizontal: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  optionActive: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  optionTextActive: {
    fontWeight: '600',
    color: colors.primary,
  },
});

export default LanguageSwitcher;
