import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const CATEGORIES = [
  { key: 'technical', label: 'Technical issue' },
  { key: 'payment', label: 'Payment' },
  { key: 'account', label: 'Account' },
  { key: 'consultation', label: 'Consultation' },
  { key: 'other', label: 'Other' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

const SubmitTicketScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryKey>('technical');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (subject.trim().length < 3) {
      Alert.alert(t('common.error'), 'Please enter a subject of at least 3 characters.');
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert(t('common.error'), 'Please describe the issue in at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await client.post('/support-tickets', {
        subject: subject.trim(),
        description: description.trim(),
        category,
      });
      Alert.alert(t('common.success') || 'Thanks', 'Your ticket has been submitted. Our team will reply by email or in-app notification.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.response?.data?.message || 'Could not submit your ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit a ticket</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              onPress={() => setCategory(c.key)}
              style={[styles.categoryChip, category === c.key && styles.categoryChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryChipText, category === c.key && styles.categoryChipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="Short description of the issue"
          placeholderTextColor={colors.textDisabled}
          maxLength={200}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Tell us what happened, what you expected, and any steps to reproduce."
          placeholderTextColor={colors.textDisabled}
          multiline
          maxLength={5000}
          textAlignVertical="top"
        />
        <Text style={styles.counter}>{description.length}/5000</Text>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit ticket</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { padding: spacing.xs, width: 40 },
    headerTitle: { ...typography.h3, color: colors.textPrimary },
    body: { padding: spacing.lg, paddingBottom: spacing.xxl },
    label: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
    categoryChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    categoryChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    categoryChipText: { ...typography.caption, color: colors.textSecondary },
    categoryChipTextActive: { color: colors.primary, fontWeight: '600' },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.textPrimary,
      ...typography.body,
    },
    textarea: { minHeight: 140 },
    counter: { ...typography.caption, color: colors.textDisabled, alignSelf: 'flex-end', marginTop: spacing.xs },
    submitBtn: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  });

export default SubmitTicketScreen;
