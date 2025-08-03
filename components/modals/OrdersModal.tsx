// Isabellalito/components/modals/OrdersModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { RealtimeChannel } from '@supabase/supabase-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-portalize';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { useAuth } from '../context/AuthContext';
import { ProofOfPaymentModal } from './ProofOfPaymentModal';
import { RejectionModal } from './RejectionModal';

// --- TYPE DEFINITIONS ---
type AllOrderStatuses = 'pending_cod' | 'pending_confirmation' | 'paid' | 'preparing' | 'on_the_way' | 'delivered' | 'rejected' | 'pending' | 'accepted' | 'completed' | 'declined';

interface Order {
  id: number;
  listing: { id: number; item_name: string; image_urls: string[], price_type: string };
  buyer?: { id: string; fullName: string; };
  seller?: { id: string; fullName: string; };
  amount: number | null;
  status: AllOrderStatuses;
  created_at: string;
  payment_method: 'GCash' | 'PayMaya' | 'PayPal' | 'COD' | 'Other / Manual Transfer';
  proof_image_url?: string;
  reference_number?: string;
  rejection_reason?: string;
  request_message?: string;
  delivery_service?: string;
  tracking_link?: string;
}
interface OrdersModalProps { visible: boolean; onClose: () => void; }
type ActiveTab = 'buying' | 'selling' | 'free';

// --- STATUS DISPLAY PROPS ---
const statusDisplayProps: { [key in AllOrderStatuses]?: { label: string; color: string; icon: React.ComponentProps<typeof FontAwesome>['name'] } } = {
    pending_cod: { label: 'Pending COD', color: '#8884d8', icon: 'money' },
    pending_confirmation: { label: 'Pending Confirmation', color: '#f39c12', icon: 'hourglass-half' },
    paid: { label: 'To Prepare', color: '#2ecc71', icon: 'check-circle' },
    preparing: { label: 'Preparing', color: '#3498db', icon: 'dropbox' },
    on_the_way: { label: 'On the Way', color: '#9b59b6', icon: 'truck' },
    delivered: { label: 'Delivered', color: '#27ae60', icon: 'gift' },
    rejected: { label: 'Payment Rejected', color: '#e74c3c', icon: 'times-circle' },
    pending: { label: 'Pending Request', color: '#f39c12', icon: 'hourglass-start' },
    accepted: { label: 'Request Accepted', color: '#2ecc71', icon: 'check' },
    completed: { label: 'Completed', color: '#27ae60', icon: 'star' },
    declined: { label: 'Declined', color: '#e74c3c', icon: 'times-circle' },
};

// --- DeliveryDetailsModal COMPONENT ---
const DELIVERY_SERVICES = ['Lalamove', 'Grab', 'LBC', 'J&T Express', 'Toktok', 'Meetup / Self-Delivery', 'Other'];

