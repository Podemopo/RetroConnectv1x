// sdaw/components/modals/LoginPromptModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LoginPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ visible, onClose, onSignIn, onSignUp }) => {
  const { colors } = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.modalView, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
          <FontAwesome name="lock" size={40} color={colors.primary} style={styles.icon} />
          {/* --- TEXT UPDATED --- */}
          <Text style={[styles.title, { color: colors.text }]}>Unlock This Feature!</Text>
          <Text style={[styles.body, { color: colors.text + '99' }]}>
            To use this feature, please sign in or create an account. It only takes a few seconds to get started!
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={onSignIn}>
              <Text style={[styles.buttonText, { color: colors.card }]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { borderWidth: 1, borderColor: colors.primary }]} onPress={onSignUp}>
              <Text style={[styles.buttonText, { color: colors.primary }]}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.guestButton} onPress={onClose}>
                <Text style={[styles.guestButtonText, {color: colors.text + '99'}]}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  guestButton: {
      marginTop: 10,
      padding: 5,
  },
  guestButtonText: {
      fontSize: 14,
      textDecorationLine: 'underline',
  }
});