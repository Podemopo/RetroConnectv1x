// components/modals/TradesModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    LayoutAnimation,
    Linking,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Portal } from 'react-native-portalize';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from './ConfirmationModal';
import { PickerModal, PickerOption } from './PickerModal';

// --- TYPE DEFINITIONS ---
export type ListingInfo = { id: number; item_name: string; image_urls: string[] };
export type BarterStatus = 'pending' | 'accepted' | 'declined' | 'preparing' | 'on_the_way' | 'completed';
export type DeliveryMethod = 'Meet Up' | 'Online Delivery';
type ActiveTab = 'received' | 'sent';

export type BarterRequest = {
    id: number;
    status: BarterStatus;
    delivery_method: DeliveryMethod;
    requester_id: string;
    listing_owner_id: string;
    requester_confirmed_meetup: boolean;
    owner_confirmed_meetup: boolean;
    delivery_provider: string | null;
    tracking_link: string | null;
    offered_listing_ids: number[];
    requested_listing: ListingInfo;
    offered_listings: ListingInfo[];
    requester: { id: string; fullName: string; profilePhotoUrl: string; };
    listing_owner: { id: string; fullName: string; profilePhotoUrl: string; };
    created_at: string;
};

type ActionType = 'accept' | 'decline' | 'open_delivery_modal' | 'confirm_meetup' | 'mark_received' | 'go_to_chat';
type DeleteConfirmationState = { visible: boolean; requestId: number | null; };
type DeclineReasonState = { visible: boolean; request: BarterRequest | null; };
type DeliveryInfoModalState = { visible: boolean; request: BarterRequest | null; };

type TradesModalProps = {
  visible: boolean;
  onClose: () => void;
  initialTab?: ActiveTab;
};

// --- Helper Components ---
const SkeletonCard = () => {
    const { colors } = useTheme();
    return (
        <View style={[styles.offerCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.skeletonAvatar, { backgroundColor: colors.border }]} />
                <View style={styles.skeletonHeaderInfo}>
                    <View style={[styles.skeletonLine, { width: '50%', height: 16, backgroundColor: colors.border }]} />
                    <View style={[styles.skeletonLine, { width: '30%', height: 12, marginTop: 4, backgroundColor: colors.border }]} />
                </View>
            </View>
            <View style={styles.tradeItemsContainer}>
                <View style={[styles.tradeItemBox, { backgroundColor: colors.background }]} />
                <View style={[styles.tradeItemBox, { backgroundColor: colors.background }]} />
            </View>
        </View>
    );
};

