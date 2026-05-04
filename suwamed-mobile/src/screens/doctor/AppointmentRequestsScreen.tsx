import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import * as appointmentApi from '../../api/appointment.api';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
const AppointmentRequestsScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            const res = await appointmentApi.getAppointments({ status: 'pending' });
            setAppointments(res.data || []);
        } catch (err) {
            console.log('Appointment requests fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchRequests(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchRequests(); };

    const handleConfirm = async (id: string) => {
        setActionLoading(id + '_confirm');
        try {
            await appointmentApi.confirmAppointment(id);
            fetchRequests();
        } catch (err) {
            Alert.alert(t('common.error'), t('doctor.failedConfirmAppointment'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = (id: string) => {
        Alert.prompt(
            t('doctor.cancelAppointment'),
            t('doctor.cancelReasonPrompt'),
            [
                { text: t('doctor.keep'), style: 'cancel' },
                {
                    text: t('doctor.cancelAppointment'),
                    style: 'destructive',
                    onPress: async (reason?: string) => {
                        if (!reason?.trim()) {
                            Alert.alert(t('common.error'), t('doctor.reasonRequired'));
                            return;
                        }
                        setActionLoading(id + '_cancel');
                        try {
                            await appointmentApi.cancelAppointment(id, reason.trim());
                            fetchRequests();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ],
            'plain-text'
        );
    };

    const getInitials = (first: string = '', last: string = '') =>
        `${first[0] || ''}${last[0] || ''}`.toUpperCase();

    const avatarColors = [colors.primary, colors.secondary, colors.success, colors.warning, colors.primaryDark, colors.error];

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const patient = item.patientId;
        const firstName = patient?.firstName || '';
        const lastName = patient?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Patient';
        const initials = getInitials(firstName, lastName);
        const avatarColor = avatarColors[index % avatarColors.length];
        const dateStr = item.date
            ? new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            : 'N/A';
        const timeStr = item.startTime || 'N/A';
        const typeLabel = item.type === 'video' ? 'Video' : item.type === 'chat' ? 'Chat' : 'Follow-up';
        const typeIcon = item.type === 'video' ? 'video' : item.type === 'chat' ? 'chat' : 'calendar-refresh';
        const typeColor = item.type === 'video' ? colors.primary : item.type === 'chat' ? colors.success : colors.warning;
        const fee = item.doctorId?.consultationFee || item.fee || 0;

        const isConfirmLoading = actionLoading === item._id + '_confirm';
        const isCancelLoading = actionLoading === item._id + '_cancel';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={[styles.avatar, { backgroundColor: avatarColor + '20' }]}>
                        <Text style={[styles.avatarText, { color: avatarColor }]}>{initials}</Text>
                    </View>
                    <View style={styles.patientInfo}>
                        <Text style={styles.patientName}>{fullName}</Text>
                        <Text style={styles.reason} numberOfLines={1}>
                            {item.reason || 'No reason provided'}
                        </Text>
                    </View>
                    <View style={[styles.typeBadge, { backgroundColor: typeColor + '15' }]}>
                        <MaterialCommunityIcons name={typeIcon as any} size={12} color={typeColor} />
                        <Text style={[styles.typeText, { color: typeColor }]}>{typeLabel}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{dateStr}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{timeStr}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="cash" size={14} color={colors.success} />
                        <Text style={[styles.detailText, { color: colors.success, fontWeight: '600' }]}>
                            LKR {fee.toLocaleString()}
                        </Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.confirmBtn, isConfirmLoading && styles.btnDisabled]}
                        onPress={() => handleConfirm(item._id)}
                        disabled={!!actionLoading}
                        activeOpacity={0.8}
                    >
                        {isConfirmLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="check" size={16} color="#fff" />
                                <Text style={styles.confirmText}>{t('common.confirm')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.cancelBtn, isCancelLoading && styles.btnDisabled]}
                        onPress={() => handleCancel(item._id)}
                        disabled={!!actionLoading}
                        activeOpacity={0.8}
                    >
                        {isCancelLoading ? (
                            <ActivityIndicator size="small" color={colors.error} />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="close" size={16} color={colors.error} />
                                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.heading}>{t('doctor.appointmentRequests')}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.heading}>{t('doctor.appointmentRequests')}</Text>
                <View style={[styles.countBadge]}>
                    <Text style={styles.countText}>{appointments.length}</Text>
                </View>
            </View>

            <FlatList
                data={appointments}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="calendar-check" size={56} color={colors.textDisabled} />
                        <Text style={styles.emptyTitle}>{t('doctor.noPendingRequests')}</Text>
                        <Text style={styles.emptyText}>{t('doctor.newRequestsAppearHere')}</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    heading: { ...typography.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' },
    countBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: { fontSize: 16, fontWeight: '700' },
    patientInfo: { flex: 1 },
    patientName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    reason: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    typeText: { fontSize: 11, fontWeight: '600' },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailText: { ...typography.caption, color: colors.textSecondary },
    actionRow: { flexDirection: 'row', gap: spacing.sm },
    confirmBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.success,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        gap: 6,
    },
    confirmText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    cancelBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        borderWidth: 1.5,
        borderColor: colors.error,
        gap: 6,
    },
    cancelText: { color: colors.error, fontWeight: '600', fontSize: 14 },
    btnDisabled: { opacity: 0.6 },
    empty: { alignItems: 'center', paddingVertical: spacing.xxxl * 2 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg },
    emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
});

export default AppointmentRequestsScreen;
