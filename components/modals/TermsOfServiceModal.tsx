// /components/modals/TermsOfServiceModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TermsOfServiceModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Terms of Service</Text>
          <TouchableOpacity onPress={onClose}>
            <FontAwesome name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.lastUpdated, { color: colors.text + '99' }]}>Last Updated: July 31, 2025</Text>
          <Text style={[styles.bodyText, { color: colors.text }]}>
            Welcome to RetroConnect! By using our services, you agree to the following terms. These guidelines are designed to ensure RetroConnect remains a safe, fair, and trustworthy platform for everyone.
          </Text>

          {/* Section 1: Platform Integrity & Prohibited Activities */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Platform Integrity & Prohibited Activities</Text>
          <Text style={[styles.bodyText, { color: colors.text }]}>
            To maintain a secure and reliable platform, the following activities are strictly prohibited and may result in immediate account suspension:
          </Text>
          <View style={styles.listContainer}>
            <Text style={[styles.listItem, { color: colors.text }]}>• <Text style={styles.bold}>Fraud & Scams:</Text> Misrepresenting item conditions, engaging in fraudulent activities, or faking transactions.</Text>
            <Text style={[styles.listItem, { color: colors.text }]}>• <Text style={styles.bold}>False Information:</Text> Providing incorrect personal details or using deceptive advertising.</Text>
            <Text style={[styles.listItem, { color: colors.text }]}>• <Text style={styles.bold}>Prohibited Listings:</Text> Selling illegal, stolen, or dangerous items.</Text>
            <Text style={[styles.listItem, { color: colors.text }]}>• <Text style={styles.bold}>Spamming or Harassment:</Text> Abusive behavior, excessive messaging, or any form of harassment towards other users.</Text>
            <Text style={[styles.listItem, { color: colors.text }]}>• <Text style={styles.bold}>Circumventing the Platform:</Text> Attempting to avoid platform rules or fees by conducting transactions off the app.</Text>
            <Text style={[styles.listItem, { color: colors.text }]}>• <Text style={styles.bold}>Multiple Accounts:</Text> Creating additional accounts to manipulate features or bypass our policies.</Text>
            <Text style={[styles.listItem, { color: colors.text }]}>• <Text style={styles.bold}>Offensive or Infringing Content:</Text> Posting harmful or inappropriate content, or violating intellectual property rights.</Text>
          </View>

          {/* Section 2: Account Security */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Account Security</Text>
          <Text style={[styles.bodyText, { color: colors.text }]}>
            Your security is our top priority. We take the following measures to protect your account:
          </Text>
          <View style={styles.listContainer}>
            <Text style={[styles.listItem, { color: colors.text }]}>• If your account is compromised, we will immediately suspend it to protect your personal data and assets.</Text>
            <Text style={[styles.listItem, { color: colors.text }]}>• Suspicious activity, such as unusual login attempts or abnormal transactions, will automatically trigger a security review.</Text>
          </View>

          {/* Section 3: Policy Enforcement */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Policy Enforcement</Text>
          <Text style={[styles.bodyText, { color: colors.text }]}>
            We are committed to protecting our community by enforcing these terms consistently:
          </Text>
          <View style={styles.listContainer}>
            <Text style={[styles.listItem, { color: colors.text }]}>• Repeated policy violations, even if minor, may lead to account suspension.</Text>
            <Text style={[styles.listItem, { color: colors.text }]}>• Accounts with unresolved payment issues or consistently negative feedback will be subject to review.</Text>
            <Text style={[styles.listItem, { color: colors.text }]}>• Failure to deliver items, significant misrepresentation, or a pattern of user complaints may result in penalties, including permanent account termination.</Text>
          </View>

          <Text style={[styles.closingText, { color: colors.text, marginTop: 20 }]}>
            By continuing to use RetroConnect, you acknowledge and agree to these terms. If you do not agree, please discontinue your use of our platform.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1, // Crucial for enabling scrolling
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40, // Add extra padding at the bottom for better scroll feel
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700', // Made bolder for better hierarchy
    marginTop: 20,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10, // Added margin for spacing
  },
  listContainer: {
    paddingLeft: 20, // Increased indentation for lists
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 5,
  },
  bold: {
    fontWeight: '700',
  },
  closingText: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 20,
    marginBottom: 20, // Added margin for spacing
    fontStyle: 'italic',
    textAlign: 'center',
  },
});