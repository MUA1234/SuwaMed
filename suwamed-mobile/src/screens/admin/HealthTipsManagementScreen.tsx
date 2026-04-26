import React, { useState, useCallback } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, FlatList,
    TouchableOpacity, ActivityIndicator, RefreshControl,
    Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
    getAllHealthTipsAdmin,
    createHealthTip,
    updateHealthTip,
    deleteHealthTip,
} from '../../api/healthTip.api';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
    'nutrition', 'exercise', 'mental_health', 'disease_prevention',
    'first_aid', 'maternal_health', 'child_health', 'elderly_care',
];

const CATEGORY_LABELS: Record<string, string> = {
    nutrition: 'Nutrition', exercise: 'Exercise', mental_health: 'Mental Health',
    disease_prevention: 'Prevention', first_aid: 'First Aid',
    maternal_health: 'Maternal', child_health: 'Child Health', elderly_care: 'Elderly Care',
};

const HealthTipsManagementScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tips, setTips] = useState<any[]>([]);
    const [modal, setModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('nutrition');
    const [isPublished, setIsPublished] = useState(true);

    const fetchTips = async () => {
        try {
            const res = await getAllHealthTipsAdmin();
            setTips(res.data || []);
        } catch (err) {
            console.log('Health tips fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchTips(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchTips(); };

    const openModal = () => {
        setTitle(''); setContent(''); setCategory('nutrition'); setIsPublished(true);
        setModal(true);
    };

    const handleCreate = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Error', 'Title and content are required.'); return;
        }
        setSaving(true);
        try {
            await createHealthTip({ title: title.trim(), content: content.trim(), category, isPublished });
            setModal(false);
            fetchTips();
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to create health tip.');
        } finally { setSaving(false); }
    };

    const handleTogglePublish = async (tip: any) => {
        try {
            await updateHealthTip(tip._id, { isPublished: !tip.isPublished });
            setTips(prev => prev.map(t => t._id === tip._id ? { ...t, isPublished: !t.isPublished } : t));
        } catch (err) {
            Alert.alert('Error', 'Failed to update health tip.');
        }
    };

    const handleDelete = (tip: any) => {
        Alert.alert(
            'Delete Health Tip',
            `Are you sure you want to delete "${tip.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                            await deleteHealthTip(tip._id);
                            setTips(prev => prev.filter(t => t._id !== tip._id));
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete health tip.');
                        }
                    },
                },
            ]
        );
    };

    const renderTip = ({ item }: { item: any }) => (
        <View style={styles.tipCard}>
            <View style={styles.tipTop}>
                <View style={styles.tipMeta}>
                    <View style={[styles.catBadge, { backgroundColor: item.isPublished ? '#ECFDF5' : '#F5F3FF' }]}>
                        <Text style={[styles.catText, { color: item.isPublished ? '#10B981' : '#8B5CF6' }]}>
                            {CATEGORY_LABELS[item.category] || item.category}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: item.isPublished ? '#ECFDF5' : '#FEF3C7' }]}>
                        <MaterialCommunityIcons
                            name={item.isPublished ? 'eye' : 'eye-off'}
                            size={12}
                            color={item.isPublished ? '#10B981' : '#F59E0B'}
                        />
                        <Text style={[styles.statusText, { color: item.isPublished ? '#10B981' : '#F59E0B' }]}>
                            {item.isPublished ? 'Published' : 'Draft'}
                        </Text>
                    </View>
                </View>
                <View style={styles.tipActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleTogglePublish(item)}>
                        <MaterialCommunityIcons
                            name={item.isPublished ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={colors.primary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]} onPress={() => handleDelete(item)}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.tipTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.tipContent} numberOfLines={2}>{item.content}</Text>
            {item.viewCount !== undefined && (
                <View style={styles.tipFooter}>
                    <MaterialCommunityIcons name="eye-outline" size={13} color={colors.textDisabled} />
                    <Text style={styles.tipViews}>{item.viewCount} views</Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('patient.healthTips')}</Text>
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
                <Text style={styles.headerTitle}>{t('patient.healthTips')}</Text>
                <TouchableOpacity style={styles.addBtn} onPress={openModal}>
                    <MaterialCommunityIcons name="plus" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.statsBar}>
                <Text style={styles.statsText}>
                    {tips.length} tips · {tips.filter(t => t.isPublished).length} published · {tips.filter(t => !t.isPublished).length} drafts
                </Text>
            </View>

            <FlatList
                data={tips}
                keyExtractor={(item) => item._id}
                renderItem={renderTip}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="lightbulb-off-outline" size={48} color={colors.textDisabled} />
                        <Text style={styles.emptyText}>{t('admin.noHealthTipsYet')}</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={openModal}>
                            <Text style={styles.emptyBtnText}>{t('admin.createFirstTip')}</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Create Tip Modal */}
            <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('admin.newHealthTip')}</Text>
                            <TouchableOpacity onPress={() => setModal(false)}>
                                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.fieldLabel}>Title *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Enter a compelling title..."
                                placeholderTextColor={colors.textDisabled}
                                maxLength={120}
                            />

                            <Text style={styles.fieldLabel}>Content *</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={content}
                                onChangeText={setContent}
                                placeholder="Write the health tip content..."
                                placeholderTextColor={colors.textDisabled}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                maxLength={2000}
                            />

                            <Text style={styles.fieldLabel}>{t('common.category')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.catChip, category === cat && styles.catChipActive]}
                                        onPress={() => setCategory(cat)}
                                    >
                                        <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                                            {CATEGORY_LABELS[cat]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TouchableOpacity
                                style={styles.publishToggle}
                                onPress={() => setIsPublished(!isPublished)}
                            >
                                <View style={[styles.toggleIcon, { backgroundColor: isPublished ? '#ECFDF5' : '#F5F3FF' }]}>
                                    <MaterialCommunityIcons
                                        name={isPublished ? 'eye' : 'eye-off'}
                                        size={18}
                                        color={isPublished ? '#10B981' : '#8B5CF6'}
                                    />
                                </View>
                                <Text style={styles.publishLabel}>
                                    {isPublished ? 'Publish immediately' : 'Save as draft'}
                                </Text>
                                <MaterialCommunityIcons
                                    name={isPublished ? 'toggle-switch' : 'toggle-switch-off'}
                                    size={28}
                                    color={isPublished ? colors.primary : colors.textDisabled}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={saving}>
                                {saving
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.createBtnText}>Create Health Tip</Text>
                                }
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    addBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    statsBar: {
        backgroundColor: colors.primary + '10',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    statsText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
    list: { padding: spacing.xl, paddingBottom: 100, gap: spacing.md },
    tipCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tipTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    tipMeta: { flexDirection: 'row', gap: spacing.sm },
    catBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.xl },
    catText: { fontSize: 11, fontWeight: '600' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.xl },
    statusText: { fontSize: 11, fontWeight: '600' },
    tipActions: { flexDirection: 'row', gap: spacing.sm },
    actionBtn: {
        width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.primary + '12',
    },
    tipTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
    tipContent: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 18 },
    tipFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
    tipViews: { ...typography.caption, color: colors.textDisabled },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
    emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.lg },
    emptyBtnText: { ...typography.button, color: '#fff', textTransform: 'none' as any },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: spacing.xl,
        maxHeight: '90%',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    modalTitle: { ...typography.h3, color: colors.textPrimary },
    fieldLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
    textInput: {
        backgroundColor: colors.background, borderRadius: borderRadius.md, borderWidth: 1,
        borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
        ...typography.body, color: colors.textPrimary,
    },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    catScroll: { marginBottom: spacing.md },
    catChip: {
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        borderRadius: borderRadius.xl, borderWidth: 1.5, borderColor: colors.border,
        backgroundColor: colors.surface, marginRight: spacing.sm,
    },
    catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catChipText: { ...typography.bodySmall, fontWeight: '600', color: colors.textSecondary },
    catChipTextActive: { color: '#fff' },
    publishToggle: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        backgroundColor: colors.background, borderRadius: borderRadius.md,
        padding: spacing.md, marginTop: spacing.md, marginBottom: spacing.lg,
        borderWidth: 1, borderColor: colors.border,
    },
    toggleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    publishLabel: { flex: 1, ...typography.body, fontWeight: '600', color: colors.textPrimary },
    createBtn: {
        backgroundColor: colors.primary, borderRadius: borderRadius.md,
        paddingVertical: spacing.lg, alignItems: 'center', marginBottom: spacing.xl,
    },
    createBtnText: { ...typography.button, color: '#fff', textTransform: 'none' as any },
});

export default HealthTipsManagementScreen;