const TradeItemDisplay = ({ item }: { item?: ListingInfo }) => {
    const { colors } = useTheme();
    const renderContent = () => {
        if (!item || !item.image_urls || item.image_urls.length === 0) {
            return (
                <>
                    <View style={[styles.tradeItemBox, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center'}]}>
                        <FontAwesome name="image" size={30} color={colors.border as string} />
                    </View>
                    <Text style={[styles.tradeItemName, { color: colors.textSecondary }]} numberOfLines={2}>
                        Item unavailable
                    </Text>
                </>
            );
        }
        return (
            <>
                <View style={[styles.tradeItemBox, { backgroundColor: colors.background }]}>
                    <Image source={{ uri: item.image_urls[0] }} style={styles.tradeItemImage} />
                </View>
                <Text style={[styles.tradeItemName, { color: colors.text }]} numberOfLines={2}>
                    {item.item_name}
                </Text>
            </>
        );
    }
    return <View style={styles.tradeItemWrapper}>{renderContent()}</View>
};

// --- BarterRequestCard Component ---
const BarterRequestCard = React.memo(({ request, type, currentUserId, onAction, onViewProfile, onRemove, onSimpleUpdate }: {
    request: BarterRequest, type: ActiveTab, currentUserId: string,
    onAction: (request: BarterRequest, action: ActionType) => void,
    onViewProfile: (userId: string) => void, onRemove: (requestId: number) => void,
    onSimpleUpdate: (request: BarterRequest, status: 'accepted' | 'declined') => void
}) => {
    const { colors } = useTheme();
    const otherUser = type === 'received' ? request.requester : request.listing_owner;

    const isRequester = currentUserId === request.requester_id;
    const isOwner = currentUserId === request.listing_owner_id;

    const DeliveryMethodDisplay = () => (
        <View style={styles.deliveryMethodDisplay}>
            <FontAwesome name={request.delivery_method === 'Meet Up' ? 'handshake-o' : 'truck'} size={16} color={colors.textSecondary as string} />
            <Text style={[styles.deliveryMethodText, { color: colors.textSecondary }]}>{request.delivery_method}</Text>
        </View>
    );

    const StatusInfo = ({ text, icon, color }: { text: string, icon: React.ComponentProps<typeof FontAwesome>['name'], color: string }) => (
        <View style={styles.statusInfoContainer}>
            <FontAwesome name={icon} size={16} color={color} />
            <Text style={[styles.finalStatusText, { color }]} numberOfLines={1}>{text}</Text>
        </View>
    );
    
    const StatusFooter = ({ text, icon, color }: { text: string, icon: React.ComponentProps<typeof FontAwesome>['name'], color: string }) => (
        <View style={styles.bottomInfoContainer}>
            <DeliveryMethodDisplay />
            <StatusInfo text={text} icon={icon} color={color} />
        </View>
    );

    const renderActionArea = () => {
        switch(request.status) {
            case 'pending':
                if (isOwner) {
                     return (
                        <View>
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={[styles.button, styles.rejectButton, {borderColor: colors.border}]} onPress={() => onSimpleUpdate(request, 'declined')}>
                                    <Text style={[styles.buttonText, {color: colors.text}]}>Decline</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.acceptButton, {backgroundColor: colors.primary}]} onPress={() => onSimpleUpdate(request, 'accepted')}>
                                    <FontAwesome name="check" size={14} color="#FFF" />
                                    <Text style={[styles.buttonText, {color: '#FFF'}]}>Accept</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.bottomInfoContainer, {marginTop: 10}]}>
                               <DeliveryMethodDisplay />
                            </View>
                        </View>
                    );
                }
                return <StatusFooter text="Offer is pending" icon="hourglass-start" color={colors.textSecondary as string} />;

            case 'accepted': // Only for Meet Up
                const iHaveConfirmed = isRequester ? request.requester_confirmed_meetup : request.owner_confirmed_meetup;
                return (
                    <View>
                        <View style={styles.actionRow}>
                             <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => onAction(request, 'go_to_chat')}>
                                <FontAwesome name="comments" size={14} color={colors.text} />
                                <Text style={[styles.buttonText, {color: colors.text}]}>Chat</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.button, { flex: 1, backgroundColor: iHaveConfirmed ? colors.border : colors.primary }]} 
                                onPress={() => onAction(request, 'confirm_meetup')}
                                disabled={iHaveConfirmed}
                            >
                                <FontAwesome name="handshake-o" size={14} color="#FFF" />
                                <Text style={[styles.buttonText, {color: '#FFF'}]}>{iHaveConfirmed ? 'Confirmed' : 'Complete'}</Text>
                            </TouchableOpacity>
                        </View>
                         <View style={[styles.bottomInfoContainer, {marginTop: 10}]}>
                            <DeliveryMethodDisplay />
                            <StatusInfo text={iHaveConfirmed ? "Waiting for other user" : "Confirm meet-up"} icon="hourglass-half" color={colors.textSecondary as string} />
                        </View>
                    </View>
                );

            case 'preparing': // Online Delivery
                if (isRequester) { // Assuming requester ships first
                    return (
                        <View>
                             <TouchableOpacity style={[styles.button, styles.acceptButton, {backgroundColor: colors.primary}]} onPress={() => onAction(request, 'open_delivery_modal')}>
                                <FontAwesome name="dropbox" size={14} color="#FFF" />
                                <Text style={[styles.buttonText, {color: '#FFF'}]}>Add Delivery Info</Text>
                            </TouchableOpacity>
                            <View style={[styles.bottomInfoContainer, {marginTop: 10}]}>
                                <DeliveryMethodDisplay />
                                <StatusInfo text="Preparing for delivery" icon="cogs" color={colors.textSecondary as string} />
                            </View>
                        </View>
                    );
                }
                return <StatusFooter text="Preparing for delivery" icon="cogs" color={colors.textSecondary as string} />;

            case 'on_the_way': // Online Delivery
                return (
                     <View>
                        <View style={styles.deliveryInfoBox}>
                            <Text style={styles.deliveryInfoLabel}>Provider:</Text>
                            <Text style={styles.deliveryInfoText}>{request.delivery_provider}</Text>
                        </View>
                        <View style={styles.deliveryInfoBox}>
                            <Text style={styles.deliveryInfoLabel}>Tracking:</Text>
                            <TouchableOpacity onPress={() => request.tracking_link && Linking.openURL(request.tracking_link)}>
                                <Text style={styles.deliveryInfoLink} numberOfLines={1}>{request.tracking_link}</Text>
                            </TouchableOpacity>
                        </View>
                        {isOwner && (
                             <TouchableOpacity style={[styles.button, styles.acceptButton, {backgroundColor: colors.primary, marginTop: 12}]} onPress={() => onAction(request, 'mark_received')}>
                                <FontAwesome name="check-circle" size={14} color="#FFF" />
                                <Text style={[styles.buttonText, {color: '#FFF'}]}>Mark as Received</Text>
                            </TouchableOpacity>
                        )}
                         <View style={[styles.bottomInfoContainer, {marginTop: 10}]}>
                            <DeliveryMethodDisplay />
                            <StatusInfo text="Item is on the way" icon="truck" color="#0074D9" />
                        </View>
                    </View>
                );

            case 'completed':
                return <StatusFooter text="Trade Completed" icon="star" color={colors.primary} />;
            case 'declined':
                return <StatusFooter text="Trade Declined" icon="times-circle" color="#FF4136" />;

            default:
                return null;
        }
    };
    
    const itemYouGive = type === 'received' ? request.requested_listing : request.offered_listings?.[0];
    const itemYouGet = type === 'received' ? request.offered_listings?.[0] : request.requested_listing;

    return (
        <View style={[styles.offerCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
                <TouchableOpacity onPress={() => onViewProfile(otherUser.id)} style={styles.userInfo}>
                    <Image source={{uri: otherUser.profilePhotoUrl || 'https://via.placeholder.com/40'}} style={styles.avatar} />
                    <View>
                        <Text style={[styles.userName, { color: colors.text }]}>{otherUser.fullName}</Text>
                        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{new Date(request.created_at).toLocaleString()}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onRemove(request.id)} style={styles.removeButton}>
                    <FontAwesome name="times" size={16} color={colors.textSecondary as string} />
                </TouchableOpacity>
            </View>

            <View style={styles.tradeItemsContainer}>
                <View style={styles.tradeItemGroup}>
                    <Text style={[styles.tradeLabel, {color: colors.textSecondary}]}>{type === 'sent' ? 'Your Offer' : 'Their Offer'}</Text>
                    <TradeItemDisplay item={itemYouGet} />
                </View>
                <FontAwesome name="exchange" size={20} color={colors.textSecondary as string} style={styles.exchangeIcon}/>
                <View style={styles.tradeItemGroup}>
                    <Text style={[styles.tradeLabel, {color: colors.textSecondary}]}>{type === 'sent' ? 'For Their' : 'For Your'}</Text>
                    <TradeItemDisplay item={itemYouGive} />
                </View>
            </View>
            {renderActionArea()}
        </View>
    );
});

