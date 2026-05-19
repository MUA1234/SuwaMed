import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Linking,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

type RouteParams = { appointmentId: string; counterpartyName?: string };

// Jitsi room names are derived from the appointment id so both parties end up
// in the same room without any backend round-trip or API keys. The "suwamed-"
// prefix keeps our rooms separate from random meet.jit.si traffic.
const buildJitsiUrl = (appointmentId: string) => {
  const room = `suwamed-${appointmentId}`;
  return `https://meet.jit.si/${room}`;
};

const VideoCallScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params || {}) as RouteParams;
  const appointmentId = String(params.appointmentId || '');

  const [opening, setOpening] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const joinUrl = appointmentId ? buildJitsiUrl(appointmentId) : '';

  const openMeeting = async () => {
    if (!joinUrl) {
      setError('Missing appointment id — cannot start the call.');
      setOpening(false);
      return;
    }
    setOpening(true);
    setError(null);
    try {
      // openAuthSessionAsync gives a Chrome Custom Tab / SFSafariViewController
      // that returns control to the app when the user closes it.
      await WebBrowser.openBrowserAsync(joinUrl, {
        toolbarColor: colors.primary,
        controlsColor: '#ffffff',
        enableBarCollapsing: true,
        showTitle: true,
      });
    } catch {
      // Fallback to the OS default browser if the in-app browser is unavailable.
      try {
        await Linking.openURL(joinUrl);
      } catch {
        setError('Could not open the meeting. Please check your internet connection.');
      }
    } finally {
      setOpening(false);
    }
  };

  useEffect(() => {
    openMeeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.warning} />
          <Text style={styles.errorTitle}>{t('common.error')}</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={openMeeting} activeOpacity={0.8}>
            <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>{t('common.close') || 'Close'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.lobbyBox}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="video-outline" size={56} color={colors.primary} />
        </View>
        <Text style={styles.title}>Video Consultation</Text>
        {params.counterpartyName ? (
          <Text style={styles.subtitle}>with {params.counterpartyName}</Text>
        ) : null}
        <Text style={styles.helper}>
          The consultation opens in a secure browser tab powered by Jitsi Meet. Allow camera and microphone when prompted.
        </Text>

        {opening ? (
          <View style={styles.statusRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.statusText}>Opening meeting…</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={openMeeting} activeOpacity={0.8}>
            <MaterialCommunityIcons name="video" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Rejoin Meeting</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={colors.textSecondary} />
          <Text style={styles.secondaryBtnText}>Back to appointment</Text>
        </TouchableOpacity>

        {Platform.OS !== 'web' && joinUrl ? (
          <Text style={styles.urlHint} numberOfLines={1} ellipsizeMode="middle">{joinUrl}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    lobbyBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    iconWrap: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
    helper: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: spacing.md,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
    },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md },
    statusText: { ...typography.body, color: colors.textSecondary },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      gap: spacing.sm,
      minWidth: 220,
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    secondaryBtnText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
    urlHint: {
      ...typography.caption,
      color: colors.textDisabled,
      marginTop: spacing.lg,
      maxWidth: '90%',
    },
    errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
    errorTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md },
    errorBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  });

export default VideoCallScreen;
