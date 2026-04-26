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
    Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import client from '../../api/client';
import { spacing, borderRadius, typography } from '../../config/theme';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { pickImage, takePhoto } from '../../utils/permissions';

const CATEGORIES = [
    { key: 'lab_report', label: 'Lab Report', icon: 'flask', color: '#3B82F6' },
    { key: 'prescription', label: 'Prescription', icon: 'pill', color: '#10B981' },
    { key: 'imaging', label: 'Imaging', icon: 'radioactive', color: '#8B5CF6' },
    { key: 'vaccination', label: 'Vaccination', icon: 'needle', color: '#F59E0B' },
    { key: 'discharge_summary', label: 'Discharge Summary', icon: 'hospital', color: '#EC4899' },
    { key: 'other', label: 'Other', icon: 'file-document', color: '#6B7280' },
];

const UploadRecordScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = makeStyles(colors);
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');
    const [doctor, setDoctor] = useState('');
    const [hospital, setHospital] = useState('');
    const [description, setDescription] = useState('');
    const [fileUri, setFileUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handlePickFromGallery = async () => {
        const uri = await pickImage();
        if (uri) setFileUri(uri);
    };

    const handleTakePhoto = async () => {
        const uri = await takePhoto();
        if (uri) setFileUri(uri);
    };

    const handleClearFile = () => setFileUri(null);

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Validation Error', 'Please enter a title for the record.');
            return;
        }
        if (!category) {
            Alert.alert('Validation Error', 'Please select a category.');
            return;
        }

        try {
            setLoading(true);
            // Use multipart so we can attach the optional file. React Native handles
            // FormData with the {uri, type, name} object shape — Axios will set the
            // multipart boundary automatically when the body is FormData.
            const form = new FormData();
            form.append('title', title.trim());
            form.append('category', category);
            if (description.trim()) form.append('description', description.trim());
            if (date.trim()) form.append('date', date.trim());
            if (doctor.trim()) form.append('doctor', doctor.trim());
            if (hospital.trim()) form.append('hospital', hospital.trim());
            if (fileUri) {
                const filename = fileUri.split('/').pop() || `record-${Date.now()}.jpg`;
                const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
                const mime = ext === 'pdf' ? 'application/pdf' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
                form.append('file', {
                    uri: fileUri,
                    name: filename,
                    type: mime,
                } as any);
            }

            await client.post('/health-records', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                transformRequest: (data) => data,
            });
            Alert.alert('Success', 'Health record saved successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to save record. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('patient.addHealthRecord')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Blood Test Report - January"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
                    <View style={styles.chipGrid}>
                        {CATEGORIES.map((cat) => {
                            const selected = category === cat.key;
                            return (
                                <TouchableOpacity
                                    key={cat.key}
                                    style={[styles.chip, selected && { backgroundColor: cat.color, borderColor: cat.color }]}
                                    onPress={() => setCategory(cat.key)}
                                    activeOpacity={0.7}
                                >
                                    <MaterialCommunityIcons
                                        name={cat.icon as any}
                                        size={16}
                                        color={selected ? '#fff' : cat.color}
                                    />
                                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{t('common.date')}</Text>
                    <TextInput
                        style={styles.input}
                        value={date}
                        onChangeText={setDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Doctor Name <Text style={styles.optional}>(optional)</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={doctor}
                        onChangeText={setDoctor}
                        placeholder="e.g. Dr. Perera"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Hospital / Clinic <Text style={styles.optional}>(optional)</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={hospital}
                        onChangeText={setHospital}
                        placeholder="e.g. Colombo General Hospital"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Description <Text style={styles.optional}>(optional)</Text></Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Add any notes or details about this record..."
                        placeholderTextColor={colors.textDisabled}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Attach File <Text style={styles.optional}>(optional, image up to 5 MB)</Text></Text>
                    {fileUri ? (
                        <View style={styles.previewBox}>
                            <Image source={{ uri: fileUri }} style={styles.previewImage} resizeMode="cover" />
                            <TouchableOpacity style={styles.previewClearBtn} onPress={handleClearFile} activeOpacity={0.7}>
                                <MaterialCommunityIcons name="close-circle" size={24} color={colors.error} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.pickerRow}>
                            <TouchableOpacity style={styles.pickerBtn} onPress={handleTakePhoto} activeOpacity={0.7}>
                                <MaterialCommunityIcons name="camera" size={22} color={colors.primary} />
                                <Text style={styles.pickerBtnText}>Camera</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.pickerBtn} onPress={handlePickFromGallery} activeOpacity={0.7}>
                                <MaterialCommunityIcons name="image-multiple" size={22} color={colors.primary} />
                                <Text style={styles.pickerBtnText}>Gallery</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                            <Text style={styles.submitBtnText}>{t('patient.saveRecord')}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
    fieldGroup: { marginBottom: spacing.xl },
    label: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
    required: { color: colors.error },
    optional: { color: colors.textSecondary, fontWeight: '400' },
    input: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        ...typography.body,
        color: colors.textPrimary,
    },
    textArea: { minHeight: 100, paddingTop: spacing.md },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
    },
    chipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
    chipTextSelected: { color: '#fff', fontWeight: '600' },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        gap: spacing.sm,
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    pickerRow: { flexDirection: 'row', gap: spacing.md },
    pickerBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.lg,
        gap: spacing.sm,
    },
    pickerBtnText: { ...typography.body, fontWeight: '600', color: colors.primary },
    previewBox: {
        position: 'relative',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    previewImage: { width: '100%', height: 180 },
    previewClearBtn: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
});

export default UploadRecordScreen;
