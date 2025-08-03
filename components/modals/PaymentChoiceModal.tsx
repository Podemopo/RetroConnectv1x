import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PaymentChoiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDigital: () => void;
  onSelectCOD: () => void;
}

export const PaymentChoiceModal: React.FC<PaymentChoiceModalProps> = ({
  visible,
  onClose,
  onSelectDigital,
  onSelectCOD,
}) => {
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
          <FontAwesome name="credit-card" size={40} color={colors.primary} style={styles.icon} />
          <Text style={[styles.title, { color: colors.text }]}>Choose Payment Method</Text>
          <Text style={[styles.body, { color: colors.text + '99' }]}>
            How would you like to pay for this item?
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={onSelectDigital}>
              <Text style={[styles.buttonText, { color: colors.card }]}>Digital Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { borderWidth: 1.5, borderColor: colors.primary }]} onPress={onSelectCOD}>
              <Text style={[styles.buttonText, { color: colors.primary }]}>Cash on Delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.guestButton} onPress={onClose}>
                <Text style={[styles.guestButtonText, {color: colors.text + '99'}]}>Cancel</Text>
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