import React, { useState, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as doctorApi from '../../api/doctor.api';
import * as paymentApi from '../../api/payment.api';
import { colors, spacing, borderRadius, typography } from '../../config/theme';
import { useTranslation } from 'react-i18next';

const WithdrawScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [doctorData, setDoctorData] = useState<any>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loading, setLoading] = useState(false);

    const [bankName, setBankName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');
    const [amount, setAmount] = useState('');

    const fetchProfile = async () => {
        try {
            const res = await doctorApi.getDoctorProfile();
            setDoctorData(res.data || res);
        } catch (err) {
            console.log('Profile fetch error:', err);
        } finally {
            setLoadingProfile(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchProfile(); }, []));

    const pendingWithdrawal = doctorData?.pendingWithdrawal || doctorData?.doctor?.pendingWithdrawal || 0;

    const handleSubmit = async () => {
        if (!bankName.trim() || !branchName.trim() || !accountNumber.trim() || !accountHolderName.trim() || !amount.trim()) {
            Alert.alert('Validation Error', 'Please fill in all fields.');
            return;
        }
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 500) {
            Alert.alert('Validation Error', 'Minimum withdrawal amount is LKR 500.');
            return;
        }
        if (numAmount > pendingWithdrawal) {
            Alert.alert('Validation Error', `Amount cannot exceed your available balance of LKR ${pendingWithdrawal.toLocaleString()}.`);
            return;
        }

        try {
            setLoading(true);
            await paymentApi.requestWithdrawal({
                bankName: bankName.trim(),
                branchName: branchName.trim(),
                accountNumber: accountNumber.trim(),
                accountHolderName: accountHolderName.trim(),
                amount: numAmount,
            });
            Alert.alert('Request Submitted', 'Your withdrawal request has been submitted. It will be processed within 2-3 business days.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to submit withdrawal request. Please try again.');
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
                <Text style={styles.headerTitle}>Withdraw Funds</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>{t('doctor.availableBalance')}</Text>
                    {loadingProfile ? (
                        <ActivityIndicator color="#fff" size="small" style={{ marginVertical: spacing.sm }} />
                    ) : (
                        <Text style={styles.balanceAmount}>LKR {pendingWithdrawal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    )}
                    <Text style={styles.balanceSubtitle}>{t('doctor.earningsForWithdrawal')}</Text>
                </View>

                <View style={styles.noticeCard}>
                    <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary} />
                    <Text style={styles.noticeText}>Minimum withdrawal: LKR 500. Processing time: 2-3 business days.</Text>
                </View>

                <Text style={styles.sectionTitle}>{t('doctor.bankDetails')}</Text>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Bank Name <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={bankName}
                        onChangeText={setBankName}
                        placeholder="e.g. Bank of Ceylon"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Branch Name <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={branchName}
                        onChangeText={setBranchName}
                        placeholder="e.g. Colombo Main Branch"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Account Number <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={accountNumber}
                        onChangeText={setAccountNumber}
                        placeholder="Enter account number"
                        placeholderTextColor={colors.textDisabled}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Account Holder Name <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={accountHolderName}
                        onChangeText={setAccountHolderName}
                        placeholder="Full name as on bank account"
                        placeholderTextColor={colors.textDisabled}
                    />
                </View>

                <Text style={styles.sectionTitle}>{t('doctor.withdrawalAmount')}</Text>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Amount to Withdraw <Text style={styles.required}>*</Text></Text>
                    <View style={styles.amountInputWrap}>
                        <Text style={styles.currencyPrefix}>LKR</Text>
                        <TextInput
                            style={styles.amountInput}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            placeholderTextColor={colors.textDisabled}
                            keyboardType="numeric"
                        />
                    </View>
                    <Text style={styles.amountHint}>Min: LKR 500 · Max: LKR {pendingWithdrawal.toLocaleString()}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, (loading || loadingProfile) && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading || loadingProfile}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="bank-transfer-out" size={20} color="#fff" />
                            <Text style={styles.submitBtnText}>{t('doctor.requestWithdrawal')}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
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
    balanceCard: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        padding: spacing.xxl,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    balanceLabel: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)' },
    balanceAmount: { fontSize: 32, fontWeight: '700', color: '#fff', marginVertical: spacing.sm },
    balanceSubtitle: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
    noticeCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#EBF5FF',
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginBottom: spacing.xl,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    noticeText: { ...typography.caption, color: colors.primary, flex: 1, lineHeight: 18 },
    sectionTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md, marginTop: spacing.sm },
    fieldGroup: { marginBottom: spacing.lg },
    label: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
    required: { color: colors.error },
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
    amountInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    currencyPrefix: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        ...typography.body,
        fontWeight: '600',
        color: colors.textSecondary,
        backgroundColor: '#F3F4F6',
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
    amountInput: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        ...typography.body,
        color: colors.textPrimary,
    },
    amountHint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.success,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        gap: spacing.sm,
        marginTop: spacing.md,
        marginBottom: spacing.xl,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default WithdrawScreen;