const DeliveryInfoModal = ({ visible, onClose, onSubmit, colors }: {
    visible: boolean;
    onClose: () => void;
    onSubmit: (provider: string, link: string) => void;
    colors: any;
}) => {
    const [provider, setProvider] = useState('');
    const [link, setLink] = useState('');

    const handleSubmit = () => {
        if (provider.trim() && link.trim()) {
            onSubmit(provider, link);
        } else {
            Alert.alert("Missing Information", "Please provide both a delivery provider and a tracking link.");
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredModalView}>
                <View style={[styles.modalView, { backgroundColor: colors.card }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Enter Delivery Details</Text>
                    <TextInput
                        placeholder="Delivery Provider (e.g., Lalamove)"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        value={provider}
                        onChangeText={setProvider}
                    />
                    <TextInput
                        placeholder="Tracking Link"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        value={link}
                        onChangeText={setLink}
                        autoCapitalize="none"
                        keyboardType="url"
                    />
                    <View style={styles.modalButtonRow}>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: colors.border }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                         <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: colors.primary }]}
                            onPress={handleSubmit}
                        >
                            <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};


const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const TradesModal = ({ visible, onClose, initialTab = 'received' }: TradesModalProps) => {
    const { colors } = useTheme();
    const { session } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

    const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
    const [requests, setRequests] = useState<BarterRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [declineReasonState, setDeclineReasonState] = useState<DeclineReasonState>({ visible: false, request: null });
    const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({ visible: false, requestId: null });
    const [deliveryInfoModalState, setDeliveryInfoModalState] = useState<DeliveryInfoModalState>({ visible: false, request: null });

    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (visible) {
            setActiveTab(initialTab);
        }
    }, [initialTab, visible]);
    
    const fetchRequestsAndCounts = useCallback(async () => {
        if (!session?.user) return;
        setLoading(true);
        const selectQuery = `*, 
            requested_listing:listings!requested_listing_id(id, item_name, image_urls), 
            requester:users!requester_id(id, fullName, profilePhotoUrl), 
            listing_owner:users!listing_owner_id(id, fullName, profilePhotoUrl)`;
        const queryToRun = activeTab === 'received'
            ? supabase.from('BarterRequest').select(selectQuery).eq('listing_owner_id', session.user.id)
            : supabase.from('BarterRequest').select(selectQuery).eq('requester_id', session.user.id);
        const { data: baseRequests, error } = await queryToRun.order('created_at', {ascending: false});
        if (error) {
            console.error("Error fetching trades:", error);
            setRequests([]);
        } else if (baseRequests) {
            const allOfferedIds = new Set<number>(baseRequests.flatMap(req => req.offered_listing_ids));
            const { data: allOfferedListingsData } = await supabase.from('listings').select('id, item_name, image_urls').in('id', Array.from(allOfferedIds));
            const listingsMap = new Map<number, ListingInfo>(allOfferedListingsData?.map(l => [l.id, l]));
            const enrichedRequests = baseRequests.map(req => ({ ...req, offered_listings: req.offered_listing_ids.map((id: number) => listingsMap.get(id)).filter(Boolean) as ListingInfo[] }));
            setRequests(enrichedRequests as unknown as BarterRequest[]);
        } else {
            setRequests([]);
        }
        setLoading(false);
    }, [activeTab, session?.user]);

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(0, { damping: 15 });
            fetchRequestsAndCounts();
        } else {
            translateY.value = withSpring(SCREEN_HEIGHT);
        }
    }, [visible, activeTab, fetchRequestsAndCounts]);

    const updateRequestInState = (updatedRequest: Partial<BarterRequest> & { id: number }) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setRequests(currentRequests =>
            currentRequests.map(req =>
                req.id === updatedRequest.id ? { ...req, ...updatedRequest } : req
            )
        );
    };

    useEffect(() => {
        if (!visible || !session?.user) {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            return;
        }

        const handleRealtimeUpdate = (payload: any) => {
            const updatedRequestRaw = payload.new;
            const enrichedRequest = {
                ...requests.find(r => r.id === updatedRequestRaw.id),
                ...updatedRequestRaw
            };
            updateRequestInState(enrichedRequest);
        };

        const channel = supabase
            .channel(`trades_modal_${session.user.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'BarterRequest', filter: `or=(requester_id.eq.${session.user.id},listing_owner_id.eq.${session.user.id})`}, handleRealtimeUpdate)
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [visible, session?.user, requests]);

    const handleAction = async (request: BarterRequest, action: ActionType) => {
        const currentUserId = session!.user.id;
        const isRequester = request.requester_id === currentUserId;

        switch(action) {
            case 'open_delivery_modal':
                setDeliveryInfoModalState({ visible: true, request });
                break;
            
            case 'mark_received': {
                updateRequestInState({ id: request.id, status: 'completed' });
                const { error } = await supabase.from('BarterRequest').update({ status: 'completed' }).eq('id', request.id);
                if (error) Alert.alert("Error", "Could not update status.");
                // TODO: Add notification
                break;
            }

            case 'confirm_meetup': {
                const updatedConfirmations = isRequester 
                    ? { requester_confirmed_meetup: true } 
                    : { owner_confirmed_meetup: true };
                
                const isNowCompleted = (isRequester && request.owner_confirmed_meetup) || (!isRequester && request.requester_confirmed_meetup);
                const newStatus = isNowCompleted ? { status: 'completed' as BarterStatus } : {};

                updateRequestInState({ id: request.id, ...updatedConfirmations, ...newStatus });

                const { error } = await supabase.from('BarterRequest').update({ ...updatedConfirmations, ...newStatus }).eq('id', request.id);
                if (error) {
                    Alert.alert("Error", "Could not confirm meet-up.");
                } else if (isNowCompleted) {
                    // TODO: Add notification for completion
                } else {
                     const actorName = isRequester ? request.requester.fullName : request.listing_owner.fullName;
                     await supabase.from('notifications').insert({
                        user_id: isRequester ? request.listing_owner_id : request.requester_id,
                        actor_id: currentUserId,
                        type: 'trade_update',
                        message: `${actorName || 'A user'} confirmed the meet-up. Please confirm as well to complete the trade.`,
                        metadata: { itemImage: request.requested_listing.image_urls?.[0] }
                    });
                }
                break;
            }

            case 'go_to_chat': {
                const { data: conversationId } = await supabase.rpc(
                    "find_or_create_conversation",
                    { participants_to_find: [request.requester_id, request.listing_owner_id] }
                );
                if (conversationId) {
                    onClose();
                    router.push({
                        pathname: "/chat/[id]",
                        params: {
                            id: conversationId.toString(),
                            recipientName: isRequester ? request.listing_owner.fullName : request.requester.fullName,
                        },
                    });
                }
                break;
            }
        }
    };
    
    const handleSetOnTheWay = async (provider: string, link: string) => {
        const { request } = deliveryInfoModalState;
        if (!request) return;

        const originalState = {
            status: request.status,
            delivery_provider: request.delivery_provider,
            tracking_link: request.tracking_link,
        };

        const updatedData = {
            status: 'on_the_way' as BarterStatus,
            delivery_provider: provider,
            tracking_link: link,
        };

        setDeliveryInfoModalState({ visible: false, request: null });
        // Optimistic update
        updateRequestInState({ id: request.id, ...updatedData });
        
        const { error } = await supabase.from('BarterRequest').update(updatedData).eq('id', request.id);
        
        if (error) {
            console.error("Error updating delivery info:", error);
            // Revert the optimistic update on failure
            updateRequestInState({ id: request.id, ...originalState });
            Alert.alert("Error", `Could not update delivery info: ${error.message}`);
        } else {
            // On success, send notification
            await supabase.from('notifications').insert({
                user_id: request.listing_owner_id,
                actor_id: session!.user.id,
                type: 'trade_update',
                message: `Your trade item is on the way! Provider: ${provider}`,
                metadata: { itemImage: request.offered_listings[0]?.image_urls?.[0] }
            });
        }
    };

    const handleSimpleUpdate = async (request: BarterRequest, status: 'accepted' | 'declined') => {
        if (status === 'declined') {
            setDeclineReasonState({ visible: true, request });
        } else {
            const newStatus = request.delivery_method === 'Online Delivery' ? 'preparing' : 'accepted';
            updateRequestInState({ id: request.id, status: newStatus });
            const { error } = await supabase.from('BarterRequest').update({ status: newStatus }).eq('id', request.id);
            if (error) {
                Alert.alert('Error', 'Could not accept the offer.');
                updateRequestInState({ id: request.id, status: 'pending' }); // Revert
            } else {
                await supabase.from('notifications').insert({
                    user_id: request.requester_id,
                    actor_id: session!.user.id,
                    type: 'trade_update',
                    message: `Your trade for "${request.requested_listing.item_name}" was accepted! Delivery: ${request.delivery_method}.`,
                    metadata: { itemImage: request.requested_listing.image_urls?.[0] }
                });
            }
        }
    };

    const handleDeclineWithReason = async (reason: string) => {
        const { request } = declineReasonState;
        if (!request) return;
        
        setDeclineReasonState({ visible: false, request: null });
        updateRequestInState({ id: request.id, status: 'declined' });
        const { error } = await supabase.from('BarterRequest').update({ status: 'declined' }).eq('id', request.id);
        
        if (error) {
             updateRequestInState({ id: request.id, status: 'pending' }); // Revert
             Alert.alert('Error', 'Could not decline the offer.');
        } else {
            await supabase.from('notifications').insert({
                user_id: request.requester_id,
                actor_id: session!.user.id,
                type: 'trade_update',
                message: `Your trade for "${request.requested_listing.item_name}" was declined. Reason: ${reason}`,
                metadata: { itemImage: request.requested_listing.image_urls?.[0] }
            });
        }
    };

    const handleViewProfile = useCallback((userId: string) => {
        onClose();
        router.push({ pathname: '/user/[id]', params: { id: userId } });
    }, [onClose, router]);

    const handleRemoveRequest = useCallback((requestId: number) => {
        setDeleteConfirmation({ visible: true, requestId: requestId });
    }, []);

    const handleConfirmDelete = async () => {
        const { requestId } = deleteConfirmation;
        if (!requestId) return;
        
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
        setDeleteConfirmation({ visible: false, requestId: null });

        const { error } = await supabase.rpc('delete_barter_request', { request_id: requestId });
        if (error) {
            Alert.alert("Error", "Could not delete the trade record.");
            fetchRequestsAndCounts(); // Refetch to restore
        }
    };
    
    const renderItem = useCallback(({ item }: { item: BarterRequest }) => (
        <BarterRequestCard
            request={item}
            type={activeTab}
            currentUserId={session!.user.id}
            onAction={handleAction}
            onSimpleUpdate={handleSimpleUpdate}
            onViewProfile={handleViewProfile}
            onRemove={handleRemoveRequest}
        />
    ), [activeTab, session, requests]);

    const Tab = ({ label, isActive, onPress }: {label: string, isActive: boolean, onPress: ()=>void}) => (
        <TouchableOpacity style={[styles.tab, isActive && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={onPress}>
            <Text style={[styles.tabText, {color: isActive ? colors.card : colors.text}]}>{label}</Text>
        </TouchableOpacity>
    );

    const declineReasons: PickerOption[] = [
        { label: "I'm not interested in the offer.", value: "Not interested" },
        { label: "My item is no longer available.", value: "Item unavailable" },
        { label: "I received a better offer.", value: "Better offer received" },
        { label: "Other", value: "Other" },
    ];
    
    if (!visible) return null;
    
    return (
        <Portal>
            <Animated.View style={[styles.modalContainer, animatedStyle]}>
                <View style={[styles.content, { backgroundColor: colors.background }]}>
                    <View style={{ paddingTop: insets.top, flex: 1 }}> 
                        <View style={styles.header}>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>TradeHub</Text>
                            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Manage your trade offers efficiently</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={[styles.closeButton, { top: insets.top + 10 }]} accessibilityLabel="Close trades modal"><FontAwesome name="close" size={24} color={colors.text} /></TouchableOpacity>

                        <View style={[styles.tabContainer, {borderColor: colors.border}]}>
                            <Tab label="Offers Received" isActive={activeTab === 'received'} onPress={() => setActiveTab('received')} />
                            <Tab label="My Offers" isActive={activeTab === 'sent'} onPress={() => setActiveTab('sent')} />
                        </View>

                        {loading ? (
                            <FlatList data={[1,2,3]} renderItem={() => <SkeletonCard />} keyExtractor={i => i.toString()} contentContainerStyle={styles.listContent}/>
                        ) : (
                            <FlatList
                                data={requests}
                                renderItem={renderItem} 
                                keyExtractor={item => item.id.toString()}
                                contentContainerStyle={styles.listContent}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <FontAwesome name="handshake-o" size={60} color={colors.border as string} />
                                        <Text style={[styles.emptyText, {color: colors.textSecondary as string}]}>
                                            {activeTab === 'received' ? 'No offers received yet.' : 'You have not sent any offers.'}
                                        </Text>
                                    </View>
                                }
                                extraData={requests}
                            />
                        )}
                    </View>
                </View>
                
                <PickerModal visible={declineReasonState.visible} onClose={() => setDeclineReasonState({ visible: false, request: null })} title="Reason for Declining" options={declineReasons} onSelect={handleDeclineWithReason} />
                <ConfirmationModal visible={deleteConfirmation.visible} onCancel={() => setDeleteConfirmation({ visible: false, requestId: null })} onConfirm={handleConfirmDelete} title="Delete Trade" message="Are you sure you want to permanently delete this trade record? This action cannot be undone." confirmText="Delete" />
                <DeliveryInfoModal
                    visible={deliveryInfoModalState.visible}
                    onClose={() => setDeliveryInfoModalState({ visible: false, request: null })}
                    onSubmit={handleSetOnTheWay}
                    colors={colors}
                />
            </Animated.View>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1000, elevation: 1000, },
    content: { flex: 1, },
    header: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20 },
    headerTitle: { fontFamily: 'Poppins-Bold', fontSize: 24 },
    headerSubtitle: { fontFamily: 'Poppins-Regular', fontSize: 16, marginTop: 4 },
    closeButton: { position: 'absolute', right: 20, padding: 5, zIndex: 1 },
    tabContainer: { flexDirection: 'row', marginHorizontal: 20, borderWidth: 1, borderRadius: 8, overflow: 'hidden', marginBottom: 20 },
    tab: { paddingVertical: 12, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
    tabText: { fontFamily: 'Poppins-SemiBold', fontSize: 16 },
    listContent: { paddingHorizontal: 20, paddingBottom: 50 },
    emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 20 },
    emptyText: { fontFamily: 'Poppins-SemiBold', fontSize: 17 },
    offerCard: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#EAEAEA', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 10, elevation: 5 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    userName: { fontFamily: 'Poppins-SemiBold', fontSize: 15 },
    timestamp: { fontFamily: 'Poppins-Regular', fontSize: 13 },
    removeButton: { padding: 5, },
    tradeItemsContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
    tradeItemGroup: { flex: 1, gap: 6 },
    tradeLabel: { fontFamily: 'Poppins-Regular', fontSize: 13, },
    tradeItemWrapper: { flex: 1, flexDirection: 'column', gap: 8 },
    tradeItemBox: { flex: 1, aspectRatio: 1, borderRadius: 8, overflow: 'hidden' },
    tradeItemImage: { width: '100%', height: '100%' },
    tradeItemName: { fontFamily: 'Poppins-SemiBold', fontSize: 14, textAlign: 'center' },
    exchangeIcon: { marginHorizontal: 5, alignSelf: 'center' },
    actionRow: { flexDirection: 'row', paddingTop: 16, borderTopWidth: 1, borderColor: '#f0f0f0', gap: 10 },
    button: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1.5, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
    buttonText: { fontFamily: 'Poppins-Bold', fontSize: 14 },
    rejectButton: { backgroundColor: 'transparent' },
    acceptButton: { borderColor: 'transparent' },
    finalStatusText: { fontFamily: 'Poppins-Bold', fontSize: 14, flexShrink: 1 },
    skeletonAvatar: { width: 40, height: 40, borderRadius: 20 },
    skeletonHeaderInfo: { flex: 1, marginLeft: 12, gap: 8 },
    skeletonLine: { borderRadius: 4 },
    bottomInfoContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderColor: '#f0f0f0' },
    deliveryMethodDisplay: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    deliveryMethodText: { fontFamily: 'Poppins-Regular', fontSize: 13 },
    statusInfoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
    deliveryInfoBox: { backgroundColor: '#f0f0f0', padding: 8, borderRadius: 6, marginBottom: 8 },
    deliveryInfoLabel: { fontFamily: 'Poppins-Regular', fontSize: 12, color: '#666' },
    deliveryInfoText: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#000' },
    deliveryInfoLink: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#0074D9', textDecorationLine: 'underline' },
    centeredModalView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { margin: 20, borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '90%' },
    modalTitle: { fontSize: 20, fontFamily: 'Poppins-Bold', marginBottom: 15 },
    input: { height: 50, width: '100%', borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
    modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
    modalButton: { flex: 1, borderRadius: 10, padding: 15, alignItems: 'center', marginHorizontal: 5 },
    modalButtonText: { fontFamily: 'Poppins-Bold', fontSize: 16 },
});