const DeliveryDetailsModal = ({ visible, onClose, onSubmit }: { visible: boolean, onClose: () => void, onSubmit: (service: string, link: string) => void }) => {
    const { colors } = useTheme();
    const [selectedService, setSelectedService] = useState('');
    const [trackingLink, setTrackingLink] = useState('');

    const handleSubmit = () => {
        if (!selectedService) {
            Alert.alert('Selection Required', 'Please choose a delivery service.');
            return;
        }
        if (selectedService !== 'Meetup / Self-Delivery' && !trackingLink.trim()) {
            Alert.alert('Link Required', 'Please provide a tracking or driver link.');
            return;
        }
        onSubmit(selectedService, trackingLink.trim());
    };

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <View style={[styles.deliveryModalContainer, { backgroundColor: colors.card }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Enter Delivery Details</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Select a delivery service:</Text>
                    <View style={styles.serviceSelection}>
                        {DELIVERY_SERVICES.map(service => (
                            <TouchableOpacity
                                key={service}
                                style={[styles.serviceChip, { backgroundColor: selectedService === service ? colors.primary : colors.border, borderColor: colors.border }]}
                                onPress={() => setSelectedService(service)}
                            >
                                <Text style={[styles.serviceChipText, { color: selectedService === service ? colors.card : colors.text }]}>{service}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {selectedService !== 'Meetup / Self-Delivery' && (
                        <>
                            <Text style={[styles.modalSubtitle, { color: colors.textSecondary, marginTop: 16 }]}>Paste tracking/driver link:</Text>
                            <TextInput
                                style={[styles.linkInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                placeholder="e.g., https://lalamove.com/..."
                                placeholderTextColor={colors.textSecondary}
                                value={trackingLink}
                                onChangeText={setTrackingLink}
                            />
                        </>
                    )}
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={onClose}>
                            <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleSubmit}>
                            <Text style={[styles.buttonText, { color: colors.card }]}>Mark as On the Way</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};


// --- CARD COMPONENTS ---
const OrderCard = ({ order, viewType, onUpdateStatus, onOpenRejectionModal, onResubmitProof, onViewImage, onOpenDeliveryModal }: {
    order: Order, viewType: 'buying' | 'selling',
    onUpdateStatus: (orderId: number, newStatus: AllOrderStatuses, updateData?: object) => void,
    onOpenRejectionModal: (order: Order) => void,
    onResubmitProof: (order: Order) => void,
    onViewImage: (imageUrl: string) => void,
    onOpenDeliveryModal: (order: Order) => void,
}) => {
    const { colors } = useTheme();
    const otherParty = viewType === 'buying' ? order.seller : order.buyer;
    const displayStatus = statusDisplayProps[order.status] || { label: order.status.replace(/_/g, ' ').toUpperCase(), color: colors.text, icon: 'question-circle' };

    const handleAccept = () => {
        Alert.alert("Confirm Payment", "Are you sure you have received the payment?", [
            { text: "Cancel", style: "cancel" },
            { text: "Yes, I've Received It", onPress: () => onUpdateStatus(order.id, 'paid') }
        ]);
    };

    const handleOpenLink = async () => {
        if (!order.tracking_link) return;
        const canOpen = await Linking.canOpenURL(order.tracking_link);
        if (canOpen) {
            await Linking.openURL(order.tracking_link);
        } else {
            Alert.alert("Invalid Link", "Cannot open this URL.");
        }
    };

    const renderSellerActions = () => {
        switch (order.status) {
            case 'pending_confirmation':
                if (order.payment_method === 'PayPal') {
                    return (
                        <View style={[styles.proofSection, {borderColor: colors.border}]}>
                            <Text style={[styles.proofTitle, {color: colors.text}]}>PayPal Payment Received</Text>
                            <View style={styles.paypalInfoContainer}>
                                <FontAwesome name="paypal" size={20} color="#00457C" />
                                <Text style={[styles.refText, {color: colors.textSecondary, flex: 1, marginBottom: 0}]}>
                                    ID: {order.reference_number}
                                </Text>
                            </View>
                            <View style={styles.actionButtons}>
                                <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={() => onOpenRejectionModal(order)}><Text style={[styles.buttonText, {color: '#e74c3c'}]}>Reject</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={handleAccept}><Text style={[styles.buttonText, {color: '#27ae60'}]}>Accept</Text></TouchableOpacity>
                            </View>
                        </View>
                    );
                }
                return (
                    <View style={[styles.proofSection, {borderColor: colors.border}]}>
                        <Text style={[styles.proofTitle, {color: colors.text}]}>Proof of Payment</Text>
                        {order.proof_image_url &&
                            <Pressable onPress={() => onViewImage(order.proof_image_url!)}>
                                <Image source={{uri: order.proof_image_url}} style={styles.proofImage} />
                            </Pressable>
                        }
                        {order.reference_number && <Text style={[styles.refText, {color: colors.textSecondary}]}>Ref #: {order.reference_number}</Text>}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={() => onOpenRejectionModal(order)}><Text style={[styles.buttonText, {color: '#e74c3c'}]}>Reject</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={handleAccept}><Text style={[styles.buttonText, {color: '#27ae60'}]}>Accept</Text></TouchableOpacity>
                        </View>
                    </View>
                );
            case 'paid':
            case 'pending_cod':
                return (
                    <TouchableOpacity style={[styles.button, styles.shipButton, {backgroundColor: colors.primary}]} onPress={() => onUpdateStatus(order.id, 'preparing')}>
                         <FontAwesome name="dropbox" size={14} color={colors.card} />
                         <Text style={[styles.buttonText, {color: colors.card}]}>Prepare for Shipment</Text>
                    </TouchableOpacity>
                );
            case 'preparing':
                return (
                    <TouchableOpacity style={[styles.button, styles.shipButton, {backgroundColor: colors.primary}]} onPress={() => onOpenDeliveryModal(order)}>
                         <FontAwesome name="truck" size={14} color={colors.card} />
                         <Text style={[styles.buttonText, {color: colors.card}]}>Mark as On the Way</Text>
                    </TouchableOpacity>
                );
            case 'on_the_way':
                 return (
                    <TouchableOpacity style={[styles.button, styles.shipButton, {backgroundColor: colors.primary}]} onPress={() => onUpdateStatus(order.id, 'delivered')}>
                         <FontAwesome name="check-circle" size={14} color={colors.card} />
                         <Text style={[styles.buttonText, {color: colors.card}]}>Mark as Delivered</Text>
                    </TouchableOpacity>
                );
            default:
                return null;
        }
    };

    const renderBuyerInfo = () => {
        if (order.status === 'rejected') {
            return (
                <View style={[styles.proofSection, {borderColor: '#e74c3c' + '40'}]}>
                   <Text style={[styles.proofTitle, {color: '#e74c3c'}]}>Rejection Reason</Text>
                   <Text style={[styles.rejectionReasonText, {color: colors.textSecondary}]}>{order.rejection_reason || "No reason provided."}</Text>
                   <TouchableOpacity style={[styles.button, styles.resubmitButton, {backgroundColor: colors.primary}]} onPress={() => onResubmitProof(order)}>
                       <FontAwesome name="upload" size={14} color={colors.card} />
                       <Text style={[styles.buttonText, {color: colors.card}]}>Resubmit Proof</Text>
                   </TouchableOpacity>
               </View>
           );
        }
        if (order.status === 'on_the_way' && order.delivery_service) {
            return (
                <View style={[styles.deliveryInfoSection, { borderColor: colors.border }]}>
                    <Text style={[styles.proofTitle, { color: colors.text }]}>Delivery Information</Text>
                    <View style={styles.deliveryInfoRow}>
                        <Text style={[styles.deliveryLabel, { color: colors.textSecondary }]}>Service:</Text>
                        <Text style={[styles.deliveryValue, { color: colors.text }]}>{order.delivery_service}</Text>
                    </View>
                    {order.tracking_link && (
                        <View style={styles.deliveryInfoRow}>
                            <Text style={[styles.deliveryLabel, { color: colors.textSecondary }]}>Tracking:</Text>
                            <TouchableOpacity onPress={handleOpenLink}>
                                <Text style={[styles.deliveryLink, { color: colors.primary }]}>View Link</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            );
        }
        return null;
    };

    return (
        <View style={[styles.orderCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
                <Image source={{ uri: order.listing.image_urls[0] }} style={styles.itemImage} />
                <View style={styles.cardHeaderInfo}>
                    <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>{order.listing.item_name}</Text>
                    <Text style={[styles.partyName, {color: colors.textSecondary}]}>
                        {viewType === 'buying' ? 'From' : 'To'}: {otherParty?.fullName || 'Unknown User'}
                    </Text>
                </View>
                <Text style={[styles.amount, { color: colors.primary }]}>₱{order.amount}</Text>
            </View>
            <View style={[styles.statusContainer, { backgroundColor: (displayStatus?.color || '#888') + '15' }]}>
                <FontAwesome name={displayStatus?.icon || 'question-circle'} size={16} color={displayStatus?.color || '#888'} />
                <Text style={[styles.statusText, { color: displayStatus?.color || '#888' }]}>{displayStatus?.label || 'Unknown'}</Text>
            </View>

            {viewType === 'selling' ? renderSellerActions() : renderBuyerInfo()}
        </View>
    );
};

const FreeOrderCard = ({ order, viewType, onUpdateStatus, onOpenRejectionModal, onOpenDeliveryModal }: {
    order: Order,
    viewType: 'giving' | 'receiving',
    onUpdateStatus: (orderId: number, newStatus: AllOrderStatuses, updateData?: object) => void,
    onOpenRejectionModal: (order: Order) => void,
    onOpenDeliveryModal: (order: Order) => void,
}) => {
    const { colors } = useTheme();
    const otherParty = viewType === 'receiving' ? order.seller : order.buyer;
    const displayStatus = statusDisplayProps[order.status] || { label: order.status.replace(/_/g, ' ').toUpperCase(), color: colors.text, icon: 'question-circle' };

    const handleOpenLink = async () => {
        if (!order.tracking_link) return;
        const canOpen = await Linking.canOpenURL(order.tracking_link);
        if (canOpen) {
            await Linking.openURL(order.tracking_link);
        } else {
            Alert.alert("Invalid Link", "Cannot open this URL.");
        }
    };

    const renderGiverActions = () => {
        switch (order.status) {
            case 'pending':
                return (
                    <>
                        {order.request_message && (<View style={[styles.messageContainer, {borderColor: colors.border}]}><Text style={[styles.messageLabel, {color: colors.text}]}>Request Message:</Text><Text style={[styles.messageText, {color: colors.textSecondary}]}>"{order.request_message}"</Text></View>)}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={() => onOpenRejectionModal(order)}><Text style={[styles.buttonText, {color: '#e74c3c'}]}>Decline</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={() => onUpdateStatus(order.id, 'accepted')}><Text style={[styles.buttonText, {color: '#27ae60'}]}>Accept</Text></TouchableOpacity>
                        </View>
                    </>
                );
            case 'accepted':
                return (
                    <TouchableOpacity style={[styles.button, styles.shipButton, {backgroundColor: colors.primary}]} onPress={() => onUpdateStatus(order.id, 'preparing')}>
                        <FontAwesome name="dropbox" size={14} color={colors.card} />
                        <Text style={[styles.buttonText, {color: colors.card}]}>Prepare for Shipment</Text>
                    </TouchableOpacity>
                );
            case 'preparing':
                return (
                    <TouchableOpacity style={[styles.button, styles.shipButton, {backgroundColor: colors.primary}]} onPress={() => onOpenDeliveryModal(order)}>
                        <FontAwesome name="truck" size={14} color={colors.card} />
                        <Text style={[styles.buttonText, {color: colors.card}]}>Mark as On the Way</Text>
                    </TouchableOpacity>
                );
            case 'on_the_way':
                return <Text style={styles.infoText}>Waiting for receiver to confirm delivery.</Text>;
            case 'delivered':
                return (
                    <TouchableOpacity style={[styles.button, styles.shipButton, {backgroundColor: colors.primary}]} onPress={() => onUpdateStatus(order.id, 'completed')}>
                        <FontAwesome name="check" size={14} color={colors.card} />
                        <Text style={[styles.buttonText, {color: colors.card}]}>Mark as Completed</Text>
                    </TouchableOpacity>
                );
            default:
                return null;
        }
    };
    
    const renderReceiverActions = () => {
        switch (order.status) {
            case 'declined':
                return (
                    <View style={[styles.messageContainer, {borderColor: colors.border}]}>
                        <Text style={[styles.messageLabel, {color: colors.text}]}>Reason for Decline:</Text>
                        <Text style={[styles.messageText, {color: colors.textSecondary}]}>"{order.rejection_reason || 'No reason provided'}"</Text>
                    </View>
                );
            case 'on_the_way':
                return (
                    <View style={[styles.deliveryInfoSection, { borderColor: colors.border }]}>
                        <Text style={[styles.proofTitle, { color: colors.text }]}>Delivery Information</Text>
                        <View style={styles.deliveryInfoRow}>
                            <Text style={[styles.deliveryLabel, { color: colors.textSecondary }]}>Service:</Text>
                            <Text style={[styles.deliveryValue, { color: colors.text }]}>{order.delivery_service || 'N/A'}</Text>
                        </View>
                        {order.tracking_link && (
                            <View style={styles.deliveryInfoRow}>
                                <Text style={[styles.deliveryLabel, { color: colors.textSecondary }]}>Tracking:</Text>
                                <TouchableOpacity onPress={handleOpenLink}>
                                    <Text style={[styles.deliveryLink, { color: colors.primary }]}>View Link</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <TouchableOpacity style={[styles.button, styles.shipButton, {backgroundColor: colors.primary, marginTop: 12}]} onPress={() => onUpdateStatus(order.id, 'delivered')}>
                            <FontAwesome name="check-circle" size={14} color={colors.card} />
                            <Text style={[styles.buttonText, {color: colors.card}]}>Confirm Delivery</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'delivered':
                return <Text style={styles.infoText}>Waiting for giver to complete the transaction.</Text>;
            default:
                return null;
        }
    };

    return (
        <View style={[styles.orderCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}><Image source={{ uri: order.listing.image_urls[0] }} style={styles.itemImage} /><View style={styles.cardHeaderInfo}><Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>{order.listing.item_name}</Text><Text style={[styles.partyName, {color: colors.textSecondary}]}>{viewType === 'receiving' ? 'From' : 'To'}: {otherParty?.fullName || 'Unknown User'}</Text></View></View>
            <View style={[styles.statusContainer, { backgroundColor: (displayStatus?.color || '#888') + '15' }]}><FontAwesome name={displayStatus?.icon || 'question-circle'} size={16} color={displayStatus?.color || '#888'} /><Text style={[styles.statusText, { color: displayStatus?.color || '#888' }]}>{displayStatus?.label || 'Unknown'}</Text></View>
            
            <View style={styles.actionArea}>
                {viewType === 'giving' ? renderGiverActions() : renderReceiverActions()}
            </View>
        </View>
    );
};

export const OrdersModal: React.FC<OrdersModalProps> = ({ visible, onClose }) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('buying');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isRejectionModalVisible, setRejectionModalVisible] = useState(false);
    const [isProofModalVisible, setProofModalVisible] = useState(false);
    const [isImageViewerVisible, setImageViewerVisible] = useState(false);
    const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
    const [isDeliveryModalVisible, setDeliveryModalVisible] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const translateY = useSharedValue(1000);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

    useEffect(() => { translateY.value = withSpring(visible ? 0 : 1000, { damping: 18, stiffness: 150 }); }, [visible]);

    const fetchOrders = useCallback(async () => {
        if (!user) { setLoading(false); return; };
        setLoading(true);
        let query;
        if (activeTab === 'buying') { query = supabase.from('orders').select('*, listing:listings!inner(id, item_name, image_urls, price_type), seller:users!seller_id(id, fullName)').eq('buyer_id', user.id).neq('listing.price_type', 'For Free');
        } else if (activeTab === 'selling') { query = supabase.from('orders').select('*, listing:listings!inner(id, item_name, image_urls, price_type), buyer:users!buyer_id(id, fullName)').eq('seller_id', user.id).neq('listing.price_type', 'For Free');
        } else { query = supabase.from('orders').select('*, listing:listings!inner(id, item_name, image_urls, price_type), seller:users!seller_id(id, fullName), buyer:users!buyer_id(id, fullName)').eq('listing.price_type', 'For Free').or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`); }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) console.error('Error fetching orders:', error);
        else setOrders(data as any || []);
        setLoading(false);
    }, [user, activeTab]);

    useEffect(() => { if (visible) fetchOrders(); }, [visible, fetchOrders]);
    
    useEffect(() => {
        if (!visible || !user) {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            return;
        }

        const handleRealtimeUpdate = () => {
            console.log('Realtime event received, refetching orders...');
            fetchOrders();
        };

        const channel = supabase
            .channel(`orders_for_${user.id}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'orders', 
                filter: `or=(buyer_id.eq.${user.id},seller_id.eq.${user.id})`
            }, handleRealtimeUpdate)
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [visible, user, fetchOrders]);

    const handleUpdateStatus = async (orderId: number, newStatus: AllOrderStatuses, updateData: object = {}) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, ...updateData } : o));

        const { error } = await supabase.from('orders').update({ status: newStatus, ...updateData }).eq('id', orderId);

        if (error) {
            Alert.alert("Error", "Could not update order status.");
            console.error("DB Update Error:", error);
            fetchOrders();
        }
    };

    const handleConfirmDeliveryDetails = (service: string, link: string) => {
        if (!selectedOrder) return;
        const updateData = { delivery_service: service, tracking_link: link };
        handleUpdateStatus(selectedOrder.id, 'on_the_way', updateData);
        setDeliveryModalVisible(false);
        setSelectedOrder(null);
    };
    
    const handleConfirmRejection = async (reason: string, details: string) => {
        if (!selectedOrder) return;
        const finalReason = reason === 'Other' ? details : reason;
        if (!finalReason.trim()) { Alert.alert("Reason Required", "Please provide a reason for rejection."); return; }

        const newStatus = selectedOrder.listing.price_type === 'For Free' ? 'declined' : 'rejected';
        
        setRejectionModalVisible(false);
        await handleUpdateStatus(selectedOrder.id, newStatus, { rejection_reason: finalReason });
        setSelectedOrder(null);
    };

    const handleOpenDeliveryModal = (order: Order) => { setSelectedOrder(order); setDeliveryModalVisible(true); };
    const handleOpenRejectionModal = (order: Order) => { setSelectedOrder(order); setRejectionModalVisible(true); };
    const handleResubmitProof = async (order: Order) => { setSelectedOrder(order); setProofModalVisible(true); };
    const handleProofSubmissionSuccess = async () => { if (!selectedOrder) return; setProofModalVisible(false); await handleUpdateStatus(selectedOrder.id, 'pending_confirmation'); setSelectedOrder(null); };
    const handleViewImage = (imageUrl: string) => { setViewingImageUrl(imageUrl); setImageViewerVisible(true); };

    if (!visible) return null;

    return (
        <Portal>
            <Animated.View style={[styles.container, { paddingTop: insets.top }, animatedStyle]}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>My Orders</Text>
                        <TouchableOpacity onPress={onClose}>
                            <FontAwesome name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity style={[styles.tab, activeTab === 'buying' && styles.activeTab]} onPress={() => setActiveTab('buying')}><FontAwesome name="shopping-basket" size={18} color={activeTab === 'buying' ? colors.primary : colors.textSecondary as string} /><Text style={[styles.tabText, {color: activeTab === 'buying' ? colors.primary : colors.textSecondary as string}]}>Buying</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.tab, activeTab === 'selling' && styles.activeTab]} onPress={() => setActiveTab('selling')}><FontAwesome name="tag" size={18} color={activeTab === 'selling' ? colors.primary : colors.textSecondary as string} /><Text style={[styles.tabText, {color: activeTab === 'selling' ? colors.primary : colors.textSecondary as string}]}>Selling</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.tab, activeTab === 'free' && styles.activeTab]} onPress={() => setActiveTab('free')}><FontAwesome name="gift" size={18} color={activeTab === 'free' ? colors.primary : colors.textSecondary as string} /><Text style={[styles.tabText, {color: activeTab === 'free' ? colors.primary : colors.textSecondary as string}]}>Free</Text></TouchableOpacity>
                    </View>
                    
                    <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom || 16 }]}>
                        {loading ? (
                            <ActivityIndicator style={{ marginTop: 50 }} size="large" color={colors.primary} />
                        ) : (
                            <>
                                {orders.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <FontAwesome name="inbox" size={60} color={colors.border} />
                                        <Text style={[styles.emptyText, { color: colors.textSecondary as string }]}>You have no orders in this tab.</Text>
                                    </View>
                                ) : (
                                    orders.map((item) => {
                                        if (activeTab === 'free') {
                                            const viewType = item.seller?.id === user?.id ? 'giving' : 'receiving';
                                            return <FreeOrderCard 
                                                key={item.id} 
                                                order={item} 
                                                viewType={viewType} 
                                                onUpdateStatus={handleUpdateStatus} 
                                                onOpenRejectionModal={handleOpenRejectionModal}
                                                onOpenDeliveryModal={handleOpenDeliveryModal}
                                            />;
                                        }
                                        return <OrderCard
                                            key={item.id}
                                            order={item}
                                            viewType={activeTab as 'buying' | 'selling'}
                                            onUpdateStatus={handleUpdateStatus}
                                            onOpenRejectionModal={handleOpenRejectionModal}
                                            onResubmitProof={handleResubmitProof}
                                            onViewImage={handleViewImage}
                                            onOpenDeliveryModal={handleOpenDeliveryModal}
                                        />;
                                    })
                                )}
                            </>
                        )}
                    </ScrollView>
                </View>
            </Animated.View>
            {selectedOrder && (
                <>
                    <RejectionModal visible={isRejectionModalVisible} onClose={() => setRejectionModalVisible(false)} onSubmit={handleConfirmRejection} isSubmitting={false} />
                     <ProofOfPaymentModal 
                        visible={isProofModalVisible} 
                        onClose={() => setProofModalVisible(false)} 
                        listingId={selectedOrder.listing.id} 
                        sellerId={selectedOrder.seller?.id || ''} 
                        amount={selectedOrder.amount || 0} 
                        paymentMethod={selectedOrder.payment_method} 
                        onSubmissionSuccess={handleProofSubmissionSuccess}
                        sellerAccountDetails={null}
                     />
                </>
            )}
            <DeliveryDetailsModal
                visible={isDeliveryModalVisible}
                onClose={() => setDeliveryModalVisible(false)}
                onSubmit={handleConfirmDeliveryDetails}
            />
            <Modal visible={isImageViewerVisible} transparent={true} onRequestClose={() => setImageViewerVisible(false)}><View style={styles.imageViewerBackdrop}><Image source={{ uri: viewingImageUrl || '' }} style={styles.fullscreenImage} resizeMode="contain" /><TouchableOpacity style={[styles.closeButton, { top: insets.top + 10 }]} onPress={() => setImageViewerVisible(false)}><FontAwesome name="times" size={24} color="#FFF" /></TouchableOpacity></View></Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    container: { ...StyleSheet.absoluteFillObject, zIndex: 1000, elevation: 10 }, modalContent: { flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 }, title: { fontSize: 22, fontWeight: 'bold' }, tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#f0f0f0' }, tab: { paddingVertical: 15, flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderBottomWidth: 3, borderBottomColor: 'transparent' }, activeTab: { borderBottomColor: '#A9CF38' }, tabText: { fontSize: 16, fontWeight: '600' }, list: { padding: 16, }, orderCard: { padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, borderColor: '#eee' }, cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 }, itemImage: { width: 60, height: 60, borderRadius: 8, }, cardHeaderInfo: { flex: 1 }, itemName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 }, partyName: { fontSize: 14, }, amount: { fontSize: 16, fontWeight: 'bold' }, statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' }, statusText: { fontSize: 14, fontWeight: 'bold' }, proofSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#f0f0f0' }, proofTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 }, proofImage: { width: 100, height: 100, borderRadius: 8, resizeMode: 'cover', marginBottom: 8 }, refText: { fontSize: 13, fontStyle: 'italic', marginBottom: 12 }, rejectionReasonText: { fontSize: 14, fontStyle: 'italic', marginBottom: 12, lineHeight: 20 }, actionButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 }, button: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }, buttonText: { fontWeight: 'bold', fontSize: 14 }, rejectButton: { backgroundColor: '#e74c3c20' }, acceptButton: { backgroundColor: '#27ae6020' }, shipButton: { marginTop: 12, alignSelf: 'stretch', justifyContent: 'center' }, resubmitButton: { alignSelf: 'stretch', justifyContent: 'center' }, emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 20 }, emptyText: { fontSize: 16, fontWeight: '500' }, imageViewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }, fullscreenImage: { width: '100%', height: '100%' }, closeButton: { position: 'absolute', right: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }, infoText: { textAlign: 'center', fontStyle: 'italic', color: '#666', marginTop: 12, paddingVertical: 8 }, messageContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, }, messageLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6, }, messageText: { fontSize: 14, fontStyle: 'italic', lineHeight: 20, },
    actionArea: { marginTop: 8 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    deliveryModalContainer: { borderRadius: 16, padding: 20, width: '100%', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
    modalSubtitle: { fontSize: 16, fontWeight: '500', marginBottom: 12, },
    serviceSelection: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    serviceChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
    serviceChipText: { fontWeight: '600' },
    linkInput: { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 16, marginTop: 4 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24, },
    modalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    cancelButton: { backgroundColor: 'transparent' },
    deliveryInfoSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
    deliveryInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
    deliveryLabel: { fontSize: 14, fontWeight: '500' },
    deliveryValue: { fontSize: 14, fontWeight: '600' },
    deliveryLink: { fontSize: 14, fontWeight: 'bold', textDecorationLine: 'underline' },
    paypalInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
});
