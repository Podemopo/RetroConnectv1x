// sdaw/components/modals/MakeOfferModal.tsx
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

interface MakeOfferModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (offerAmount: number) => Promise<void>;
    itemName: string;
    listingPrice: number;
}

export const MakeOfferModal: React.FC<MakeOfferModalProps> = ({ visible, onClose, onSubmit, itemName, listingPrice }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [offerAmount, setOfferAmount] = useState('');
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
            // Animate in
            translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
            backdropOpacity.value = withTiming(1, { duration: 200 });
            // Reset state when modal opens
            setOfferAmount('');
            setIsSubmitting(false);
        } else {
            // Animate out
            translateY.value = withTiming(500, { duration: 250 });
            backdropOpacity.value = withTiming(0, { duration: 250 });
        }
    }, [visible]);

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
    }, [visible]);


    const handleSubmit = async () => {
        const amount = parseFloat(offerAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert("Invalid Offer", "Please enter a valid offer amount.");
            return;
        }
        setIsSubmitting(true);
        await onSubmit(amount);
        // The parent component will set visible to false, triggering the close animation.
        setIsSubmitting(false);
    };

    const suggestionPercentages = [0.9, 0.8, 0.7];

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
                        <Text style={[styles.title, { color: colors.text }]}>Make an Offer</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <FontAwesome name="close" size={24} color={colors.text + '80'} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtitle, { color: colors.text + '99' }]}>
                        You are making an offer for "{itemName}". The asking price is PHP {listingPrice.toLocaleString()}.
                    </Text>

                    <TextInput
                        style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                        placeholder="Your offer amount (PHP)"
                        placeholderTextColor={colors.text + '80'}
                        keyboardType="numeric"
                        value={offerAmount}
                        onChangeText={setOfferAmount}
                        editable={!isSubmitting}
                        autoFocus={true}
                    />

                    <View style={styles.suggestionContainer}>
                        {suggestionPercentages.map(pct => (
                            <TouchableOpacity
                                key={pct}
                                style={[styles.suggestionChip, { backgroundColor: colors.primary + '20' }]}
                                onPress={() => setOfferAmount(Math.round(listingPrice * pct).toString())}
                            >
                                <Text style={[styles.suggestionText, { color: colors.primary }]}>
                                    {Math.round(pct * 100)}%
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: offerAmount ? colors.primary : colors.border }]}
                        onPress={handleSubmit}
                        disabled={isSubmitting || !offerAmount}
                        activeOpacity={0.7}
                    >
                        {isSubmitting
                            ? <ActivityIndicator size="small" color={colors.card} />
                            : <Text style={[styles.submitButtonText, { color: offerAmount ? colors.card : colors.text + '80' }]}>Submit Offer</Text>
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
    closeButton: {
        padding: 5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'left',
        marginBottom: 20,
        lineHeight: 24,
    },
    textInput: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 15,
    },
    suggestionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 25,
    },
    suggestionChip: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    suggestionText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    submitButton: {
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