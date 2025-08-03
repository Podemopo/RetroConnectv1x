// components/modals/BarterOfferModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Portal } from 'react-native-portalize';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { Listing } from '../cards/ProductCard';
import { ConfirmationModal } from './ConfirmationModal';

// --- PROPS INTERFACE ---
interface BarterOfferModalProps {
    visible: boolean;
    onClose: () => void;
    userId: string;
    onSubmit: (offeredIds: number[], deliveryMethod: 'Meet Up' | 'Online Delivery') => Promise<void>;
    targetItemName: string;
}

type DeliveryMethod = 'Meet Up' | 'Online Delivery';
type ModalStep = 'selecting_method' | 'selecting_items';

// --- ITEM COMPONENT ---
const AnimatedItem = ({ item, isSelected, onSelect }: { item: Listing, isSelected: boolean, onSelect: () => void }) => {
    const { colors } = useTheme();
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));
    useEffect(() => {
        scale.value = withTiming(isSelected ? 1.05 : 1, { duration: 200 });
    }, [isSelected, scale]);

    return (
        <Animated.View style={[styles.itemWrapper, animatedStyle]}>
            <TouchableOpacity
                style={[ styles.itemContainer, { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : 'transparent', shadowColor: '#000' }]}
                onPress={onSelect}
                activeOpacity={0.9}
            >
                <Image source={{ uri: item.image_urls[0] }} style={styles.itemImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.textOverlayGradient} />
                <View style={styles.itemNameContainer}>
                    <Text style={[styles.itemName, { color: '#FFF' }]} numberOfLines={2}>{item.item_name}</Text>
                </View>
                {isSelected && <View style={[styles.selectionOverlay, {borderColor: colors.primary}]} />}
                {isSelected && (
                    <View style={[styles.checkIconContainer, { backgroundColor: colors.primary, borderColor: colors.card }]}>
                        <FontAwesome name="check" size={14} color={colors.card} />
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

// --- MAIN MODAL COMPONENT ---
export const BarterOfferModal: React.FC<BarterOfferModalProps> = ({ visible, onClose, userId, onSubmit, targetItemName }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const [myListings, setMyListings] = useState<Listing[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isExitConfirmationVisible, setExitConfirmationVisible] = useState(false);
    
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
    const [currentStep, setCurrentStep] = useState<ModalStep>('selecting_method');

    const translateY = useSharedValue(1000);
    const backdropOpacity = useSharedValue(0);

    const animatedModalStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
    const animatedBackdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
            backdropOpacity.value = withTiming(1, { duration: 250 });
            fetchMyListings();
        } else {
            translateY.value = withTiming(1000, { duration: 300 });
            backdropOpacity.value = withTiming(0, { duration: 300 });
            setTimeout(() => {
                setCurrentStep('selecting_method');
                setDeliveryMethod(null);
                setSelectedIds(new Set());
            }, 300);
        }
    }, [visible]);

    const fetchMyListings = async () => {
        setLoading(true);
        const { data } = await supabase.from('listings').select('*').eq('user_id', userId).eq('status', 'active');
        setMyListings(data || []);
        setLoading(false);
    };

    const handleSelectDeliveryMethod = (method: DeliveryMethod) => {
        setDeliveryMethod(method);
        setCurrentStep('selecting_items');
    };

    const handleGoBack = () => {
        setCurrentStep('selecting_method');
        setSelectedIds(new Set());
    };

    const handleToggleSelection = (id: number) => {
        const newSelection = new Set(selectedIds);
        newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id);
        setSelectedIds(newSelection);
    };

    const handleAttemptClose = () => {
        if (selectedIds.size > 0 && !submitting) {
            setExitConfirmationVisible(true);
        } else {
            onClose();
        }
    };

    const handleConfirmDiscard = () => {
        setExitConfirmationVisible(false);
        onClose();
    };

    const handleSubmit = async () => {
        if (submitting || selectedIds.size === 0 || !deliveryMethod) return;
        setSubmitting(true);
        await onSubmit(Array.from(selectedIds), deliveryMethod);
        setSubmitting(false);
    };

    useEffect(() => {
        const backAction = () => {
            if (visible) {
                if (currentStep === 'selecting_items') {
                    handleGoBack();
                } else {
                    handleAttemptClose();
                }
                return true;
            }
            return false;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [visible, currentStep, selectedIds]);

    if (!visible) return null;

    const renderMethodSelection = () => (
        <View style={styles.methodSelectionContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>How do you want to trade?</Text>
            <TouchableOpacity style={[styles.methodButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleSelectDeliveryMethod('Meet Up')}>
                <FontAwesome name="handshake-o" size={40} color={colors.primary} />
                <Text style={[styles.methodButtonText, { color: colors.text }]}>Meet Up</Text>
                <Text style={[styles.methodButtonSubtitle, { color: colors.text }]}>Exchange items in person</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.methodButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleSelectDeliveryMethod('Online Delivery')}>
                <FontAwesome name="truck" size={40} color={colors.primary} />
                <Text style={[styles.methodButtonText, { color: colors.text }]}>Online Delivery</Text>
                <Text style={[styles.methodButtonSubtitle, { color: colors.text }]}>Ship items to each other</Text>
            </TouchableOpacity>
        </View>
    );

    const renderItemSelection = () => {
        if (loading) {
            return <View style={styles.centeredView}><ActivityIndicator size="large" color={colors.primary} /></View>;
        }
        if (myListings.length === 0) {
            return (
                <View style={styles.centeredView}>
                    <FontAwesome name="dropbox" size={60} color={colors.text + '40'} />
                    <Text style={[styles.emptyText, {color: colors.text+'99'}]}>No active listings to trade.</Text>
                </View>
            );
        }
        return (
            <FlatList
                data={myListings}
                renderItem={({ item }) => (<AnimatedItem item={item} isSelected={selectedIds.has(item.id)} onSelect={() => handleToggleSelection(item.id)} />)}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        );
    };

    return (
        <Portal>
            <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
                <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
                    <Pressable onPress={handleAttemptClose} style={StyleSheet.absoluteFill} />
                </Animated.View>
                <Animated.View style={[styles.modalContainer, animatedModalStyle]}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
                        <View style={[styles.modalView, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
                            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                                {currentStep === 'selecting_items' && (
                                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                                        <FontAwesome name="chevron-left" size={22} color={colors.text} />
                                    </TouchableOpacity>
                                )}
                                <View style={styles.headerContent}>
                                   <Text style={[styles.headerTitle, { color: colors.text }]}>Propose a Trade</Text>
                                   <Text style={[styles.headerSubtitle, { color: colors.text+'99' }]} numberOfLines={1}>For "{targetItemName}"</Text>
                                </View>
                                <TouchableOpacity onPress={handleAttemptClose} style={styles.closeButton}>
                                    <FontAwesome name="close" size={24} color={colors.text + '80'} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.contentArea}>
                                {currentStep === 'selecting_method' ? renderMethodSelection() : renderItemSelection()}
                            </View>
                            {currentStep === 'selecting_items' && myListings.length > 0 && (
                                <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? 0 : 20}]}>
                                    <TouchableOpacity style={[styles.submitButton, { backgroundColor: selectedIds.size > 0 ? colors.primary : colors.border }]} onPress={handleSubmit} disabled={selectedIds.size === 0 || submitting} activeOpacity={0.8}>
                                        {submitting ? (
                                            <ActivityIndicator color={colors.card} />
                                        ) : (
                                            <Text style={[styles.submitButtonText, { color: selectedIds.size > 0 ? colors.card : colors.text+'80' }]}>
                                                {`Offer ${selectedIds.size > 0 ? selectedIds.size : ''} Item${selectedIds.size === 1 ? '' : 's'}`}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </Animated.View>
                <ConfirmationModal visible={isExitConfirmationVisible} onCancel={() => setExitConfirmationVisible(false)} onConfirm={handleConfirmDiscard} title="Cancel Trade Proposal?" message="Your selections will be lost if you exit now." confirmText="Discard" cancelText="Continue" />
            </SafeAreaView>
        </Portal>
    );
};

// --- STYLES ---
const styles = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
    keyboardAvoidingView: { flex: 1, justifyContent: 'flex-end' },
    modalView: { height: '90%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    header: { paddingVertical: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
    backButton: { paddingRight: 15, paddingVertical: 5 },
    headerContent: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    headerSubtitle: { fontSize: 15, marginTop: 2 },
    closeButton: { paddingLeft: 15, paddingVertical: 5 },
    contentArea: { flex: 1 },
    list: { paddingHorizontal: 8, paddingTop: 8 },
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 15 },
    emptyText: { marginTop: 10, fontSize: 17, fontWeight: '600', textAlign: 'center' },
    footer: { padding: 20, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.1)' },
    submitButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    submitButtonText: { fontSize: 17, fontWeight: 'bold' },
    itemWrapper: { width: '50%', padding: 8 },
    itemContainer: { borderRadius: 16, borderWidth: 2, overflow: 'hidden', elevation: 4, position: 'relative', aspectRatio: 1 },
    itemImage: { width: '100%', height: '100%' },
    textOverlayGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
    itemNameContainer: { position: 'absolute', bottom: 0, padding: 12, width: '100%'},
    itemName: { fontWeight: 'bold', fontSize: 14, color: '#FFFFFF' },
    selectionOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(169, 207, 56, 0.3)', borderWidth: 2, borderRadius: 14 },
    checkIconContainer: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    methodSelectionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 20 },
    stepTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    methodButton: { width: '100%', padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
    methodButtonText: { fontSize: 20, fontWeight: 'bold' },
    methodButtonSubtitle: { fontSize: 14, opacity: 0.7 }
});