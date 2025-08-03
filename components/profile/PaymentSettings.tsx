// Isabellalito/components/profile/PaymentSettings.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { useAuth } from '../context/AuthContext';
import { PickerModal, PickerOption } from '../modals/PickerModal';

interface PaymentAccount {
    id: string;
    type: 'GCash' | 'PayMaya';
    account_name: string;
    account_number: string;
    is_primary: boolean;
}

interface ValidationErrors {
    account_name?: string;
    account_number?: string;
    paypal_email?: string;
}

const PhilippineFlag = () => (
    <Text style={{fontSize: 24}}>🇵🇭</Text>
);

const PhoneNumberInput = ({ value, onChangeText, error, colors }: { value: string, onChangeText: (text: string) => void, error?: string, colors: any }) => (
    <View>
        <View style={[styles.phoneInputContainer, { backgroundColor: colors.background, borderColor: error ? '#e74c3c' : colors.border }]}>
            <View style={styles.phonePrefixContainer}>
                <PhilippineFlag />
                <Text style={[styles.phonePrefixText, { color: colors.text }]}>+63</Text>
            </View>
            <TextInput
                placeholder="9XX XXX XXXX"
                value={value}
                onChangeText={onChangeText}
                style={[styles.phoneInput, { color: colors.text }]}
                keyboardType="number-pad"
                maxLength={10}
                placeholderTextColor={colors.text + '80'}
            />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
);

