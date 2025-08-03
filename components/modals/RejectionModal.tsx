// Isabellalito/components/modals/RejectionModal.tsx
import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const rejectionReasons = [
    "Didn't receive the payment",
    "Incorrect payment reference",
    "Suspicious transaction",
    "Other"
];

interface RejectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
  isSubmitting: boolean;
}

export const RejectionModal: React.FC<RejectionModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting
}) => {
    const { colors } = useTheme();
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [details, setDetails] = useState('');

    const handleSubmit = () => {
        if (!selectedReason) return;
        onSubmit(selectedReason, details);
    };

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.backdrop}
            >
                <View style={[styles.modalView, { backgroundColor: colors.card }]}>
                    <Text style={[styles.title, { color: colors.text }]}>Reason for Rejection</Text>
                    <Text style={[styles.subtitle, { color: colors.text + '99' }]}>
                        Please select a reason. This will be shared with the buyer.
                    </Text>

                    {rejectionReasons.map(reason => (
                        <TouchableOpacity
                            key={reason}
                            style={[
                                styles.reasonButton,
                                {
                                    backgroundColor: selectedReason === reason ? colors.primary : colors.background,
                                    borderColor: selectedReason === reason ? colors.primary : colors.border,
                                }
                            ]}
                            onPress={() => setSelectedReason(reason)}
                        >
                            <Text style={{
                                color: selectedReason === reason ? colors.card : colors.text,
                                fontWeight: selectedReason === reason ? 'bold' : 'normal'
                            }}>
                                {reason}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    {selectedReason === 'Other' && (
                        <TextInput
                            style={[styles.detailsInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                            placeholder="Please provide more details..."
                            placeholderTextColor={colors.text + '80'}
                            multiline
                            value={details}
                            onChangeText={setDetails}
                        />
                    )}

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: colors.border }]} onPress={onClose} disabled={isSubmitting}>
                            <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: selectedReason ? colors.error : colors.border }]}
                            onPress={handleSubmit}
                            disabled={isSubmitting || !selectedReason}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color={colors.card} />
                            ) : (
                                <Text style={[styles.buttonText, { color: selectedReason ? colors.card : colors.text + '80' }]}>
                                    Reject Payment
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalView: { width: '90%', maxWidth: 400, borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
    title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
    reasonButton: {
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderRadius: 12,
        borderWidth: 1.5,
        marginBottom: 10,
        alignItems: 'center',
    },
    detailsInput: {
        height: 100,
        width: '100%',
        borderWidth: 1,
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        textAlignVertical: 'top',
        marginTop: 5,
        marginBottom: 20,
    },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, width: '100%' },
    button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    buttonText: { fontSize: 16, fontWeight: '600' },
});