// Isabellalito/components/modals/PaymentModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Portal } from 'react-native-portalize';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface PaymentAccount {
    id: string;
    type: 'GCash' | 'PayMaya' | 'PayPal';
    account_name: string;
    account_number: string;
    is_primary?: boolean;
}

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  paymentAccounts: PaymentAccount[];
  amount: number;
  itemName: string;
  onPaymentAttempt: (method: 'GCash' | 'PayMaya' | 'PayPal' | 'Other / Manual Transfer') => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  paymentAccounts,
  onPaymentAttempt,
}) => {
  const { colors } = useTheme();
  const backdropOpacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 250 });
      scale.value = withTiming(0.9, { duration: 250 });
    }
  }, [visible]);

  const handlePayment = async (account: PaymentAccount) => {
    onPaymentAttempt(account.type);
    onClose();
  };
  
  if (!visible) {
      return null;
  }

  return (
    <Portal>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
            <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <View style={styles.modalContainer} pointerEvents="box-none">
            <Animated.View style={[styles.modalContent, { backgroundColor: colors.card }, animatedModalStyle]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Payment Method</Text>
                
                {paymentAccounts.map(account => (
                <TouchableOpacity
                    key={account.id}
                    style={[
                        styles.paymentOption,
                        { 
                            backgroundColor: 
                                account.type === 'GCash' ? '#0074D9' :
                                account.type === 'PayMaya' ? '#049704' :
                                '#00457C' // Official PayPal Blue
                        }
                    ]}
                    onPress={() => handlePayment(account)}
                >
                    <FontAwesome 
                        name={account.type === 'PayPal' ? 'paypal' : account.type === 'PayMaya' ? 'leaf' : 'bold'} 
                        size={24} 
                        color="#fff" 
                    />
                    <Text style={styles.paymentOptionText}>{`Pay with ${account.type}`}</Text>
                </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={[styles.paymentOption, { backgroundColor: '#6c757d' }]}
                    onPress={() => onPaymentAttempt('Other / Manual Transfer')}
                >
                    <FontAwesome name="upload" size={20} color="#fff" />
                    <Text style={styles.paymentOptionText}>Other / Manual Transfer</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 350,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  paymentOptionText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 15,
  },
  cancelButton: {
    marginTop: 10,
    padding: 5,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'gray'
  },
});