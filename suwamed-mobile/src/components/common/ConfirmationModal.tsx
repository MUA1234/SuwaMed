import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../config/theme';
import Button from './Button';

type ConfirmationVariant = 'danger' | 'warning' | 'info';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: ConfirmationVariant;
  loading?: boolean;
}

const variantButtonMap: Record<ConfirmationVariant, 'danger' | 'primary' | 'primary'> = {
  danger: 'danger',
  warning: 'primary',
  info: 'primary',
};

const variantColorMap: Record<ConfirmationVariant, string> = {
  danger: colors.error,
  warning: colors.warning,
  info: colors.info,
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
  loading = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Close dialog" />
        <View style={styles.dialog} accessibilityRole="alert">
          <View
            style={[
              styles.indicator,
              { backgroundColor: variantColorMap[variant] },
            ]}
          />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <View style={styles.buttonWrapper}>
              <Button
                title={cancelLabel}
                onPress={onCancel}
                variant="ghost"
                disabled={loading}
                fullWidth
              />
            </View>
            <View style={styles.buttonWrapper}>
              <Button
                title={confirmLabel}
                onPress={onConfirm}
                variant={variantButtonMap[variant]}
                loading={loading}
                fullWidth
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  indicator: {
    width: 48,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xxl,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  buttonWrapper: {
    flex: 1,
  },
});

export default ConfirmationModal;
