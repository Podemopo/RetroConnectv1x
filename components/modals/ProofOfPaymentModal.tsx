// Isabellalito/components/modals/ProofOfPaymentModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../supabase';
import { useAuth } from '../context/AuthContext';

interface SellerAccountDetails {
    type: string;
    account_name: string;
    account_number: string;
}

// --- FIX STARTS HERE ---
interface ProofOfPaymentModalProps {
    visible: boolean;
    onClose: () => void;
    listingId: number;
    sellerId: string;
    amount: number;
    // Updated the type to include 'COD'
    paymentMethod: 'GCash' | 'PayMaya' | 'PayPal' | 'Other / Manual Transfer' | 'COD';
    onSubmissionSuccess: () => void;
    sellerAccountDetails: SellerAccountDetails | null;
}
// --- FIX ENDS HERE ---

export const ProofOfPaymentModal: React.FC<ProofOfPaymentModalProps> = ({
    visible,
    onClose,
    listingId,
    sellerId,
    amount,
    paymentMethod,
    onSubmissionSuccess,
    sellerAccountDetails,
}) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const isFormComplete = imageUri && referenceNumber.trim().length > 0;

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need permission to access your photos.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!user) {
            Alert.alert('Not logged in', 'You must be logged in to submit payment proof.');
            return;
        }
        if (!imageUri || !referenceNumber.trim()) {
            Alert.alert('Missing Proof', 'Please provide both a screenshot and a reference number.');
            return;
        }

        setIsSubmitting(true);
        let proofImageUrl: string | null = null;

        try {
            if (imageUri) {
                const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
                const filePath = `payment_proofs/${user.id}/${Date.now()}.jpg`;
                const { error: uploadError } = await supabase.storage
                    .from('itemimages')
                    .upload(filePath, decode(base64), { contentType: 'image/jpeg' });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('itemimages').getPublicUrl(filePath);
                proofImageUrl = data.publicUrl;
            }

            const { error: insertError } = await supabase.from('orders').insert({
                listing_id: listingId,
                buyer_id: user.id,
                seller_id: sellerId,
                amount: amount,
                payment_method: paymentMethod,
                proof_image_url: proofImageUrl,
                reference_number: referenceNumber.trim(),
                status: 'pending_confirmation',
            });

            if (insertError) throw insertError;

            Alert.alert('Success', 'Your payment proof has been sent to the seller.');
            onSubmissionSuccess();

        } catch (error: any) {
            console.error("Error submitting proof:", error);
            Alert.alert('Submission Error', error.message || 'Could not submit your proof.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Submit Payment Proof</Text>
                        
                        {sellerAccountDetails && (
                            <View style={[styles.detailsContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
                                <Text style={[styles.detailsTitle, {color: colors.text}]}>Payment Details:</Text>
                                <Text style={[styles.detailText, { color: colors.text }]}>
                                    <Text style={{fontWeight: 'bold'}}>Amount: </Text> PHP {amount.toLocaleString()}
                                </Text>
                                <Text style={[styles.detailText, { color: colors.text }]}>
                                    <Text style={{fontWeight: 'bold'}}>Recipient: </Text> {sellerAccountDetails.account_name}
                                </Text>
                                <Text style={[styles.detailText, { color: colors.text }]}>
                                    <Text style={{fontWeight: 'bold'}}>{sellerAccountDetails.type} Details: </Text> {sellerAccountDetails.account_number}
                                </Text>
                            </View>
                        )}

                        <Text style={styles.subtitle}>Upload a screenshot of your transaction and enter the reference number below.</Text>

                        <TouchableOpacity style={[styles.uploadBox, { borderColor: colors.border }]} onPress={pickImage}>
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                            ) : (
                                <>
                                    <FontAwesome name="upload" size={24} color={colors.primary} />
                                    <Text style={[styles.uploadText, { color: colors.primary }]}>Upload Screenshot*</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Enter reference number*"
                            value={referenceNumber}
                            onChangeText={setReferenceNumber}
                            placeholderTextColor={colors.text + '80'}
                        />
                        
                        <TouchableOpacity 
                            style={[styles.button, { backgroundColor: isFormComplete ? colors.primary : colors.border }]} 
                            onPress={handleSubmit} 
                            disabled={isSubmitting || !isFormComplete}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={[styles.buttonText, { color: isFormComplete ? colors.card : colors.text + '80' }]}>Submit Proof</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                             <Text style={{color: colors.text + '99'}}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: { width: '90%', padding: 25, borderRadius: 20, alignItems: 'center', marginVertical: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    subtitle: { fontSize: 15, color: 'gray', textAlign: 'center', marginBottom: 20, lineHeight: 21 },
    uploadBox: { 
        width: 120,
        height: 120,
        borderRadius: 12, 
        borderWidth: 2, 
        borderStyle: 'dashed', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 20, 
        overflow: 'hidden' 
    },
    previewImage: { width: '100%', height: '100%' },
    uploadText: { 
        marginTop: 10, 
        fontSize: 16, 
        fontWeight: '500',
        textAlign: 'center'
    },
    input: { width: '100%', height: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 20 },
    button: { width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    cancelButton: { marginTop: 15, padding: 5 },
    detailsContainer: {
        width: '100%',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 20,
    },
    detailsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    detailText: {
        fontSize: 15,
        lineHeight: 22,
    },
});