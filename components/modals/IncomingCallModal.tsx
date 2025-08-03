// File: components/modals/IncomingCallModal.tsx
// components/modals/IncomingCallModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The interface MUST include the 'onClose' prop
interface IncomingCallModalProps {
    visible: boolean;
    onClose: () => void; // This line fixes the error
    onAccept: () => void;
    onDecline: () => void;
    callerName: string;
    callerAvatar: string;
    callType: 'video' | 'voice';
    connecting?: boolean;
}

const AvatarPlaceholder = ({ name }: { name: string }) => {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    return (
        <View style={[modalStyles.avatar, modalStyles.avatarPlaceholder]}>
            <Text style={modalStyles.avatarPlaceholderText}>{initial}</Text>
        </View>
    );
};

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
    visible,
    onClose,
    onAccept,
    onDecline,
    callerName,
    callerAvatar,
    callType,
    connecting = false
}) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const translateY = useSharedValue(500);
    const opacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
            opacity.value = withTiming(1, { duration: 300 });
        } else {
            translateY.value = withTiming(500, { duration: 300 });
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [visible, opacity, translateY]);

    if (!visible && opacity.value === 0) {
        return null;
    }

    return (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            animationType="none"
        >
            <Pressable style={modalStyles.backdrop} onPress={onClose}>
                <Animated.View style={[
                    modalStyles.modalContainer,
                    { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 },
                    animatedStyle
                ]}
                onStartShouldSetResponder={() => true}
                >
                    <View style={modalStyles.header}>
                        <Text style={[modalStyles.headerText, { color: colors.text }]}>Incoming {callType === 'video' ? 'Video' : 'Voice'} Call</Text>
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                            <FontAwesome name="times" size={24} color={colors.text + '80'} />
                        </TouchableOpacity>
                    </View>

                    <View style={modalStyles.callerInfo}>
                        {callerAvatar ? (
                            <Image source={{ uri: callerAvatar }} style={modalStyles.avatar} />
                        ) : (
                            <AvatarPlaceholder name={callerName} />
                        )}
                        <Text style={[modalStyles.callerName, { color: colors.text }]}>{callerName}</Text>
                        <Text style={[modalStyles.callType, { color: colors.text + '99' }]}>
                            {callType === 'video' ? 'Video Call' : 'Voice Call'}
                        </Text>
                    </View>

                    <View style={modalStyles.buttonContainer}>
                        <TouchableOpacity style={[modalStyles.button, modalStyles.declineButton]} onPress={onDecline} disabled={connecting}>
                            <FontAwesome name="phone" size={24} color="#FFF" style={modalStyles.declineIcon} />
                            <Text style={modalStyles.buttonText}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[modalStyles.button, modalStyles.acceptButton, { backgroundColor: colors.primary }]} onPress={onAccept} disabled={connecting}>
                            {connecting ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <>
                                    <FontAwesome name="phone" size={24} color="#FFF" />
                                    <Text style={modalStyles.buttonText}>Accept</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

const modalStyles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContainer: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
    },
    callerInfo: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
    },
    avatarPlaceholder: {
        backgroundColor: '#4A6572',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        color: '#FFF',
        fontSize: 50,
        fontWeight: 'bold',
    },
    callerName: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginHorizontal: 10,
    },
    callType: {
        fontSize: 18,
        marginTop: 5,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
        gap: 20,
    },
    button: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    declineButton: {
        backgroundColor: '#E74C3C',
    },
    declineIcon: {
        transform: [{ rotate: '135deg' }]
    },
    acceptButton: {
        // backgroundColor will be set dynamically based on theme.primary
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});