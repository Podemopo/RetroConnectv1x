// components/modals/ReportModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Portal } from 'react-native-portalize';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { supabase } from '../../supabase';

interface ReportModalProps {
    visible: boolean;
    onClose: () => void;
    listingId: number;
    reporterId: string;
    reporterUsername: string; 
}

const reportReasons = [
    "Offensive behavior",
    "Bad item",
    "Duplicate listing",
    "Misleading information",
    "Spam or scam",
    "Other"
];

export const ReportModal: React.FC<ReportModalProps> = ({ visible, onClose, listingId, reporterId, reporterUsername }) => {
    const { colors } = useTheme();
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const translateY = useSharedValue(300);
    const backdropOpacity = useSharedValue(0);

    const animatedModalStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(0, { damping: 18, stiffness: 150 });
            backdropOpacity.value = withTiming(1, { duration: 250 });
        } else {
            // Reset state on close
            translateY.value = withTiming(300, { duration: 250 });
            backdropOpacity.value = withTiming(0, { duration: 200 });
            setSelectedReason(null);
            setDetails('');
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!selectedReason) {
            Alert.alert("Please select a reason for the report.");
            return;
        }
        setIsSubmitting(true);
        const { error } = await supabase.from('reports').insert({
            listing_id: listingId,
            reporter_id: reporterId,
            reporter_username: reporterUsername, // UPDATED: Pass username to the database
            reason: selectedReason,
            details: details,
            report_type: 'listing_report' // UPDATED: Specify the report type
        });
        setIsSubmitting(false);
        if (error) {
            Alert.alert("Error", `Could not submit your report: ${error.message}`);
        } else {
            Alert.alert("Report Submitted", "Thank you for your feedback. We will review this listing shortly.");
            onClose();
        }
    };

    if (!visible) return null;

    return (
        <Portal>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingContainer}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, animatedBackdropStyle]} />
                    <Animated.View
                        style={[styles.modalView, { backgroundColor: colors.card }, animatedModalStyle]}
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: colors.text }]}>Report Listing</Text>
                            <TouchableOpacity onPress={onClose}>
                                <FontAwesome name="close" size={24} color={colors.text + '80'} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.subtitle, { color: colors.text + '99' }]}>
                            Please select a reason for reporting this listing.
                        </Text>
                        <View style={styles.reasonsContainer}>
                            {reportReasons.map(reason => (
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
                                    <Text style={{ color: selectedReason === reason ? colors.card : colors.text, fontWeight: selectedReason === reason ? 'bold' : 'normal' }}>
                                        {reason}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TextInput
                            style={[styles.detailsInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                            placeholder="Add more details (optional)"
                            placeholderTextColor={colors.text + '80'}
                            multiline
                            value={details}
                            onChangeText={setDetails}
                        />
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={[styles.button, { backgroundColor: colors.border }]} onPress={onClose}>
                                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: selectedReason ? colors.primary : colors.border }]}
                                onPress={handleSubmit}
                                disabled={isSubmitting || !selectedReason}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color={colors.card} />
                                ) : (
                                    <Text style={[styles.buttonText, { color: selectedReason ? colors.card : colors.text + '80' }]}>
                                        Submit Report
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </Pressable>
            </KeyboardAvoidingView>
        </Portal>
    );
};

const styles = StyleSheet.create({
    keyboardAvoidingContainer: {
        flex: 1,
    },
    backdrop: {
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 25,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        lineHeight: 24,
    },
    reasonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    reasonButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    detailsInput: {
        height: 100,
        borderWidth: 1,
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        textAlignVertical: 'top',
        marginTop: 20,
        marginBottom: 25,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
