// sdaw/components/chat/ActionCard.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Message } from '../../types/chat';

interface ActionCardProps {
    message: Message;
    currentUserId: string | null;
    onRespond: (message: Message, response: 'accepted' | 'declined') => Promise<void>;
}

export const ActionCard: React.FC<ActionCardProps> = ({ message, currentUserId, onRespond }) => {
    const { colors } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const metadata = message.metadata;

    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 40,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [scaleAnim, fadeAnim]);

    if (!metadata) return null;

    // --- THIS IS THE FIX ---
    // Determine the user's role and the action's current status.
    const role = message.sender_id === currentUserId ? 'sender' : 'recipient';
    const status = metadata.actionStatus || 'pending';

    const getCardTheme = () => {
        switch (metadata.actionType) {
            case 'offer':
                return {
                    title: role === 'sender' ? 'Offer Sent' : 'Offer Received',
                    icon: 'tag' as const,
                    color: '#27ae60',
                    lightColor: 'rgba(39, 174, 96, 0.1)',
                };
            case 'trade_proposal':
                return {
                    title: role === 'sender' ? 'Trade Proposal Sent' : 'Trade Proposal Received',
                    icon: 'exchange' as const,
                    color: '#e74c3c',
                    lightColor: 'rgba(231, 76, 60, 0.1)',
                };
            case 'item_request':
                return {
                    title: role === 'sender' ? 'Request Sent' : 'Item Request Received',
                    icon: 'hand-paper-o' as const,
                    color: '#8e44ad',
                    lightColor: 'rgba(142, 68, 173, 0.1)',
                };
            default:
                return {
                    title: 'Action Required',
                    icon: 'info-circle' as const,
                    color: colors.primary,
                    lightColor: `${colors.primary}20`,
                };
        }
    };

    const cardTheme = getCardTheme();
    
    const handleResponse = async (response: 'accepted' | 'declined') => {
        setIsLoading(true);
        await onRespond(message, response);
    };
    
    // Component for the Accept/Decline buttons, shown only to the recipient.
    const ActionButtons = () => (
        <View style={styles.actionRow}>
            <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleResponse('declined')}
                disabled={isLoading}
                activeOpacity={0.7}
            >
                <FontAwesome name="times" size={16} color="#c0392b" />
                <Text style={[styles.buttonText, { color: '#c0392b' }]}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: cardTheme.color }]}
                onPress={() => handleResponse('accepted')}
                disabled={isLoading}
                activeOpacity={0.7}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <>
                        <FontAwesome name="check" size={16} color="#FFFFFF" />
                        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Accept</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    // Component to display the current status of the action.
    const StatusBadge = () => {
        let theme;
        switch (status) {
            case 'accepted':
                theme = { color: '#27ae60', lightColor: 'rgba(39, 174, 96, 0.1)', icon: 'check-circle', text: 'Accepted' };
                break;
            case 'declined':
                theme = { color: '#c0392b', lightColor: 'rgba(192, 57, 43, 0.1)', icon: 'times-circle', text: 'Declined' };
                break;
            case 'pending':
            default: // Gracefully handle if status is missing or invalid.
                theme = { color: '#f39c12', lightColor: 'rgba(243, 156, 18, 0.1)', icon: 'hourglass-half', text: 'Pending' };
                break;
        }

        return (
            <View style={[styles.statusBadge, { backgroundColor: theme.lightColor }]}>
                <FontAwesome name={theme.icon as any} size={16} color={theme.color} />
                <Text style={[styles.statusBadgeText, { color: theme.color }]}>
                    {theme.text}
                </Text>
            </View>
        );
    };

    return (
        <Animated.View style={[
            styles.container,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}>
            <View style={[styles.card, { borderColor: `${cardTheme.color}40` }]}>
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: cardTheme.lightColor }]}>
                        <FontAwesome name={cardTheme.icon} size={20} color={cardTheme.color} />
                    </View>
                    <View>
                        <Text style={[styles.title, { color: colors.text }]}>{cardTheme.title}</Text>
                        <Text style={[styles.subtitle, { color: colors.text + '99' }]}>
                            Sent at {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: metadata.itemImage }} style={styles.itemImage} />
                        {metadata.actionType === 'offer' && (
                             <View style={[styles.priceBadge, { backgroundColor: cardTheme.color }]}>
                                 <Text style={styles.priceBadgeText}>
                                     ₱{metadata.offerAmount?.toLocaleString()}
                                 </Text>
                             </View>
                        )}
                    </View>
                    
                    <View style={styles.itemDetails}>
                        <Text 
                            style={[styles.itemName, { color: colors.text }]} 
                            numberOfLines={1}
                        >
                            {metadata.itemName}
                        </Text>
                        {metadata.itemPrice != null && (
                            <View style={styles.priceContainer}>
                                <Text style={[styles.priceLabel, { color: colors.text + '80' }]}>Market Value: </Text>
                                <Text style={[styles.itemPrice, { color: colors.text }]}>
                                    ₱{metadata.itemPrice.toLocaleString()}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                
                {metadata.message && (
                    <View style={styles.messageContainer}>
                        <Text style={[styles.messageText, { color: colors.text + 'B3' }]}>
                            "{metadata.message}"
                        </Text>
                    </View>
                )}

                <View style={styles.footer}>
                    {/* The main logic: Show buttons to the recipient if pending, otherwise show the status. */}
                    {role === 'recipient' && status === 'pending' ? <ActionButtons /> : <StatusBadge />}
                </View>
            </View>
        </Animated.View>
    );
};
// Styles remain the same
const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 340,
        alignSelf: 'center',
        paddingVertical: 8,
    },
    card: {
        width: '100%',
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 13,
        opacity: 0.8,
    },
    content: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
    },
    imageContainer: {
        position: 'relative',
    },
    itemImage: {
        width: 160,
        height: 160,
        borderRadius: 16,
        backgroundColor: '#F0F0F0',
    },
    itemDetails: {
        alignItems: 'center',
        gap: 4,
        width: '100%',
        paddingHorizontal: 8,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    priceLabel: {
        fontSize: 13,
        opacity: 0.7,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '500',
    },
    priceBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    priceBadgeText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    messageContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: '#00000010',
        marginHorizontal: 16,
        paddingTop: 16,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
        fontStyle: 'italic',
        opacity: 0.8,
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 44,
        borderRadius: 14,
        paddingHorizontal: 10,
    },
    declineButton: {
        backgroundColor: 'rgba(192, 57, 43, 0.1)',
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 14,
    },
    statusBadge: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
    },
    statusBadgeText: {
        fontWeight: '700',
        fontSize: 14,
    },
});