// /components/modals/SettingsModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Import the new TermsOfServiceModal component
import { TermsOfServiceModal } from '../../components/modals/TermsOfServiceModal';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  logoutLoading: boolean;
  onPaymentSettings: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose, onEditProfile, onLogout, logoutLoading, onPaymentSettings }) => {
  const { colors } = useTheme();
  const comingSoonAlert = () => Alert.alert('Coming Soon', 'This feature is not yet available.');
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false); // New state for Terms of Service modal

  const menuSections = [
    { title: 'Account', items: [
        { label: 'Edit Profile', icon: 'user', action: onEditProfile },
        { label: 'Payment Settings', icon: 'credit-card', action: onPaymentSettings },
    ]},
    { title: 'Help & Support', items: [
        { label: 'Support Inbox', icon: 'inbox', action: comingSoonAlert },
        { label: 'Help Center', icon: 'question-circle', action: comingSoonAlert },
        { label: 'Contact Us', icon: 'phone', action: comingSoonAlert },
    ]},
    { title: 'Settings & Privacy', items: [
        { label: 'Change Password', icon: 'lock', action: comingSoonAlert },
        { label: 'Notifications', icon: 'bell', action: comingSoonAlert },
        { label: 'Data and Privacy', icon: 'database', action: comingSoonAlert },
        // Update the action for 'About Retro Connect'
        { label: 'About Retro Connect', icon: 'info-circle', action: () => setIsTermsModalVisible(true) },
    ]},
  ];

  return (
    <>
      <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
        <View style={[styles.settingsModalView, { backgroundColor: colors.background }]}>
          <View style={[styles.settingsModalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingsModalTitle, { color: colors.text }]}>Settings</Text>
            <TouchableOpacity onPress={onClose} disabled={logoutLoading}>
              <FontAwesome name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.settingsScroll}>
            {menuSections.map((section, index) => (
              <View key={index} style={styles.settingsSection}>
                <Text style={[styles.settingsSectionHeader, { color: colors.text + '99' }]}>{section.title}</Text>
                <View style={[styles.settingsSectionBody, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {section.items.map((item, itemIndex) => (
                    <TouchableOpacity
                      key={item.label}
                      style={[styles.settingsRow, itemIndex > 0 ? { borderTopColor: colors.border, borderTopWidth: 1 } : {}]}
                      onPress={item.action}
                      disabled={logoutLoading}
                    >
                      <FontAwesome name={item.icon as any} size={20} color={colors.text} style={styles.settingsRowIcon} />
                      <Text style={[styles.settingsRowText, { color: colors.text }]}>{item.label}</Text>
                      <FontAwesome name="chevron-right" size={16} color={colors.text + '80'} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.modalLogoutButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={onLogout}
              disabled={logoutLoading}
            >
              {logoutLoading ? <ActivityIndicator size="small" color="#FF4136" /> : <Text style={[styles.modalLogoutButtonText, { color: '#FF4136' }]}>Log Out</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Render the new Terms of Service modal */}
      <TermsOfServiceModal
        visible={isTermsModalVisible}
        onClose={() => setIsTermsModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  settingsModalView: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  settingsModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
  settingsModalTitle: { fontSize: 20, fontWeight: '600' },
  settingsScroll: { padding: 16 },
  settingsSection: { marginBottom: 24 },
  settingsSectionHeader: { fontSize: 16, fontWeight: '600', opacity: 0.7, marginBottom: 8, paddingHorizontal: 8 },
  settingsSectionBody: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12 },
  settingsRowIcon: { width: 30, textAlign: 'center' },
  settingsRowText: { flex: 1, fontSize: 16, marginLeft: 10 },
  modalLogoutButton: { paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, marginTop: 8 },
  modalLogoutButtonText: { fontSize: 16, fontWeight: '600' },
});