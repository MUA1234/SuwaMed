import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

// react-native-agora ships native code that Expo Go cannot host. The require
// is wrapped in try/catch so the screen still mounts inside Expo Go (showing
// an instructional message instead of crashing the bundle). In an EAS
// development client / production build the require succeeds and the full
// video call works.
let agora: any = null;
let ChannelProfileType: any = null;
let ClientRoleType: any = null;
let RtcSurfaceView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const lib = require('react-native-agora');
  agora = lib;
  ChannelProfileType = lib.ChannelProfileType;
  ClientRoleType = lib.ClientRoleType;
  RtcSurfaceView = lib.RtcSurfaceView;
} catch {
  /* package not installed — surfaced in UI below */
}

type RouteParams = { appointmentId: string; counterpartyName?: string };

const VideoCallScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params || {}) as RouteParams;
  const appointmentId = String(params.appointmentId || '');

  const engineRef = useRef<any>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Join flow ----------------------------------------------------------
  useEffect(() => {
    if (!agora) {
      setError(
        'Video calls require a development build of SuwaMed. The react-native-agora native module is not available in Expo Go. Run `eas build --profile development --platform android` to enable video.',
      );
      setLoading(false);
      return;
    }
    let cancelled = false;
    let engine: any = null;
    (async () => {
      try {
        const res = await client.post(`/consultations/${appointmentId}/token`);
        const data = res.data?.data as
          | { appId: string; channelName: string; token: string; uid: number }
          | undefined;
        if (!data || cancelled) {
          setError('Could not obtain a video call token.');
          setLoading(false);
          return;
        }
        engine = agora.createAgoraRtcEngine();
        engine.initialize({
          appId: data.appId,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });
        engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
        engine.enableVideo();
        engine.enableAudio();
        engine.startPreview();

        engine.registerEventHandler({
          onJoinChannelSuccess: () => {
            if (!cancelled) setJoined(true);
          },
          onUserJoined: (_conn: unknown, uid: number) => {
            if (!cancelled) setRemoteUid(uid);
          },
          onUserOffline: () => {
            if (!cancelled) setRemoteUid(null);
          },
          onError: (err: number, msg: string) => {
            if (!cancelled) setError(`Agora error ${err}: ${msg}`);
          },
        });

        engine.joinChannel(data.token, data.channelName, data.uid, {
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishCameraTrack: true,
          publishMicrophoneTrack: true,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        });

        engineRef.current = engine;
        setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to start the call.');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      try {
        engine?.leaveChannel();
        engine?.release();
      } catch {
        /* ignore */
      }
      engineRef.current = null;
    };
  }, [appointmentId]);

  // ---- Controls -----------------------------------------------------------
  const handleEnd = () => {
    try {
      engineRef.current?.leaveChannel();
      engineRef.current?.release();
    } catch {
      /* ignore */
    }
    navigation.goBack();
  };
  const handleMute = () => {
    const next = !muted;
    setMuted(next);
    engineRef.current?.muteLocalAudioStream(next);
  };
  const handleCameraToggle = () => {
    const next = !cameraOff;
    setCameraOff(next);
    engineRef.current?.muteLocalVideoStream(next);
  };
  const handleFlip = () => {
    try {
      engineRef.current?.switchCamera();
    } catch {
      /* ignore */
    }
  };
  const handleSpeaker = () => {
    const next = !speakerOn;
    setSpeakerOn(next);
    engineRef.current?.setEnableSpeakerphone(next);
  };

  // ---- Render -------------------------------------------------------------
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.warning} />
          <Text style={styles.errorTitle}>{t('common.error')}</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity style={styles.endBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.endBtnText}>{t('common.close') || 'Close'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || !joined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>{t('common.connecting')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.remotePane}>
        {remoteUid !== null && RtcSurfaceView ? (
          <RtcSurfaceView canvas={{ uid: remoteUid }} style={styles.remoteVideo} />
        ) : (
          <View style={styles.waitingBox}>
            <MaterialCommunityIcons name="account-circle-outline" size={96} color={colors.textDisabled} />
            <Text style={styles.waitingText}>
              {params.counterpartyName
                ? `Waiting for ${params.counterpartyName}…`
                : 'Waiting for the other party to join…'}
            </Text>
          </View>
        )}
      </View>

      {RtcSurfaceView && !cameraOff && (
        <View style={styles.localPane}>
          <RtcSurfaceView canvas={{ uid: 0 }} style={styles.localVideo} />
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.ctrlBtn, muted && styles.ctrlBtnActive]} onPress={handleMute} activeOpacity={0.7}>
          <MaterialCommunityIcons name={muted ? 'microphone-off' : 'microphone'} size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrlBtn, cameraOff && styles.ctrlBtnActive]} onPress={handleCameraToggle} activeOpacity={0.7}>
          <MaterialCommunityIcons name={cameraOff ? 'video-off' : 'video'} size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={handleFlip} activeOpacity={0.7}>
          <MaterialCommunityIcons name="camera-flip" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrlBtn, !speakerOn && styles.ctrlBtnActive]} onPress={handleSpeaker} activeOpacity={0.7}>
          <MaterialCommunityIcons name={speakerOn ? 'volume-high' : 'volume-off'} size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.endCallBtn} onPress={handleEnd} activeOpacity={0.7}>
          <MaterialCommunityIcons name="phone-hangup" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    loadingText: { ...typography.body, color: '#fff' },
    errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
    errorTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md },
    errorBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
    remotePane: { flex: 1, backgroundColor: '#0c0c0c' },
    remoteVideo: { flex: 1 },
    waitingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    waitingText: { ...typography.body, color: '#aaa', textAlign: 'center', paddingHorizontal: spacing.lg },
    localPane: { position: 'absolute', top: spacing.xl, right: spacing.md, width: 110, height: 160, borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 2, borderColor: '#fff' },
    localVideo: { flex: 1 },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      backgroundColor: 'rgba(0,0,0,0.85)',
    },
    ctrlBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    ctrlBtnActive: { backgroundColor: '#d32f2f' },
    endCallBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#d32f2f', alignItems: 'center', justifyContent: 'center' },
    endBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
    endBtnText: { color: '#fff', fontWeight: '600' },
  });

export default VideoCallScreen;