const AddEditAccountModal = ({
    visible,
    onClose,
    onSave,
    isSaving,
    initialData
}: {
    visible: boolean;
    onClose: () => void;
    onSave: (account: PaymentAccount) => void;
    isSaving: boolean;
    initialData?: PaymentAccount | null;
}) => {
    const { colors } = useTheme();
    const [account, setAccount] = useState<PaymentAccount>(
        initialData || {
            id: `new_${Date.now()}`,
            type: 'GCash',
            account_name: '',
            account_number: '',
            is_primary: false,
        }
    );
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isPickerVisible, setPickerVisible] = useState(false);
    const accountTypeOptions: PickerOption[] = [
        { label: 'GCash', value: 'GCash' },
        { label: 'PayMaya', value: 'PayMaya' },
    ];

    useEffect(() => {
        if (visible) {
            let numberToEdit = initialData?.account_number || '';
            if (initialData?.type === 'GCash' && numberToEdit.startsWith('+63')) {
                numberToEdit = numberToEdit.substring(3);
            }
            setAccount(initialData ? { ...initialData, account_number: numberToEdit } : { id: `new_${Date.now()}`, type: 'GCash', account_name: '', account_number: '', is_primary: false });
            setErrors({});
        }
    }, [visible, initialData]);

    const handleTextChange = (field: keyof PaymentAccount, text: string) => {
        let filteredText = text;
        if (field === 'account_name') {
            filteredText = text.replace(/[^a-zA-Z\s]/g, '');
        } else if (field === 'account_number' && account.type === 'GCash') {
            filteredText = text.replace(/[^0-9]/g, '');
        }
        setAccount(p => ({ ...p, [field]: filteredText }));
    };

    const validateAndSave = () => {
        const newErrors: ValidationErrors = {};
        const { type, account_name, account_number } = account;

        if (!/^[a-zA-Z\s]+$/.test(account_name) || account_name.trim().length < 2) {
            newErrors.account_name = 'Please enter a valid name (letters and spaces only).';
        }

        if (type === 'GCash') {
            if (account_number.length !== 10) {
                newErrors.account_number = 'Mobile number must be 10 digits long.';
            } else if (account_number[0] !== '9') {
                newErrors.account_number = "Must be a valid PH mobile number (starts with '9').";
            }
        } else if (type === 'PayMaya') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(account_number)) {
                newErrors.account_number = 'Please enter a valid email address for PayMaya.';
            }
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            const finalAccount = { ...account };
            if (type === 'GCash') {
                finalAccount.account_number = `+63${account_number}`;
            }
            onSave(finalAccount);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
                <View style={[styles.modalFormContainer, { backgroundColor: colors.card }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{initialData ? 'Edit Account' : 'Add Account'}</Text>
                    
                    <TouchableOpacity style={[styles.input, {justifyContent: 'center', borderColor: colors.border}]} onPress={() => setPickerVisible(true)}>
                        <Text style={{color: colors.text}}>{account.type}</Text>
                    </TouchableOpacity>

                    <TextInput
                        placeholder="Account Name"
                        value={account.account_name}
                        onChangeText={(text) => handleTextChange('account_name', text)}
                        style={[styles.input, { color: colors.text, borderColor: errors.account_name ? '#e74c3c' : colors.border }]}
                        placeholderTextColor={colors.text + '80'}
                    />
                    {errors.account_name && <Text style={styles.errorText}>{errors.account_name}</Text>}
                    
                    {account.type === 'GCash' ? (
                        <PhoneNumberInput 
                            value={account.account_number}
                            onChangeText={(text) => handleTextChange('account_number', text)}
                            error={errors.account_number}
                            colors={colors}
                        />
                    ) : (
                        <>
                            <TextInput
                                placeholder="PayMaya Email Address"
                                value={account.account_number}
                                onChangeText={(text) => handleTextChange('account_number', text)}
                                style={[styles.input, { color: colors.text, borderColor: errors.account_number ? '#e74c3c' : colors.border }]}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor={colors.text + '80'}
                            />
                            {errors.account_number && <Text style={styles.errorText}>{errors.account_number}</Text>}
                        </>
                    )}

                    <View style={styles.primaryToggleRow}>
                        <Text style={[styles.primaryLabel, {color: colors.text}]}>Set as Primary Account</Text>
                        <Switch
                            value={account.is_primary}
                            onValueChange={(value) => setAccount(p => ({ ...p, is_primary: value }))}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={colors.card}
                        />
                    </View>
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={onClose}>
                            <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={validateAndSave} disabled={isSaving}>
                            {isSaving ? <ActivityIndicator color={colors.card} /> : <Text style={{ color: colors.card, fontWeight: 'bold' }}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
            <PickerModal
                visible={isPickerVisible}
                onClose={() => setPickerVisible(false)}
                title="Select Account Type"
                options={accountTypeOptions}
                selectedValue={account.type}
                onSelect={(value) => setAccount(p => ({ ...p, type: value as 'GCash' | 'PayMaya', account_number: '' }))}
            />
        </Modal>
    );
};

const AccountCard = ({ account, onEdit, onRemove }: { account: PaymentAccount, onEdit: () => void, onRemove: () => void }) => {
    const { colors } = useTheme();
    const isGCash = account.type === 'GCash';

    return (
        <View style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.cardIconContainer, { backgroundColor: isGCash ? '#0074D9' : '#049704' }]}>
                <FontAwesome name={isGCash ? 'bold' : 'leaf'} size={24} color="#FFF" />
            </View>
            <View style={styles.accountDetails}>
                <Text style={[styles.accountName, { color: colors.text }]}>{account.account_name}</Text>
                <Text style={[styles.accountNumber, { color: colors.text + '99' }]}>{account.account_number}</Text>
                {account.is_primary && (
                    <View style={[styles.primaryBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.primaryBadgeText, { color: colors.primary }]}>Primary</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity onPress={onEdit} style={styles.cardActionButton}><FontAwesome name="pencil" size={20} color={colors.text + '99'} /></TouchableOpacity>
                <TouchableOpacity onPress={onRemove} style={styles.cardActionButton}><FontAwesome name="trash-o" size={20} color={'#FF4136'} /></TouchableOpacity>
            </View>
        </View>
    );
};

export const PaymentSettings = ({ onClose }: { onClose: () => void }) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
    const [paypalEmail, setPaypalEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
    const [paypalError, setPaypalError] = useState<string | undefined>();

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            if (!user) return;
            setLoading(true);
            const [detailsResult, profileResult] = await Promise.all([
                supabase
                    .from('seller_payment_details')
                    .select('payment_methods')
                    .eq('user_id', user.id)
                    .single(),
                supabase
                    .from('profiles')
                    .select('paypal_email')
                    .eq('id', user.id)
                    .single()
            ]);
            
            if (detailsResult.data && detailsResult.data.payment_methods) {
                setAccounts(detailsResult.data.payment_methods);
            }
            if (profileResult.data && profileResult.data.paypal_email) {
                setPaypalEmail(profileResult.data.paypal_email);
            }
            setLoading(false);
        };
        fetchPaymentDetails();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (paypalEmail.trim().length > 0 && !emailRegex.test(paypalEmail)) {
            setPaypalError('Please enter a valid email address.');
            return;
        }
        setPaypalError(undefined);
        
        setSaving(true);

        const [detailsResult, profileResult] = await Promise.all([
            supabase.from('seller_payment_details').upsert({
                user_id: user.id,
                payment_methods: accounts,
            }, { onConflict: 'user_id' }),
            supabase.from('profiles').update({ 
                paypal_email: paypalEmail.trim() 
            }).eq('id', user.id)
        ]);

        if (detailsResult.error || profileResult.error) {
            console.error("Supabase error:", detailsResult.error || profileResult.error);
            Alert.alert('Error', 'Could not save payment details. ' + (detailsResult.error?.message || profileResult.error?.message));
        } else {
            Alert.alert('Success', 'Your payment settings have been saved.');
        }
        setSaving(false);
    };

    const handleAddOrUpdateAccount = (account: PaymentAccount) => {
        let updatedAccounts = [...accounts];
        if (account.is_primary) {
            updatedAccounts = updatedAccounts.map(acc => ({ ...acc, is_primary: false }));
        }

        const existingIndex = updatedAccounts.findIndex(a => a.id === account.id);
        if (existingIndex > -1) {
            updatedAccounts[existingIndex] = account;
        } else {
            updatedAccounts.push(account);
        }
        
        if (updatedAccounts.length > 0 && !updatedAccounts.some(a => a.is_primary)) {
            updatedAccounts[0].is_primary = true;
        }

        setAccounts(updatedAccounts);
        setModalVisible(false);
        setEditingAccount(null);
    };

    const handleRemoveAccount = (id: string) => {
        Alert.alert("Remove Account", "Are you sure you want to remove this payment account?", [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: () => {
                let updatedAccounts = accounts.filter(a => a.id !== id);
                if (updatedAccounts.length > 0 && !updatedAccounts.some(a => a.is_primary)) {
                    updatedAccounts[0].is_primary = true;
                }
                setAccounts(updatedAccounts);
            }}
        ]);
    };

    const openModal = (account: PaymentAccount | null = null) => {
        setEditingAccount(account);
        setModalVisible(true);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose}><FontAwesome name="arrow-left" size={20} color={colors.text} /></TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Payment Settings</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving || loading}>
                    {saving ? <ActivityIndicator color={colors.primary} /> : <Text style={{color: colors.primary, fontWeight: 'bold', fontSize: 16}}>Save</Text>}
                </TouchableOpacity>
            </View>

            {loading ? <ActivityIndicator style={{marginTop: 50}} size="large" color={colors.primary} /> : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    <Text style={[styles.sectionTitle, {color: colors.text}]}>PayPal Account</Text>
                    <Text style={[styles.listHeader, { color: colors.text + '99' }]}>
                        Enter your email to accept payments via PayPal to the platform's business account.
                    </Text>
                    <View style={[styles.paypalInputContainer, {borderColor: paypalError ? '#e74c3c' : colors.border}]}>
                       <FontAwesome name="paypal" size={22} color="#00457C" style={{marginRight: 10}}/>
                       <TextInput
                            placeholder="your.paypal.email@example.com"
                            value={paypalEmail}
                            onChangeText={setPaypalEmail}
                            style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0, color: colors.text }]}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor={colors.text + '80'}
                        />
                    </View>
                    {paypalError && <Text style={styles.errorText}>{paypalError}</Text>}

                    <View style={[styles.divider, {backgroundColor: colors.border}]} />

                    <Text style={[styles.sectionTitle, {color: colors.text}]}>Digital Wallets</Text>
                    <Text style={[styles.listHeader, { color: colors.text + '99' }]}>
                        Manage your GCash or PayMaya accounts for manual payment transfers.
                    </Text>
                    
                    {accounts.length > 0 && accounts.map(item => (
                        <AccountCard 
                            key={item.id}
                            account={item} 
                            onEdit={() => openModal(item)}
                            onRemove={() => handleRemoveAccount(item.id)}
                        />
                    ))}

                    {accounts.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <FontAwesome name="credit-card" size={48} color={colors.border} />
                            <Text style={[styles.emptyText, {color: colors.text + '99'}]}>No digital wallets added yet.</Text>
                        </View>
                    )}

                    <TouchableOpacity style={[styles.addButton, { borderColor: colors.primary }]} onPress={() => openModal()}>
                        <FontAwesome name="plus" size={16} color={colors.primary} />
                        <Text style={[styles.addButtonText, { color: colors.primary }]}>Add New Wallet</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
            
            <AddEditAccountModal 
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleAddOrUpdateAccount}
                isSaving={false}
                initialData={editingAccount}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    title: { fontSize: 22, fontWeight: 'bold' },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 8,
    },
    listContainer: {
        padding: 20,
    },
    listHeader: {
        fontSize: 15,
        marginBottom: 20,
        lineHeight: 22
    },
    accountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    cardIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    accountDetails: {
        flex: 1,
    },
    accountName: {
        fontSize: 17,
        fontWeight: '600',
    },
    accountNumber: {
        fontSize: 15,
        marginTop: 4,
    },
    primaryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 8,
    },
    primaryBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    cardActionButton: {
        padding: 8,
    },
    addButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        gap: 10,
        marginTop: 10,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 15,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500'
    },
    divider: {
        height: 1,
        marginVertical: 30,
    },
    paypalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 5,
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalFormContainer: {
        width: '90%',
        padding: 25,
        borderRadius: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 5,
    },
    phonePrefixContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10,
        marginRight: 10,
        borderRightWidth: 1,
        borderRightColor: '#ccc',
    },
    phonePrefixText: {
        fontSize: 16,
        marginLeft: 8,
    },
    phoneInput: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    primaryToggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
        marginTop: 10
    },
    primaryLabel: {
        fontSize: 16,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 13,
        marginBottom: 10,
        marginTop: -10,
        marginLeft: 5,
    }
});