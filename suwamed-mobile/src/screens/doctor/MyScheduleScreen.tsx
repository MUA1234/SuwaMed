import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as appointmentApi from '../../api/appointment.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = -3; i <= 10; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d);
    }
    return dates;
};

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: '#FFFBEB', text: '#F59E0B', label: 'Pending' },
    confirmed: { bg: '#EBF5FF', text: '#1A73E8', label: 'Upcoming' },
    in_progress: { bg: '#FFFBEB', text: '#F59E0B', label: 'In Progress' },
    completed: { bg: '#ECFDF5', text: '#10B981', label: 'Completed' },
    cancelled: { bg: '#FEF2F2', text: '#DC2626', label: 'Cancelled' },
    no_show: { bg: '#F3F4F6', text: '#6B7280', label: 'No Show' },
};

const MyScheduleScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const dates = generateDates();
    const flatListRef = useRef<FlatList>(null);

    const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
    const isSelected = (d: Date) => d.toDateString() === selectedDate.toDateString();

    const fetchAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const dateStr = selectedDate.toISOString().split('T')[0];
            const res = await appointmentApi.getAppointments({ date: dateStr });
            setAppointments(res.data || []);
        } catch (err) {
            console.log('Schedule fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    useEffect(() => {
        setTimeout(() => flatListRef.current?.scrollToIndex({ index: 3, animated: true, viewPosition: 0.3 }), 300);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.heading}>{t('doctor.mySchedule')}</Text>
                <TouchableOpacity style={styles.addBtn} activeOpacity={0.7} onPress={() => navigation.navigate('SetAvailabilityScreen')}>
                    <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                    <Text style={styles.addBtnText}>{t('doctor.setAvailability')}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.calendarStrip}>
                <FlatList
                    ref={flatListRef}
                    data={dates}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.toISOString()}
                    contentContainerStyle={{ paddingHorizontal: spacing.md }}
                    getItemLayout={(_, index) => ({ length: 64, offset: 64 * index, index })}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.dateCard, isSelected(item) && styles.dateCardSelected, isToday(item) && !isSelected(item) && styles.dateCardToday]}
                            onPress={() => setSelectedDate(item)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.dayText, isSelected(item) && styles.dayTextSelected]}>{DAYS_OF_WEEK[item.getDay()]}</Text>
                            <Text style={[styles.dateNum, isSelected(item) && styles.dateNumSelected]}>{item.getDate()}</Text>
                            {isToday(item) && <View style={[styles.todayDot, isSelected(item) && styles.todayDotSelected]} />}
                        </TouchableOpacity>
                    )}
                />
            </View>

            <View style={styles.dateHeader}>
                <Text style={styles.dateHeaderText}>
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                <Text style={styles.apptCount}>{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            ) : (
                <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {appointments.length === 0 && (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={colors.textDisabled} />
                            <Text style={styles.emptyText}>No appointments for this day</Text>
                        </View>
                    )}
                    {appointments.map((appt: any, idx: number) => {
                        const ss = statusColors[appt.status] || statusColors.pending;
                        const patientName = appt.patientId ? `${appt.patientId.firstName} ${appt.patientId.lastName}` : 'Patient';
                        return (
                            <TouchableOpacity key={appt._id} style={styles.timelineItem} activeOpacity={0.7} onPress={() => navigation.navigate('AppointmentDetailScreen', { appointmentId: appt._id })}>
                                <View style={styles.timelineLeft}>
                                    <Text style={styles.timeText}>{appt.startTime}</Text>
                                    {idx < appointments.length - 1 && <View style={styles.timelineLine} />}
                                </View>
                                <View style={[styles.timelineCard, { borderLeftColor: ss.text, borderLeftWidth: 3 }]}>
                                    <View style={styles.timelineCardHeader}>
                                        <Text style={styles.patientName}>{patientName}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: ss.bg }]}>
                                            <Text style={[styles.statusText, { color: ss.text }]}>{ss.label}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.consultType}>{appt.reason || appt.type}</Text>
                                    {(appt.status === 'confirmed' || appt.status === 'pending') && (
                                        <TouchableOpacity
                                            style={styles.startBtn}
                                            activeOpacity={0.8}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                navigation.navigate('AppointmentDetailScreen', { appointmentId: appt._id });
                                            }}
                                        >
                                            <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
                                            <Text style={styles.startBtnText}>View</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
    heading: { ...typography.h2, color: colors.textPrimary },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.xl, gap: spacing.xs },
    addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    calendarStrip: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    dateCard: { width: 52, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.md, marginHorizontal: spacing.xs, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    dateCardSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    dateCardToday: { borderColor: colors.primary, borderWidth: 1.5 },
    dayText: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
    dayTextSelected: { color: '#fff' },
    dateNum: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    dateNumSelected: { color: '#fff' },
    todayDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 4 },
    todayDotSelected: { backgroundColor: '#fff' },
    dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
    dateHeaderText: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    apptCount: { ...typography.bodySmall, color: colors.textSecondary },
    timeline: { flex: 1, paddingHorizontal: spacing.xl },
    timelineItem: { flexDirection: 'row', marginBottom: spacing.md },
    timelineLeft: { width: 70, alignItems: 'center', paddingTop: spacing.lg },
    timeText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
    timelineLine: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: spacing.sm },
    timelineCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, marginLeft: spacing.md, borderWidth: 1, borderColor: colors.border },
    timelineCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
    patientName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: '600' },
    consultType: { ...typography.caption, color: colors.textSecondary },
    startBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, alignSelf: 'flex-start', marginTop: spacing.sm, gap: spacing.xs },
    startBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl },
    emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
});

export default MyScheduleScreen;
