import React, { useState, useCallback } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, FlatList,
    TouchableOpacity, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as adminApi from '../../api/admin.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { colors as staticColors } from '../../config/theme';
import { useTranslation } from 'react-i18next';

const AVATAR_COLORS = [
    staticColors.primary,
    staticColors.secondary,
    staticColors.success,
    staticColors.warning,
    staticColors.primaryDark,
    staticColors.error,
];

const UsersListScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'patient' | 'doctor' | 'admin'>('all');

    const fetchUsers = async () => {
        try {
            const res = await adminApi.getUsers({ search: search || undefined });
            setUsers(res.data || []);
        } catch (err) {
            console.log('Users fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchUsers(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchUsers(); };

    const filteredUsers = users.filter(u => activeFilter === 'all' || u.role === activeFilter);

    const getInitials = (first: string, last: string) =>
        `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

    const roleColors: Record<string, string> = {
        patient: colors.primary, doctor: colors.success, admin: colors.secondary,
    };

    const renderUser = ({ item, index }: { item: any; index: number }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('UserDetailScreen', { userId: item._id, user: item })}
        >
            <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
                <Text style={styles.avatarText}>{getInitials(item.firstName, item.lastName)}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.contact}>{item.email || item.phone}</Text>
                <View style={styles.metaRow}>
                    <View style={[styles.roleBadge, { backgroundColor: (roleColors[item.role] || colors.textSecondary) + '20' }]}>
                        <Text style={[styles.roleText, { color: roleColors[item.role] || colors.textSecondary }]}>
                            {item.role}
                        </Text>
                    </View>
                    {item.isVerified && (
                        <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />
                    )}
                </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
        </TouchableOpacity>
    );

    const filters: Array<{ key: typeof activeFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'patient', label: 'Patients' },
        { key: 'doctor', label: 'Doctors' },
        { key: 'admin', label: 'Admins' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.heading}>{t('admin.users')}</Text>
                <Text style={styles.count}>{filteredUsers.length} total</Text>
            </View>

            <View style={styles.searchRow}>
                <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users..."
                    placeholderTextColor={colors.textDisabled}
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={fetchUsers}
                    returnKeyType="search"
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearch(''); fetchUsers(); }}>
                        <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.filterRow}>
                {filters.map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                        onPress={() => setActiveFilter(f.key)}
                    >
                        <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={filteredUsers}
                    renderItem={renderUser}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="account-off" size={48} color={colors.textDisabled} />
                            <Text style={styles.emptyText}>{t('admin.noUsersFound')}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
    heading: { ...typography.h2, color: colors.textPrimary },
    count: { ...typography.bodySmall, color: colors.textSecondary },
    searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, marginHorizontal: spacing.xl, marginBottom: spacing.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border },
    searchIcon: { marginRight: spacing.sm },
    searchInput: { flex: 1, paddingVertical: spacing.md, ...typography.body, color: colors.textPrimary },
    filterRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.md },
    filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { ...typography.caption, fontWeight: '500', color: colors.textSecondary },
    filterTextActive: { color: '#fff', fontWeight: '600' },
    list: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    info: { flex: 1 },
    name: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    contact: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
    roleBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10 },
    roleText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    empty: { alignItems: 'center', paddingVertical: spacing.xxxl * 2 },
    emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
});

export default UsersListScreen;
