// components/modals/UserReportModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Portal } from 'react-native-portalize';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { supabase } from '../../supabase';

interface UserReportModalProps {
    visible: boolean;
    onClose: () => void;
    reportedUserId: string;
    reporterId: string;
    reporterUsername: string; 
}

const reportReasons = [
    "Scamming or Fraud",
    "Harassment or Bullying",
    "Inappropriate Content",
    "Spam",
    "Impersonation",
    "Other"
];

export const UserReportModal: React.FC<UserReportModalProps> = ({ visible, onClose, reportedUserId, reporterId, reporterUsername }) => {
    const { colors } = useTheme();
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [screenshot, setScreenshot] = useState<string | null>(null);

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
            setTimeout(() => {
                setSelectedReason(null);
                setDetails('');
                setScreenshot(null);
            }, 300);
            translateY.value = withTiming(300, { duration: 250 });
            backdropOpacity.value = withTiming(0, { duration: 200 });
        }
    }, [visible]);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setScreenshot(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!selectedReason) {
            Alert.alert("Please select a reason for the report.");
            return;
        }
        setIsSubmitting(true);
        let screenshotUrl: string | null = null;

        if (screenshot) {
            try {
                const base64 = await FileSystem.readAsStringAsync(screenshot, { encoding: FileSystem.EncodingType.Base64 });
                const arrayBuffer = decode(base64);
                const fileExt = screenshot.split('.').pop()?.toLowerCase() ?? 'jpg';
                const filePath = `public/${reporterId}/${new Date().getTime()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('report')
                    .upload(filePath, arrayBuffer, { contentType: `image/${fileExt}` });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('report').getPublicUrl(filePath);
                screenshotUrl = data.publicUrl;

            } catch (error) {
                console.error("Screenshot upload error:", error);
                Alert.alert("Error", "Could not upload your screenshot. Please try again or submit without it.");
                setIsSubmitting(false);
                return;
            }
        }

        // UPDATED: Insert into the unified 'reports' table with correct fields
        const { error } = await supabase.from('reports').insert({
            reported_user_id: reportedUserId,
            reporter_id: reporterId,
            reporter_username: reporterUsername,
            reason: selectedReason,
            details: details,
            screenshot_url: screenshotUrl,
            report_type: 'user_report' // Specify the report type
        });

        setIsSubmitting(false);

        if (error) {
            Alert.alert("Error", `Could not submit your report: ${error.message}`);
        } else {
            Alert.alert("Report Submitted", "Thank you for your feedback. We will review this user's profile shortly.");
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
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.header}>
                                <Text style={[styles.title, { color: colors.text }]}>Report User</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <FontAwesome name="close" size={24} color={colors.text + '80'} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.subtitle, { color: colors.text + '99' }]}>
                                Your report is anonymous. Please select a reason.
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

                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Evidence (Optional)</Text>
                            {screenshot ? (
                                <View style={styles.imagePreviewContainer}>
                                    <Image source={{ uri: screenshot }} style={styles.imagePreview} />
                                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setScreenshot(null)}>
                                        <FontAwesome name="times-circle" size={28} color="#FFF" style={styles.removeImageIcon} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={[styles.uploadButton, { borderColor: colors.border }]} onPress={handlePickImage}>
                                    <FontAwesome name="camera" size={20} color={colors.text + '80'} />
                                    <Text style={[styles.uploadButtonText, { color: colors.text + '99' }]}>Upload Screenshot</Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={[styles.button, { backgroundColor: colors.border }]} onPress={onClose}>
                                    <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: selectedReason ? '#FF4136' : colors.border }]}
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
                        </ScrollView>
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
        maxHeight: '85%',
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
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 25,
        marginBottom: 10,
    },
    uploadButton: {
        height: 120,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    imagePreviewContainer: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 15,
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeImageIcon: {
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 30,
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
