// /components/modals/EditProfileModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OperationHours, UserProfile } from '../profile/AboutSection';
import { ConfirmationModal } from './ConfirmationModal';
import { EditFieldModal } from './EditFieldModal';
import { OperationHoursModal } from './OperationHoursModal';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  currentProfile: UserProfile | null;
  onSave: (updatedProfile: UserProfile) => void;
  savingProfile: boolean;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose, currentProfile, onSave, savingProfile }) => {
    const { colors } = useTheme();
    const [newProfile, setNewProfile] = useState<UserProfile | null>(currentProfile);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
    const [editFieldModalVisible, setEditFieldModalVisible] = useState(false);
    const [editFieldConfig, setEditFieldConfig] = useState<any>({});
    const [operationHoursModalVisible, setOperationHoursModalVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            setNewProfile(currentProfile);
            setHasUnsavedChanges(false);
        }
    }, [visible, currentProfile]);

    useEffect(() => {
        if (!visible || !currentProfile) return;
        const changesMade = JSON.stringify(newProfile) !== JSON.stringify(currentProfile);
        setHasUnsavedChanges(changesMade);
    }, [newProfile, currentProfile, visible]);

    const handleSaveProfile = () => {
        if(newProfile) {
            onSave(newProfile);
            setHasUnsavedChanges(false);
        }
    };
    const handleAttemptClose = () => { hasUnsavedChanges ? setConfirmationModalVisible(true) : onClose(); };
    const handleConfirmExit = () => { setConfirmationModalVisible(false); setTimeout(() => onClose(), 50); };

    const openEditFieldModal = (config: any) => { setEditFieldConfig(config); setEditFieldModalVisible(true); };
    const updateProfileField = (field: keyof UserProfile, value: any) => { setNewProfile(p => p ? {...p, [field]: value } : null) };

    const EditableInfoRow: React.FC<{ label: string; value: string; onPress: () => void; isFirst?: boolean }> = ({ label, value, onPress, isFirst }) => (
        <TouchableOpacity style={[editProfileStyles.infoRow, { borderTopColor: colors.border, borderTopWidth: isFirst ? 0 : StyleSheet.hairlineWidth }]} onPress={onPress} disabled={savingProfile} activeOpacity={0.7}>
            <View style={editProfileStyles.infoTextWrapper}>
                <Text style={[editProfileStyles.infoRowLabel, { color: colors.text + '99' }]}>{label}</Text>
                <Text style={[editProfileStyles.infoRowValue, { color: colors.text }]} numberOfLines={3}>{value || 'Not set'}</Text>
            </View>
            <FontAwesome name="chevron-right" size={18} color={colors.text + '80'} />
        </TouchableOpacity>
    );

    const SectionHeader: React.FC<{ title: string; subtitle?: string; }> = ({ title, subtitle }) => (
        <View style={editProfileStyles.sectionHeaderContainer}>
            <Text style={[editProfileStyles.sectionHeaderTitle, { color: colors.text }]}>{title}</Text>
            {subtitle && <Text style={[editProfileStyles.sectionHeaderSubtitle, { color: colors.text + '99' }]}>{subtitle}</Text>}
        </View>
    );

    if (!newProfile) return null;

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={handleAttemptClose}>
            <View style={[editProfileStyles.modalView, { backgroundColor: colors.background }]}>
                <View style={[editProfileStyles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={handleAttemptClose} disabled={savingProfile} style={editProfileStyles.headerButton}><FontAwesome name="close" size={24} color={colors.text} /></TouchableOpacity>
                    <Text style={[editProfileStyles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
                    <View style={editProfileStyles.headerButton} />
                </View>

                <ScrollView contentContainerStyle={editProfileStyles.scrollViewContent} showsVerticalScrollIndicator={false}>
                    <SectionHeader title="Public Information" subtitle="This will be displayed on your public profile." />
                    <View style={[editProfileStyles.infoGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <EditableInfoRow label="Full Name" value={newProfile.fullName} onPress={() => openEditFieldModal({ label: 'Full Name', initialValue: newProfile.fullName, onSave: (v:string) => updateProfileField('fullName', v)})} isFirst />
                        <EditableInfoRow label="Username" value={newProfile.username} onPress={() => openEditFieldModal({ label: 'Username', initialValue: newProfile.username, onSave: (v:string) => updateProfileField('username', v)})} />
                        <EditableInfoRow label="Bio" value={newProfile.bio || ''} onPress={() => openEditFieldModal({ label: 'Bio', initialValue: newProfile.bio, onSave: (v:string) => updateProfileField('bio', v), multiline: true, numberOfLines: 4})} />
                    </View>

                    <SectionHeader title="Business Details" subtitle="Information about your shop or business." />
                    <View style={[editProfileStyles.infoGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <EditableInfoRow label="City" value={newProfile.city || ''} onPress={() => openEditFieldModal({ label: 'City', initialValue: newProfile.city, onSave: (v:string) => updateProfileField('city', v)})} isFirst />
                        <EditableInfoRow label="Business Address" value={newProfile.business_address || ''} onPress={() => openEditFieldModal({ label: 'Business Address', initialValue: newProfile.business_address, onSave: (v:string) => updateProfileField('business_address', v), multiline: true, numberOfLines: 3})} />
                        <EditableInfoRow label="Operation Hours" value="Tap to set hours" onPress={() => setOperationHoursModalVisible(true)} />
                    </View>

                    <SectionHeader title="Private Details" subtitle="This information will not be shared publicly." />
                    <View style={[editProfileStyles.infoGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <EditableInfoRow label="Phone Number" value={newProfile.phone_number || ''} onPress={() => openEditFieldModal({ label: 'Phone Number', initialValue: newProfile.phone_number, onSave: (v:string) => updateProfileField('phone_number', v), keyboardType: 'phone-pad'})} isFirst/>
                        <EditableInfoRow label="Date of Birth" value={newProfile.date_of_birth || ''} onPress={() => openEditFieldModal({ label: 'Date of Birth', initialValue: newProfile.date_of_birth, onSave: (v:string) => updateProfileField('date_of_birth', v)})} />
                        <EditableInfoRow label="Gender" value={newProfile.gender || ''} onPress={() => openEditFieldModal({
                                label: 'Gender', isPicker: true, onPickerSelect: (v:string) => updateProfileField('gender', v),
                                pickerOptions: [{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }, { label: 'Other', value: 'Other' }, { label: 'Prefer not to say', value: 'Prefer not to say' }]
                            })}
                        />
                    </View>
                </ScrollView>

                <View style={[editProfileStyles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
                    <TouchableOpacity style={[editProfileStyles.saveButton, { backgroundColor: savingProfile || !hasUnsavedChanges ? colors.primary + '80' : colors.primary }]} onPress={handleSaveProfile} disabled={savingProfile || !hasUnsavedChanges}>
                        {savingProfile ? <ActivityIndicator size="small" color={colors.card} /> : <Text style={[editProfileStyles.saveButtonText, { color: colors.card }]}>Save Changes</Text>}
                    </TouchableOpacity>
                </View>
            </View>

            {/* --- THIS IS THE FIX --- */}
            {/* Conditionally render the modals so they don't crash the app on initial render */}
            {operationHoursModalVisible && <OperationHoursModal visible={operationHoursModalVisible} onClose={() => setOperationHoursModalVisible(false)} currentHours={newProfile.operation_hours || []} onSave={(v: OperationHours[]) => updateProfileField('operation_hours', v)} />}
            {editFieldModalVisible && <EditFieldModal visible={editFieldModalVisible} onClose={() => setEditFieldModalVisible(false)} {...editFieldConfig} />}
            {confirmationModalVisible && <ConfirmationModal visible={confirmationModalVisible} onConfirm={handleConfirmExit} onCancel={() => setConfirmationModalVisible(false)} title="Unsaved Changes" message="Are you sure you want to exit without saving changes?" confirmText="Yes, Exit" cancelText="No, Stay" />}
            {/* --- END OF FIX --- */}
        </Modal>
    );
};

const editProfileStyles = StyleSheet.create({
    modalView: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 50 : 15, paddingBottom: 15, paddingHorizontal: 10, borderBottomWidth: 1 },
    headerButton: { width: 40, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    scrollViewContent: { paddingVertical: 8 },
    sectionHeaderContainer: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 24 },
    sectionHeaderTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7 },
    sectionHeaderSubtitle: { fontSize: 14, marginTop: 6, opacity: 0.8 },
    infoGroup: { marginHorizontal: 16, borderRadius: 16, backgroundColor: 'transparent', overflow: 'hidden' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderTopWidth: StyleSheet.hairlineWidth },
    infoTextWrapper: { flex: 1, marginRight: 15 },
    infoRowLabel: { fontSize: 14, marginBottom: 6 },
    infoRowValue: { fontSize: 17, fontWeight: '500', lineHeight: 22 },
    footer: { padding: 15, paddingBottom: Platform.OS === 'ios' ? 34 : 15, borderTopWidth: StyleSheet.hairlineWidth },
    saveButton: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    saveButtonText: { fontSize: 17, fontWeight: '600' },
});