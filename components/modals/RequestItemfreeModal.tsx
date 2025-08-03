// sdaw/components/modals/RequestItemModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RequestItemModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (message: string) => Promise<void>;
    itemName: string;
}

export const RequestItemModal: React.FC<RequestItemModalProps> = ({ visible, onClose, onSubmit, itemName }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Animation values
    const translateY = useSharedValue(500);
    const backdropOpacity = useSharedValue(0);

    // Animation styles
    const animatedModalStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));
    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    // Animation and Visibility Logic
    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
            backdropOpacity.value = withTiming(1, { duration: 200 });
            // Reset state when modal opens
            setMessage('');
            setIsSubmitting(false);
        } else {
            translateY.value = withTiming(500, { duration: 250 });
            backdropOpacity.value = withTiming(0, { duration: 250 });
        }
    }, [visible, translateY, backdropOpacity]);

    // Android Back Button Handling
    useEffect(() => {
        const backAction = () => {
            if (visible) {
                onClose();
                return true;
            }
            return false;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [visible, onClose]);


    const handleSubmit = async () => {
        if (!message.trim()) {
            Alert.alert("Empty Message", "Please write a short message to the owner!");
            return;
        }
        setIsSubmitting(true);
        await onSubmit(message);
        setIsSubmitting(false);
    };

    if (!visible) {
        return null;
    }

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
                <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
            </Animated.View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingContainer}
            >
                <Animated.View style={[styles.modalView, { backgroundColor: colors.card, paddingBottom: insets.bottom + 10 }, animatedModalStyle]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Request This Item</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <FontAwesome name="close" size={24} color={colors.text + '80'} />
                        </TouchableOpacity>
                    </View>
                    
                    <FontAwesome name="gift" size={48} color={colors.primary} style={styles.icon} />

                    <Text style={[styles.subtitle, { color: colors.text + '99' }]}>
                        You're requesting <Text style={{fontWeight: 'bold'}}>"{itemName}"</Text>! A friendly message can make all the difference.
                    </Text>

                    <TextInput
                        style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                        placeholder="Hi! I'd love to give this item a new home..."
                        placeholderTextColor={colors.text + '80'}
                        value={message}
                        onChangeText={setMessage}
                        editable={!isSubmitting}
                        multiline
                        autoFocus={true}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: message.trim() ? colors.primary : colors.border }]}
                        onPress={handleSubmit}
                        disabled={isSubmitting || !message.trim()}
                        activeOpacity={0.7}
                    >
                        {isSubmitting
                            ? <ActivityIndicator size="small" color={colors.card} />
                            : <Text style={[styles.submitButtonText, { color: message.trim() ? colors.card : colors.text + '80' }]}>Send Friendly Request</Text>
                        }
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    keyboardAvoidingContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalView: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
        alignItems: 'center', // Center items like the icon
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
        width: '100%',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
    },
    icon: {
        marginBottom: 15,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
        width: '100%',
    },
    textInput: {
        height: 100,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingTop: 15,
        fontSize: 16,
        textAlignVertical: 'top',
        marginBottom: 25,
        width: '100%',
    },
    submitButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        fontSize: 17,
        fontWeight: '600',
    },
});