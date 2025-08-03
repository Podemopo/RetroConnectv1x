// Isabellalito/components/modals/PayPalWebViewModal.tsx

import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Buffer } from "buffer";
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface PayPalWebViewModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  itemName: string;
  onPaymentSuccess: (orderId: string) => void;
}

const PAYPAL_CLIENT_ID = 'AdUajoSy72YpctpRy-KLdLL-g-9DM_AtOsjd-PpDqvj1GnWOM4IiBkVmbbA9SObSCO7xZuIghHwHbSmp';
const PAYPAL_SECRET = 'EJ6EyK4ztiVy2eHlD4xHC14IYG_Q9hfZoLumFD76H98IUsMkUs4A9VEqEVzn9caIFo3VoyBZg-iYGFBv';
const PAYPAL_API_BASE_URL = 'https://api-m.paypal.com'; // Production URL

export const PayPalWebViewModal: React.FC<PayPalWebViewModalProps> = ({
  visible,
  onClose,
  amount,
  itemName,
  onPaymentSuccess,
}) => {
  const { colors } = useTheme();
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const getAccessToken = async (): Promise<string> => {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || 'Failed to get access token');
    return data.access_token;
  };

  const createOrder = async () => {
    setIsLoading(true);
    try {
      const accessToken = await getAccessToken();
      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'PHP',
              value: amount.toFixed(2),
            },
            description: `Payment for: ${itemName}`,
          },
        ],
        application_context: {
          // --- FIX: Added amount as a query parameter ---
          return_url: `https://retroconnect.app/success?amount=${amount.toFixed(2)}`,
          cancel_url: 'https://retroconnect.app/cancel',
          brand_name: 'RetroConnect',
          shipping_preference: 'NO_SHIPPING',
        },
      };

      const response = await fetch(`${PAYPAL_API_BASE_URL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();
      if (response.ok && data.links) {
        const approvalLink = data.links.find((link: any) => link.rel === 'approve');
        if (approvalLink) {
          setApprovalUrl(approvalLink.href);
        }
      } else {
        console.error("PayPal API Error:", JSON.stringify(data, null, 2));
        throw new Error(data.message || 'Could not create PayPal order.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Could not initiate PayPal payment. ' + error.message);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    if (!url) return;

    if (url.includes('https://retroconnect.app/success') && !paymentSubmitted) {
      const urlParams = new URLSearchParams(new URL(url).search);
      const token = urlParams.get('token'); 
      if (token) {
        setPaymentSubmitted(true);
        onPaymentSuccess(token);
      }
    }

    if (url.includes('https://retroconnect.app/cancel')) {
      // Allow WebView to navigate to the cancel page
    }
  };

  React.useEffect(() => {
    if (visible) {
      setPaymentSubmitted(false);
      createOrder();
    } else {
      setApprovalUrl(null);
      setIsLoading(false);
    }
  }, [visible]);

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Complete Payment</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome name="times" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        {isLoading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.text }}>Connecting to PayPal...</Text>
          </View>
        )}
        {approvalUrl && !isLoading && (
          <WebView
            source={{ uri: approvalUrl }}
            onNavigationStateChange={handleNavigationStateChange}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    position: 'relative',
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
