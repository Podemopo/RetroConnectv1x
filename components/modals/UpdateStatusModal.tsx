// Isabellalito/components/modals/UpdateStatusModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- UPDATED OrderStatus type ---
export type OrderStatus = 'pending_confirmation' | 'paid' | 'preparing' | 'on_the_way' | 'delivered' | 'rejected' | 'pending_cod';

interface UpdateStatusModalProps {
  visible: boolean;
  onClose: () => void;
  currentStatus: OrderStatus;
  onUpdate: (newStatus: OrderStatus) => Promise<void>;
  isUpdating: boolean;
}

// --- UPDATED: Added 'pending_cod' to the flow ---
const statusFlow: OrderStatus[] = ['pending_cod', 'paid', 'preparing', 'on_the_way', 'delivered'];

const statusDetails = {
    pending_cod: { label: "Confirm Order", icon: "money" as const }, // --- NEW ---
    paid: { label: "Payment Confirmed", icon: "money" as const },
    preparing: { label: "Preparing Order", icon: "dropbox" as const },
    on_the_way: { label: "On the Way", icon: "truck" as const },
    delivered: { label: "Delivered", icon: "check-circle" as const },
};


export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({ visible, onClose, currentStatus, onUpdate, isUpdating }) => {
  const { colors } = useTheme();
  
  // --- UPDATED: Handle 'pending_cod' as the starting point ---
  let statusFlowToUse = statusFlow;
  if (currentStatus === 'paid' || currentStatus === 'pending_confirmation') {
    statusFlowToUse = ['paid', 'preparing', 'on_the_way', 'delivered'];
  } else if (currentStatus === 'pending_cod') {
     statusFlowToUse = ['pending_cod', 'preparing', 'on_the_way', 'delivered'];
  }

  const currentStatusIndex = statusFlowToUse.indexOf(currentStatus);

  const handleUpdate = (status: OrderStatus) => {
    onUpdate(status);
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalView, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Update Order Status</Text>
          <Text style={[styles.subtitle, { color: colors.text + '99' }]}>
            Notify the buyer about the order progress.
          </Text>

          <View style={styles.timelineContainer}>
            {statusFlowToUse.map((status, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isNextStep = index === currentStatusIndex + 1;
              const detail = statusDetails[status as keyof typeof statusDetails];

              if (!detail) return null;

              // --- CUSTOM LOGIC FOR 'pending_cod' ---
              let buttonText = `Mark as ${detail.label}`;
              if (status === 'pending_cod') buttonText = "Confirm COD Order";
              if (currentStatus === 'pending_cod' && status === 'preparing') buttonText = "Mark as Preparing";

              return (
                <View key={status} style={styles.timelineItem}>
                   <View style={styles.timelineConnectorContainer}>
                        {index > 0 && <View style={[styles.timelineConnector, { backgroundColor: isCompleted ? colors.primary : colors.border }]} />}
                    </View>
                  <View style={[styles.statusIconContainer, { backgroundColor: isCompleted ? colors.primary : colors.border }]}>
                    <FontAwesome name={detail.icon} size={20} color={isCompleted ? colors.card : colors.text + '80'} />
                  </View>
                  <View style={styles.statusTextContainer}>
                    <Text style={[styles.statusLabel, { color: isCompleted ? colors.text : colors.text + '80' }]}>
                      {detail.label}
                    </Text>
                    {isNextStep && (
                      <TouchableOpacity
                        style={[styles.updateButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleUpdate(status)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? <ActivityIndicator size="small" color={colors.card} /> : <Text style={styles.updateButtonText}>{buttonText}</Text>}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={[styles.closeButtonText, { color: colors.text + '99' }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalView: { width: '90%', maxWidth: 400, borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
    title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
    timelineContainer: { marginBottom: 20 },
    timelineItem: { flexDirection: 'row', alignItems: 'flex-start', },
    statusIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', zIndex: 1, },
    statusTextContainer: { marginLeft: 15, justifyContent: 'center', flex: 1, minHeight: 60 },
    statusLabel: { fontSize: 17, fontWeight: '600' },
    updateButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
    updateButtonText: { color: '#fff', fontWeight: 'bold' },
    closeButton: { marginTop: 15, padding: 5, alignSelf: 'center' },
    closeButtonText: { fontSize: 16, fontWeight: '500' },
    timelineConnectorContainer: { position: 'absolute', left: 21, top: 0, bottom: 0, alignItems: 'center' },
    timelineConnector: { width: 2, flex: 1, },
});