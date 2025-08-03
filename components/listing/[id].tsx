// Isabellalito/app/listing/[id].tsx

import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, useTheme } from "@react-navigation/native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useReducer, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Dimensions,
    FlatList,
    Image,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gallery, fitContainer } from 'react-native-zoom-toolkit';
import { useAuth } from "../../components/context/AuthContext";
import { ItemOptionsMenu, MenuOption } from "../../components/menus/ItemOptionsMenu";
import { BarterOfferModal } from "../../components/modals/BarterOfferModal";
import { ConfirmationModal } from "../../components/modals/ConfirmationModal";
import { MakeOfferModal } from "../../components/modals/MakeOfferModal";
import { PaymentChoiceModal } from "../../components/modals/PaymentChoiceModal";
import { PaymentModal } from "../../components/modals/PaymentModal";
import { ProofOfPaymentModal } from "../../components/modals/ProofOfPaymentModal";
import { RequestItemModal } from "../../components/modals/RequestItemfreeModal";
import { SuccessModal } from "../../components/modals/SuccessModal";
import { ThriftShareReport } from "../../components/modals/ThriftShareReport"; // CORRECTED IMPORT
import { TradesModal } from "../../components/modals/TradesModal";
import { Review } from "../../components/profile/ReviewsSection";
import { supabase } from "../../supabase";
import { Message } from "../../types/chat";

const { width, height } = Dimensions.get("window");

// --- TYPE DEFINITIONS ---
interface PaymentAccount {
    id: string;
    type: 'GCash' | 'PayMaya';
    account_name: string;
    account_number: string;
    is_primary: boolean;
}
type UserProfile = {
    fullName: string;
    profilePhotoUrl: string;
};
type Listing = {
    id: number;
    item_name: string;
    description: string;
    price: number | null;
    price_type: string;
    categories: string[];
    is_new: boolean;
    deal_method: string;
    image_urls: string[];
    user_id: string;
    users: UserProfile | null;
    view_count: number;
    status: "active" | "reserved" | "sold";
    dynamic_fields: Record<string, string> | null;
    meetup_info: string | null;
    is_cod_enabled: boolean;
};
type State = {
    listing: Listing | null;
    reviews: Review[];
    loading: boolean;
    isOwner: boolean;
    isMenuVisible: boolean;
    menuPosition: { x: number; y: number };
    chatLoading: boolean;
    isImageViewerVisible: boolean;
    imageViewerIndex: number;
    imageActiveIndex: number;
    reviewActiveIndex: number;
    isBarterModalVisible: boolean;
    isRequestModalVisible: boolean;
    isOfferModalVisible: boolean;
    offerSentModalVisible: boolean;
    tradesModalVisible: boolean;
    favoriteCount: number;
    isFavorited: boolean;
    favoriteLoading: boolean;
    confirmationModalConfig: {
        visible: boolean;
        title: string;
        message: string;
        confirmText: string;
        onConfirm: () => void;
        icon?: React.ComponentProps<typeof FontAwesome>['name'];
        confirmButtonColor?: string;
    };
    isUpdatingStatus: boolean;
    isReportModalVisible: boolean;
    isProofOfPaymentModalVisible: boolean;
    selectedPaymentMethod: 'GCash' | 'PayMaya' | null;
    isPaymentChoiceModalVisible: boolean;
};

// --- HELPER COMPONENTS ---

const GalleryImage = ({ uri }: { uri: string }) => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const [resolution, setResolution] = useState({ width: 1, height: 1 });

    const imageSize = fitContainer(
        resolution.width / resolution.height,
        { width: windowWidth, height: windowHeight }
    );

    return (
        <Image
            source={{ uri }}
            style={imageSize}
            resizeMethod="scale"
            resizeMode="contain"
            onLoad={(e) => {
                setResolution({
                    width: e.nativeEvent.source.width,
                    height: e.nativeEvent.source.height,
                });
            }}
        />
    );
};


const ReviewCard = ({
    review,
    cardWidth,
}: {
    review: Review;
    cardWidth: number;
}) => {
    const { colors } = useTheme();
    const renderStars = (rating: number) =>
        [...Array(5)].map((_, i) => (
            <FontAwesome
                key={i}
                name="star"
                size={20}
                color={i < rating ? "#FFD700" : colors.border}
                style={{ marginRight: 4 }}
            />
        ));
    return (
        <View
            style={[
                styles.reviewSlide,
                {
                    width: cardWidth,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
            ]}
        >
            <View style={styles.reviewHeader}>
                <Image
                    source={{ uri: review.reviewer.profilePhotoUrl }}
                    style={styles.reviewerAvatar}
                />
                <View style={styles.reviewHeaderText}>
                    <Text
                        style={[styles.reviewerName, { color: colors.text }]}
                        numberOfLines={1}
                    >
                        {review.reviewer.fullName}
                    </Text>
                    <Text
                        style={[styles.reviewTimestamp, { color: colors.text + "99" }]}
                    >
                        {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>
            <Text
                style={[styles.reviewComment, { color: colors.text + "dd" }]}
                numberOfLines={4}
            >
                {review.comment}
            </Text>
            <View style={styles.starRatingContainer}>{renderStars(review.rating)}</View>
        </View>
    );
};

const PaginationDots = ({
    data,
    activeIndex,
    type = 'image',
}: {
    data: any[];
    activeIndex: number;
    type?: 'image' | 'review';
}) => {
    const { colors } = useTheme();

    if (type === 'review' && data.length <= 1) {
        return null;
    }

    const dotsToShow =
        type === 'review' && data.length > 1 && data.length <= 5
            ? Array(3).fill(0)
            : data;

    return (
        <View style={type === 'image' ? styles.imagePaginationContainer : styles.reviewPaginationContainer}>
            {dotsToShow.map((_, i) => {
                const isActive = i === activeIndex;
                const animatedStyle = useAnimatedStyle(() => ({
                    width: withTiming(isActive ? 20 : 8, { duration: 250 }),
                    backgroundColor: withTiming(isActive ? colors.primary : type === 'image' ? '#FFFFFF80' : colors.border, {
                        duration: 250,
                    }),
                }));
                return (
                    <Animated.View key={i} style={[styles.paginationDot, animatedStyle]} />
                );
            })}
        </View>
    );
};

const initialState: State = {
    listing: null,
    reviews: [],
    loading: true,
    isOwner: false,
    isMenuVisible: false,
    menuPosition: { x: 0, y: 0 },
    chatLoading: false,
    isImageViewerVisible: false,
    imageViewerIndex: 0,
    imageActiveIndex: 0,
    reviewActiveIndex: 0,
    isBarterModalVisible: false,
    isRequestModalVisible: false,
    isOfferModalVisible: false,
    offerSentModalVisible: false,
    tradesModalVisible: false,
    favoriteCount: 0,
    isFavorited: false,
    favoriteLoading: false,
    confirmationModalConfig: {
        visible: false,
        title: "",
        message: "",
        confirmText: "",
        onConfirm: () => { },
    },
    isUpdatingStatus: false,
    isReportModalVisible: false,
    isProofOfPaymentModalVisible: false,
    selectedPaymentMethod: null,
    isPaymentChoiceModalVisible: false,
};

function reducer(state: State, action: any): State {
    switch (action.type) {
        case "SET_LOADING":
            return { ...state, loading: action.payload };
        case "SET_LISTING_DATA":
            return { ...state, ...action.payload };
        case "SET_IS_OWNER":
            return { ...state, isOwner: action.payload };
        case "SET_REVIEWS":
            return { ...state, reviews: action.payload };
        case "SET_FAVORITE_DATA":
            return { ...state, ...action.payload };
        case "TOGGLE_MENU":
            return {
                ...state,
                isMenuVisible: !state.isMenuVisible,
                menuPosition: action.payload || state.menuPosition,
            };
        case "TOGGLE_CHAT_LOADING":
            return { ...state, chatLoading: !state.chatLoading };
        case "TOGGLE_IMAGE_VIEWER":
            return {
                ...state,
                isImageViewerVisible: !state.isImageViewerVisible,
                imageViewerIndex: action.payload ?? 0,
            };
        case "TOGGLE_REPORT_MODAL":
            return { ...state, isReportModalVisible: !state.isReportModalVisible };
        case "SET_ACTIVE_IMAGE_INDEX":
            return { ...state, imageActiveIndex: action.payload };
        case "SET_ACTIVE_REVIEW_INDEX":
            return { ...state, reviewActiveIndex: action.payload };
        case "TOGGLE_BARTER_MODAL":
            return {
                ...state,
                isBarterModalVisible: !state.isBarterModalVisible,
            };
        case "TOGGLE_REQUEST_MODAL":
            return {
                ...state,
                isRequestModalVisible: !state.isRequestModalVisible,
            };
        case "TOGGLE_OFFER_MODAL":
            return {
                ...state,
                isOfferModalVisible: !state.isOfferModalVisible,
            };
        case "TOGGLE_OFFER_SENT_MODAL":
            return {
                ...state,
                offerSentModalVisible: !state.offerSentModalVisible,
            };
        case "TOGGLE_TRADES_MODAL":
            return {
                ...state,
                tradesModalVisible: !state.tradesModalVisible,
            };
        case "SHOW_CONFIRMATION_MODAL":
            return {
                ...state,
                confirmationModalConfig: { ...action.payload, visible: true },
            };
        case "HIDE_CONFIRMATION_MODAL":
            return {
                ...state,
                confirmationModalConfig: {
                    ...state.confirmationModalConfig,
                    visible: false,
                },
            };
        case "SET_IS_UPDATING_STATUS":
            return { ...state, isUpdatingStatus: action.payload };
        case "TOGGLE_PROOF_OF_PAYMENT_MODAL":
            return { ...state, isProofOfPaymentModalVisible: !state.isProofOfPaymentModalVisible };
        case "SET_PAYMENT_METHOD":
            return { ...state, selectedPaymentMethod: action.payload };
        case "TOGGLE_PAYMENT_CHOICE_MODAL":
            return { ...state, isPaymentChoiceModalVisible: !state.isPaymentChoiceModalVisible };
        default:
            return state;
    }
}

export default function ListingDetailScreen() {
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const router = useRouter();
    const { requireLogin, session } = useAuth();
    const insets = useSafeAreaInsets();
    const optionsMenuRef = useRef<View>(null);
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        listing,
        reviews,
        loading,
        isOwner,
        isMenuVisible,
        menuPosition,
        chatLoading,
        isImageViewerVisible,
        imageViewerIndex,
        imageActiveIndex,
        reviewActiveIndex,
        isBarterModalVisible,
        isRequestModalVisible,
        isOfferModalVisible,
        offerSentModalVisible,
        tradesModalVisible,
        favoriteCount,
        isFavorited,
        favoriteLoading,
        confirmationModalConfig,
        isUpdatingStatus,
        isReportModalVisible,
        isProofOfPaymentModalVisible,
        selectedPaymentMethod,
        isPaymentChoiceModalVisible,
    } = state;
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [sellerPaymentAccounts, setSellerPaymentAccounts] = useState<PaymentAccount[]>([]);

    const onViewableImagesChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0)
            dispatch({
                type: "SET_ACTIVE_IMAGE_INDEX",
                payload: viewableItems[0].index || 0,
            });
    }).current;
    const onViewableReviewsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0)
            dispatch({
                type: "SET_ACTIVE_REVIEW_INDEX",
                payload: viewableItems[0].index || 0,
            });
    }).current;
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
    const showMenu = () => {
        optionsMenuRef.current?.measure(
            (_fx, _fy, _width, height, px, py) => {
                dispatch({
                    type: "TOGGLE_MENU",
                    payload: { x: px - 200, y: py + height },
                });
            }
        );
    };

    const handleUpdateListingStatus = async (
        status: "active" | "reserved" | "sold"
    ) => {
        if (!listing) return;
        dispatch({ type: "SET_IS_UPDATING_STATUS", payload: true });
        const { error } = await supabase
            .from("listings")
            .update({ status })
            .eq("id", listing.id);
        dispatch({ type: "SET_IS_UPDATING_STATUS", payload: false });
        dispatch({ type: "HIDE_CONFIRMATION_MODAL" });
        if (error) {
            Alert.alert("Error", `Failed to mark item as ${status}.`);
        } else {
            dispatch({
                type: "SET_LISTING_DATA",
                payload: { listing: { ...listing, status } },
            });
            if (status === 'active') {
                Alert.alert("Success", "Your item is now visible again in the Marketplace. Good luck!");
            } else {
                Alert.alert("Success", `Item has been marked as ${status}.`);
            }
        }
    };

    const handleDeleteListing = async () => {
        if (!listing) return;
        dispatch({ type: "SET_IS_UPDATING_STATUS", payload: true });
        const { error } = await supabase
            .from("listings")
            .delete()
            .eq("id", listing.id);
        dispatch({ type: "SET_IS_UPDATING_STATUS", payload: false });
        dispatch({ type: "HIDE_CONFIRMATION_MODAL" });
        if (error) {
            Alert.alert("Error", "Failed to delete the item.");
        } else {
            Alert.alert("Deleted", "The item has been permanently removed.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        }
    };

    const getMenuOptions = (): MenuOption[] => {
        if (!isOwner) {
            return [
                {
                    title: 'Report',
                    icon: 'flag',
                    onPress: () => {
                        dispatch({ type: "TOGGLE_MENU" });
                        dispatch({ type: "TOGGLE_REPORT_MODAL" });
                    },
                    isDestructive: true,
                }
            ];
        }
        if (listing?.status === "sold") {
            return [
                {
                    title: "Delete",
                    icon: "trash",
                    onPress: () => {
                        dispatch({ type: "TOGGLE_MENU" });
                        dispatch({
                            type: "SHOW_CONFIRMATION_MODAL",
                            payload: {
                                title: "Delete Item?",
                                message:
                                    "Are you sure you want to delete this item? This action is permanent.",
                                confirmText: "Delete",
                                onConfirm: handleDeleteListing,
                                icon: "trash",
                                confirmButtonColor: "#FF4136",
                            },
                        });
                    },
                    isDestructive: true,
                },
            ];
        }
        const options: MenuOption[] = [
            {
                title: "Edit",
                icon: "pencil",
                onPress: () => {
                    if (listing) {
                        dispatch({ type: "TOGGLE_MENU" });
                        router.push({ pathname: '/sell-form', params: { listingId: listing.id.toString() } });
                    }
                },
            },
        ];
        if (listing?.status === "reserved") {
            options.push({
                title: "Unreserve",
                icon: "play-circle",
                onPress: () => {
                    dispatch({ type: "TOGGLE_MENU" });
                    handleUpdateListingStatus("active");
                },
            });
        } else {
            options.push({
                title: "Mark as Reserved",
                icon: "pause-circle",
                onPress: () => {
                    dispatch({ type: "TOGGLE_MENU" });
                    dispatch({
                        type: "SHOW_CONFIRMATION_MODAL",
                        payload: {
                            title: "Reserve Item?",
                            message: "When reserved, this item will not be visible in the marketplace and you will not receive any offers.",
                            confirmText: "Reserve",
                            cancelText: "No",
                            onConfirm: () => handleUpdateListingStatus("reserved"),
                            icon: "pause-circle",
                        },
                    });
                },
            });
        }

        const isTradeItem = listing?.price_type === "For Trade";
        options.push({
            title: isTradeItem ? "Mark as Traded" : "Mark as Sold",
            icon: "check-circle",
            onPress: () => {
                dispatch({ type: "TOGGLE_MENU" });
                dispatch({
                    type: "SHOW_CONFIRMATION_MODAL",
                    payload: {
                        title: `Mark as ${isTradeItem ? "Traded" : "Sold"}?`,
                        message: "This action cannot be undone. Buyers can no longer chat with you or make offers for this listing.",
                        confirmText: `Mark as ${isTradeItem ? "Traded" : "Sold"}`,
                        onConfirm: () => handleUpdateListingStatus("sold"),
                        icon: "check-circle",
                    },
                });
            },
        });

        options.push({
            title: "Delete",
            icon: "trash",
            onPress: () => {
                dispatch({ type: "TOGGLE_MENU" });
                dispatch({
                    type: "SHOW_CONFIRMATION_MODAL",
                    payload: {
                        title: "Delete Item?",
                        message:
                            "Are you sure you want to delete this item? This action is permanent.",
                        confirmText: "Delete",
                        onConfirm: handleDeleteListing,
                        icon: "trash",
                        confirmButtonColor: "#FF4136",
                    },
                });
            },
            isDestructive: true,
        });
        return options;
    };

    const fetchListingDetails = useCallback(async () => {
        if (!id) return;
        dispatch({ type: "SET_LOADING", payload: true });
        if (session?.user) {
            await supabase.rpc("handle_listing_view", {
                listing_id_param: Number(id),
            });
        }
        const { data, error } = await supabase
            .from("listings")
            .select("*, users ( fullName, profilePhotoUrl )")
            .eq("id", id)
            .single();
        if (error || !data) {
            Alert.alert("Error", "Could not load listing details.");
            dispatch({ type: "SET_LOADING", payload: false });
            return;
        }
        dispatch({ type: "SET_LISTING_DATA", payload: { listing: data as Listing } });
        dispatch({ type: "SET_IS_OWNER", payload: session?.user?.id === data.user_id });
        const { data: reviewData } = await supabase
            .from("reviews")
            .select("*, reviewer:users!reviewer_id(id, fullName, profilePhotoUrl)")
            .eq("reviewee_id", data.user_id)
            .order("created_at", { ascending: false });
        dispatch({ type: "SET_REVIEWS", payload: (reviewData as any) || [] });
        const { count: favorites } = await supabase
            .from("favorites")
            .select("*", { count: "exact", head: true })
            .eq("listing_id", id);
        dispatch({ type: "SET_FAVORITE_DATA", payload: { favoriteCount: favorites ?? 0 } });
        if (session?.user) {
            const { data: userFavorite } = await supabase
                .from("favorites")
                .select("listing_id")
                .eq("listing_id", id)
                .eq("user_id", session.user.id)
                .single();
            dispatch({ type: "SET_FAVORITE_DATA", payload: { isFavorited: !!userFavorite } });
        }
        const { data: paymentData } = await supabase
            .from('seller_payment_details')
            .select('payment_methods')
            .eq('user_id', data.user_id)
            .single();
        if (paymentData && paymentData.payment_methods) {
            setSellerPaymentAccounts(paymentData.payment_methods);
        } else {
            setSellerPaymentAccounts([]);
        }
        dispatch({ type: "SET_LOADING", payload: false });
    }, [id, session]);

    useFocusEffect(
        useCallback(() => {
            fetchListingDetails();
            const onBackPress = () => {
                if (router.canGoBack()) {
                    router.back();
                    return true;
                }
                return false;
            };
            const subscription = BackHandler.addEventListener(
                "hardwareBackPress",
                onBackPress
            );
            return () => subscription.remove();
        }, [fetchListingDetails, router])
    );

    const handleToggleFavorite = async () => {
        requireLogin(async () => {
            if (favoriteLoading || !session?.user || !listing) return;
            dispatch({ type: "SET_FAVORITE_DATA", payload: { favoriteLoading: true } });
            if (isFavorited) {
                dispatch({
                    type: "SET_FAVORITE_DATA",
                    payload: { isFavorited: false, favoriteCount: favoriteCount - 1 },
                });
                await supabase
                    .from("favorites")
                    .delete()
                    .match({ listing_id: listing.id, user_id: session.user.id });
            } else {
                dispatch({
                    type: "SET_FAVORITE_DATA",
                    payload: { isFavorited: true, favoriteCount: favoriteCount + 1 },
                });
                await supabase
                    .from("favorites")
                    .insert({ listing_id: listing.id, user_id: session.user.id });
            }
            dispatch({ type: "SET_FAVORITE_DATA", payload: { favoriteLoading: false } });
        });
    };

    const openImageViewer = (index: number) => {
        dispatch({ type: "TOGGLE_IMAGE_VIEWER", payload: index });
    };

    const handleSendMessage = async (
        message: string,
        recipientId: string,
        recipientName: string,
        messageType: Message["message_type"] = "text",
        metadata: Message["metadata"] = null
    ): Promise<{ conversationId: number; recipientName: string } | undefined> => {
        if (!session?.user) return;
        try {
            const { data: conversationId, error: rpcError } = await supabase.rpc(
                "find_or_create_conversation",
                { participants_to_find: [session.user.id, recipientId] }
            );
            if (rpcError) throw rpcError;
            await supabase.from("messages").insert({
                conversation_id: conversationId,
                sender_id: session.user.id,
                message_text: message,
                message_type: messageType,
                metadata: metadata,
            });
            await supabase
                .from("conversations")
                .update({
                    last_message_text: message,
                    last_message_at: new Date().toISOString(),
                })
                .eq("id", conversationId);
            return { conversationId, recipientName };
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    };

    const handleRequestSubmit = async (message: string) => {
        if (!listing || !listing.users) return;
        requireLogin(async () => {
            if (!listing?.users) return;
            try {
                const requestMessage = "Item Request";
                const metadata = {
                    actionType: "item_request" as const,
                    itemName: listing.item_name,
                    itemImage: listing.image_urls[0],
                    message: message,
                };
                const result = await handleSendMessage(
                    requestMessage,
                    listing.user_id,
                    listing.users.fullName,
                    "item_request",
                    metadata
                );
                if (result) {
                    dispatch({ type: "TOGGLE_REQUEST_MODAL" });
                    Alert.alert(
                        "Request Sent!",
                        "Your message has been sent. You'll now be taken to the chat."
                    );
                    router.push({
                        pathname: "/chat/[id]",
                        params: {
                            id: result.conversationId.toString(),
                            recipientName: result.recipientName,
                        },
                    });
                }
            } catch (error) {
                Alert.alert("Error", "Could not send your request.");
            }
        });
    };

    const handleStartChat = async () => {
        if (!listing || !listing.users) return;
        requireLogin(async () => {
            if (!listing?.users) return;
            dispatch({ type: "TOGGLE_CHAT_LOADING" });
            try {
                const initialMessage = `Hi! I'm interested in your item: "${listing.item_name}"`;
                const result = await handleSendMessage(
                    initialMessage,
                    listing.user_id,
                    listing.users.fullName
                );
                if (result) {
                    router.push({
                        pathname: "/chat/[id]",
                        params: {
                            id: result.conversationId.toString(),
                            recipientName: result.recipientName,
                        },
                    });
                }
            } catch (error) {
                Alert.alert("Error", "Could not start a conversation.");
            } finally {
                dispatch({ type: "TOGGLE_CHAT_LOADING" });
            }
        });
    };

    const handleOfferSubmit = async (offerAmount: number) => {
        if (!listing || !listing.users) return;
        requireLogin(async () => {
            if (!listing?.users) return;
            try {
                const offerMessage = `Offer: PHP ${offerAmount.toLocaleString()}`;
                const metadata = {
                    actionType: "offer" as const,
                    itemName: listing.item_name,
                    itemImage: listing.image_urls[0],
                    itemPrice: listing.price,
                    offerAmount: offerAmount,
                };
                await handleSendMessage(
                    offerMessage,
                    listing.user_id,
                    listing.users.fullName,
                    "offer",
                    metadata
                );
                dispatch({ type: "TOGGLE_OFFER_MODAL" });
                Alert.alert("Offer Sent!", "Your offer has been sent to the seller.");
            } catch (error) {
                Alert.alert("Error", "Could not send your offer.");
            }
        });
    };

    const handlePaymentAttempt = (method: 'GCash' | 'PayMaya') => {
        setPaymentModalVisible(false);
        dispatch({ type: "SET_PAYMENT_METHOD", payload: method });
        dispatch({ type: "TOGGLE_PROOF_OF_PAYMENT_MODAL" });
    };

    const handleCodOrder = async () => {
        if (!listing || !session?.user) return;

        try {
            const { error } = await supabase.from('orders').insert({
                listing_id: listing.id,
                buyer_id: session.user.id,
                seller_id: listing.user_id,
                amount: listing.price,
                payment_method: 'COD',
                status: 'pending_cod',
            });

            if (error) throw error;

            Alert.alert(
                'Order Placed!',
                'Your order has been sent to the seller for confirmation. You will be notified once it is accepted.'
            );
            router.push('/(tabs)/me');

        } catch (error: any) {
            console.error("Error creating COD order:", error);
            Alert.alert("Error", "Could not place your order. " + error.message);
        }
    };

    const handleBuyNowPress = () => {
        requireLogin(() => {
            if (!listing) return;

            const hasDigitalPayment = sellerPaymentAccounts.length > 0;
            const hasCod = listing.is_cod_enabled;

            if (hasDigitalPayment && hasCod) {
                dispatch({ type: "TOGGLE_PAYMENT_CHOICE_MODAL" });
            } else if (hasDigitalPayment) {
                setPaymentModalVisible(true);
            } else if (hasCod) {
                handleCodOrder();
            } else {
                Alert.alert("No Payment Options", "This seller has not set up any payment methods.");
            }
        });
    };

    const handleSellerPress = (sellerId: string) => {
        if (session?.user?.id === sellerId) {
            router.push("/(tabs)/me");
        } else {
            router.push({ pathname: "/user/[id]", params: { id: sellerId } });
        }
    };

    const handleSubmitBarter = async (offeredIds: number[]) => {
        if (!listing || !session?.user || offeredIds.length === 0 || !listing.users)
            return;
        dispatch({ type: "TOGGLE_BARTER_MODAL" });
        try {
            const { error: reqError } = await supabase.from("BarterRequest").insert({
                requester_id: session.user.id,
                listing_owner_id: listing.user_id,
                requested_listing_id: listing.id,
                offered_listing_ids: offeredIds,
                status: "pending",
            });
            if (reqError) throw reqError;
            dispatch({ type: "TOGGLE_OFFER_SENT_MODAL" });
        } catch (error) {
            console.error("Barter submit error:", error);
            Alert.alert("Error", "Could not submit your trade offer.");
        }
    };

    const handleViewMyTrades = () => {
        dispatch({ type: "TOGGLE_OFFER_SENT_MODAL" });
        dispatch({ type: "TOGGLE_TRADES_MODAL" });
    };

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
        ? (reviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / totalReviews).toFixed(1)
        : "N/A";
    const positiveFeedbackPercentage = totalReviews > 0
        ? `${Math.round(
            (reviews.filter((r: Review) => r.rating >= 4).length / totalReviews) * 100
        )}%`
        : "N/A";

    if (loading)
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );

    if (!listing)
        return (
            <View style={styles.centered}>
                <Text style={[styles.errorText, { color: colors.text }]}>
                    Listing not found.
                </Text>
            </View>
        );

    const sellerName = listing.users?.fullName ?? "Unknown Seller";
    const sellerAvatar =
        listing.users?.profilePhotoUrl ?? "https://via.placeholder.com/150  ";

    const displayPriceText = () => {
        if (listing.price_type === "For Sale" && typeof listing.price === "number") {
            return `PHP ${listing.price.toLocaleString()}`;
        }
        if (listing.price_type === "For Free") {
            return "For Free / Donation";
        }
        return listing.price_type;
    };

    const reviewsWithViewAll = [...reviews.slice(0, 5), { type: 'view_all' }];

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: colors.background,
                paddingTop: insets.top
            }}
        >
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView
                contentContainerStyle={{ ...styles.scrollContainer, paddingBottom: isOwner ? 0 : 120 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.imageSliderContainer}>
                    <TouchableOpacity
                        style={[
                            styles.headerButton,
                            { top: 10 },
                        ]}
                        onPress={() => router.back()}
                    >
                        <FontAwesome name="arrow-left" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        ref={optionsMenuRef}
                        style={[
                            styles.headerButton,
                            {
                                left: "auto",
                                right: 20,
                                top: 10,
                            },
                        ]}
                        onPress={showMenu}
                    >
                        <FontAwesome name="ellipsis-v" size={22} color="#fff" />
                    </TouchableOpacity>
                    {listing.image_urls && listing.image_urls.length > 0 ? (
                        <>
                            <FlatList
                                data={listing.image_urls.map((uri: string) => ({ uri }))}
                                renderItem={({ item, index }) => (
                                    <Pressable onPress={() => openImageViewer(index)}>
                                        <Image source={item} style={styles.image} />
                                    </Pressable>
                                )}
                                keyExtractor={(item, index) => `${item.uri}-${index}`}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onViewableItemsChanged={onViewableImagesChanged}
                                viewabilityConfig={viewabilityConfig}
                            />
                            <PaginationDots
                                data={listing.image_urls}
                                activeIndex={imageActiveIndex}
                                type="image"
                            />
                            <View style={styles.viewCountBadge}>
                                <FontAwesome name="eye" size={14} color="#fff" />
                                <Text style={styles.viewCountText}>
                                    {listing.view_count || 0} views
                                </Text>
                            </View>
                        </>
                    ) : (
                        <Image
                            source={{ uri: "https://via.placeholder.com/400  " }}
                            style={styles.image}
                        />
                    )}
                </View>
                <View style={[styles.contentCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.priceTag, { backgroundColor: colors.primary }]}>
                        <Text style={styles.priceTagText}>{displayPriceText()}</Text>
                    </View>
                    <Text style={[styles.itemName, { color: colors.text }]}>
                        {listing.item_name}
                    </Text>
                    <TouchableOpacity
                        style={styles.sellerInfoContainer}
                        onPress={() => handleSellerPress(listing.user_id)}
                    >
                        <Image source={{ uri: sellerAvatar }} style={styles.sellerAvatar} />
                        <View style={styles.sellerTextContainer}>
                            <Text style={[styles.soldByText, { color: colors.text }]}>
                                Listed by
                            </Text>
                            <Text style={[styles.sellerName, { color: colors.text }]}>
                                {sellerName}
                            </Text>
                        </View>
                        <FontAwesome
                            name="chevron-right"
                            size={16}
                            color={colors.text}
                            style={{ opacity: 0.6 }}
                        />
                    </TouchableOpacity>
                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>
                            Description
                        </Text>
                        <Text style={[styles.description, { color: colors.text }]}>
                            {listing.description}
                        </Text>
                    </View>
                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>
                            Details
                        </Text>
                        <View style={styles.detailItem}>
                            <FontAwesome name="check-circle-o" size={18} color={colors.primary} />
                            <View style={styles.detailTextContainer}>
                                <Text style={[styles.detailLabel, { color: colors.text }]}>
                                    Condition
                                </Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {listing.is_new ? "New" : "Used"}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.detailItem}>
                            <FontAwesome name="folder-o" size={18} color={colors.primary} />
                            <View style={styles.detailTextContainer}>
                                <Text style={[styles.detailLabel, { color: colors.text }]}>
                                    Categories
                                </Text>
                                <View style={styles.categoryContainer}>
                                    {listing.categories.map((category: string, index: number) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.categoryPill,
                                                { backgroundColor: colors.primary + "22" },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.categoryText,
                                                    { color: colors.primary },
                                                ]}
                                            >
                                                {category}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                        {listing.dynamic_fields &&
                            Object.entries(listing.dynamic_fields).map(([key, value]) => (
                                <View style={styles.detailItem} key={key}>
                                    <FontAwesome name="info-circle" size={18} color={colors.primary} />
                                    <View style={styles.detailTextContainer}>
                                        <Text style={[styles.detailLabel, { color: colors.text }]}>
                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </Text>
                                        <View style={styles.categoryContainer}>
                                            {value.split(",").map((item, index) => (
                                                <View
                                                    key={index}
                                                    style={[
                                                        styles.categoryPill,
                                                        { backgroundColor: colors.primary + "22" },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.categoryText,
                                                            { color: colors.primary },
                                                        ]}
                                                    >
                                                        {item.trim()}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            ))}
                        <View style={styles.detailItem}>
                            <FontAwesome
                                name="handshake-o"
                                size={18}
                                color={colors.primary}
                            />
                            <View style={styles.detailTextContainer}>
                                <Text style={[styles.detailLabel, { color: colors.text }]}>
                                    Deal Method
                                </Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {listing.deal_method}
                                </Text>
                            </View>
                        </View>
                        {listing.meetup_info && (
                            <View style={styles.detailItem}>
                                <FontAwesome name="map-marker" size={18} color={colors.primary} />
                                <View style={styles.detailTextContainer}>
                                    <Text style={[styles.detailLabel, { color: colors.text }]}>
                                        Preferred Meet-up Location
                                    </Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>
                                        {listing.meetup_info}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                    {reviews.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionHeader, { color: colors.text }]}>
                                Reviews for {sellerName}
                            </Text>
                            <View style={styles.reviewSummaryContainer}>
                                <View style={styles.reviewSummaryItem}>
                                    <Text
                                        style={[
                                            styles.reviewSummaryValue,
                                            { color: colors.primary },
                                        ]}
                                    >
                                        {positiveFeedbackPercentage}
                                    </Text>
                                    <Text style={styles.reviewSummaryLabel}>Positive</Text>
                                </View>
                                <View style={styles.reviewSummaryItem}>
                                    <Text
                                        style={[
                                            styles.reviewSummaryValue,
                                            { color: colors.primary },
                                        ]}
                                    >
                                        {averageRating}
                                    </Text>
                                    <Text style={styles.reviewSummaryLabel}>Avg. Rating</Text>
                                </View>
                                <View style={styles.reviewSummaryItem}>
                                    <Text
                                        style={[
                                            styles.reviewSummaryValue,
                                            { color: colors.primary },
                                        ]}
                                    >
                                        {totalReviews}
                                    </Text>
                                    <Text style={styles.reviewSummaryLabel}>Total Reviews</Text>
                                </View>
                            </View>
                            <FlatList
                                data={reviewsWithViewAll}
                                renderItem={({ item }) => {
                                    if ('type' in item && item.type === 'view_all') {
                                        return (
                                            <TouchableOpacity
                                                style={[
                                                    styles.viewAllReviewsButton,
                                                    { width: width - 80, backgroundColor: colors.card, borderColor: colors.border },
                                                ]}
                                                onPress={() =>
                                                    router.push({
                                                        pathname: "/user/[id]",
                                                        params: {
                                                            id: listing.user_id,
                                                            openReviews: "true",
                                                        },
                                                    })
                                                }
                                            >
                                                <Text
                                                    style={[
                                                        styles.viewAllReviewsText,
                                                        { color: colors.primary },
                                                    ]}
                                                >
                                                    View All Reviews
                                                </Text>
                                                <FontAwesome
                                                    name="arrow-right"
                                                    size={14}
                                                    color={colors.primary}
                                                />
                                            </TouchableOpacity>
                                        );
                                    }
                                    return <ReviewCard review={item as Review} cardWidth={width - 80} />;
                                }}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => 'id' in item ? item.id.toString() : 'view_all'}
                                onViewableItemsChanged={onViewableReviewsChanged}
                                viewabilityConfig={viewabilityConfig}
                                contentContainerStyle={styles.reviewSliderContainer}
                            />
                            <PaginationDots
                                data={reviews.slice(0, 5)}
                                activeIndex={reviewActiveIndex}
                                type="review"
                            />
                        </View>
                    )}
                </View>
            </ScrollView>
            {!isOwner && (
                <View style={[styles.footer, { paddingBottom: insets.bottom + 15 }]}>
                    <TouchableOpacity
                        onPress={handleToggleFavorite}
                        disabled={favoriteLoading}
                        style={styles.footerLikeButton}
                    >
                        <FontAwesome
                            name={isFavorited ? "heart" : "heart-o"}
                            size={26}
                            color={isFavorited ? colors.primary : colors.text}
                        />
                        <Text
                            style={[styles.footerLikeCountText, { color: colors.text }]}
                        >
                            {favoriteCount}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.footerActionButtons}>
                        {listing.price_type === "For Sale" && (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.buyButton]}
                                    onPress={handleBuyNowPress}
                                >
                                    <Text style={styles.buttonText}>Buy Now</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.messageButton]}
                                    onPress={handleStartChat}
                                    disabled={chatLoading}
                                >
                                    {chatLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Message</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                        {listing.price_type === "For Trade" && (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.messageButton]}
                                    onPress={handleStartChat}
                                    disabled={chatLoading}
                                >
                                    {chatLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Message</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.tradeButton]}
                                    onPress={() => requireLogin(() => dispatch({ type: "TOGGLE_BARTER_MODAL" }))}
                                >
                                    <Text style={styles.buttonText}>Propose Trade</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        {listing.price_type === "For Free" && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.requestButton]}
                                onPress={() => requireLogin(() => dispatch({ type: "TOGGLE_REQUEST_MODAL" }))}
                            >
                                <Text style={styles.buttonText}>Request Item</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {isImageViewerVisible && (
                <View style={styles.zoomImageViewerOverlay}>
                    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
                        <Gallery
                            data={listing?.image_urls || []}
                            initialIndex={imageViewerIndex}
                            keyExtractor={(item, index) => `${item}-${index}`}
                            renderItem={(item, index) => <GalleryImage uri={item} />}
                        />
                    </SafeAreaView>
                    <TouchableOpacity
                        style={[styles.zoomCloseButton, { top: insets.top + 10 }]}
                        onPress={() => dispatch({ type: "TOGGLE_IMAGE_VIEWER" })}
                    >
                        <FontAwesome name="times" size={30} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}

            {session?.user && (
                <BarterOfferModal
                    visible={isBarterModalVisible}
                    onClose={() => dispatch({ type: "TOGGLE_BARTER_MODAL" })}
                    userId={session.user.id}
                    onSubmit={handleSubmitBarter}
                    targetItemName={listing.item_name}
                />
            )}
            <RequestItemModal
                visible={isRequestModalVisible}
                onClose={() => dispatch({ type: "TOGGLE_REQUEST_MODAL" })}
                itemName={listing.item_name}
                onSubmit={handleRequestSubmit}
            />
            {listing.price != null && (
                <MakeOfferModal
                    visible={isOfferModalVisible}
                    onClose={() => dispatch({ type: "TOGGLE_OFFER_MODAL" })}
                    listingPrice={listing.price}
                    itemName={listing.item_name}
                    onSubmit={handleOfferSubmit}
                />
            )}
            <SuccessModal
                visible={offerSentModalVisible}
                onClose={() => dispatch({ type: "TOGGLE_OFFER_SENT_MODAL" })}
                onAction={handleViewMyTrades}
                title="Offer Sent!"
                message="Your trade proposal has been successfully sent."
                actionText="My Trades"
                closeText="Okay"
            />
            <TradesModal
                visible={tradesModalVisible}
                onClose={() => dispatch({ type: "TOGGLE_TRADES_MODAL" })}
            />
            <ConfirmationModal
                {...confirmationModalConfig}
                onCancel={() => dispatch({ type: "HIDE_CONFIRMATION_MODAL" })}
            />
            <PaymentChoiceModal
                visible={isPaymentChoiceModalVisible}
                onClose={() => dispatch({ type: 'TOGGLE_PAYMENT_CHOICE_MODAL' })}
                onSelectDigital={() => {
                    dispatch({ type: 'TOGGLE_PAYMENT_CHOICE_MODAL' });
                    setPaymentModalVisible(true);
                }}
                onSelectCOD={() => {
                    dispatch({ type: 'TOGGLE_PAYMENT_CHOICE_MODAL' });
                    handleCodOrder();
                }}
            />
            <PaymentModal
                visible={paymentModalVisible}
                onClose={() => setPaymentModalVisible(false)}
                paymentAccounts={sellerPaymentAccounts}
                amount={listing.price || 0}
                onPaymentAttempt={handlePaymentAttempt}
            />
            <ItemOptionsMenu
                visible={isMenuVisible}
                onClose={() => dispatch({ type: "TOGGLE_MENU" })}
                options={getMenuOptions()}
                position={menuPosition}
            />
            {session?.user && listing && (
                // --- CORRECTED COMPONENT AND PROPS ---
                <ThriftShareReport
                    visible={isReportModalVisible}
                    onClose={() => dispatch({ type: "TOGGLE_REPORT_MODAL" })}
                    listingId={listing.id}
                    reporterId={session.user.id}
                    reporterUsername={session?.user?.user_metadata?.username || 'Anonymous'}
                />
            )}
            {session?.user && listing && selectedPaymentMethod && (
                <ProofOfPaymentModal
                    visible={isProofOfPaymentModalVisible}
                    onClose={() => dispatch({ type: "TOGGLE_PROOF_OF_PAYMENT_MODAL" })}
                    listingId={listing.id}
                    sellerId={listing.user_id}
                    amount={listing.price || 0}
                    paymentMethod={selectedPaymentMethod}
                    onSubmissionSuccess={() => {
                        dispatch({ type: "TOGGLE_PROOF_OF_PAYMENT_MODAL" });
                        router.push('/(tabs)/me');
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: "center", alignItems: "center" },
    errorText: { fontSize: 18 },
    scrollContainer: { paddingBottom: 120 },
    imageSliderContainer: {
        position: "relative",
        height: width,
        backgroundColor: "#f0f0f0",
    },
    image: { width: width, height: width, resizeMode: "cover" },
    headerButton: {
        position: "absolute",
        left: 20,
        backgroundColor: "rgba(0,0,0,0.4)",
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    viewCountBadge: {
        position: "absolute",
        bottom: 15,
        left: 15,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: 15,
        paddingHorizontal: 12,
        paddingVertical: 6,
        zIndex: 10,
    },
    viewCountText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 5,
    },
    contentCard: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -25,
        paddingHorizontal: 25,
        paddingTop: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 5,
    },
    priceTag: {
        position: "absolute",
        top: -20,
        right: 24,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        zIndex: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    priceTagText: { color: "#fff", fontWeight: "700", fontSize: 18 },
    itemName: {
        fontSize: 26,
        fontWeight: "800",
        marginBottom: 12,
        lineHeight: 32,
    },
    sellerInfoContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.08)",
        marginBottom: 24,
    },
    sellerAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
    sellerTextContainer: { flex: 1 },
    soldByText: { fontSize: 14, opacity: 0.7, marginBottom: 2 },
    sellerName: { fontSize: 17, fontWeight: "600" },
    section: { marginBottom: 28 },
    sectionHeader: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    description: { fontSize: 16, lineHeight: 24, opacity: 0.9 },
    detailItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    detailTextContainer: { flex: 1, marginLeft: 12 },
    detailLabel: { fontSize: 16, opacity: 0.9, marginBottom: 4 },
    detailValue: { fontSize: 16, fontWeight: "600" },
    categoryContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 8,
    },
    categoryPill: {
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    categoryText: { fontSize: 14, fontWeight: "500" },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        paddingHorizontal: 15,
        paddingTop: 15, // Changed from paddingVertical
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(0,0,0,0.1)",
        gap: 15,
        alignItems: "center",
    },
    footerLikeButton: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 10,
    },
    footerLikeCountText: { fontSize: 12, fontWeight: "600", marginTop: 2 },
    footerActionButtons: { flex: 1, flexDirection: "row", gap: 10 },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    messageButton: { backgroundColor: "#4A5568" },
    buyButton: { backgroundColor: "#A9CF38" },
    tradeButton: { backgroundColor: "#dd8c47" },
    requestButton: { backgroundColor: "#2ECC40" },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    modalBackdrop: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    ownerModalContainer: {
        margin: 10,
        marginBottom: Platform.OS === "ios" ? 30 : 10,
        borderRadius: 14,
        overflow: "hidden",
    },
    ownerModalAction: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    ownerModalActionText: { fontSize: 17, fontWeight: "500", marginLeft: 15 },
    reviewSliderContainer: { paddingVertical: 8, paddingLeft: 20, paddingRight: 10 },
    reviewSlide: {
        borderRadius: 24,
        padding: 20,
        justifyContent: "space-between",
        borderWidth: 1,
        marginRight: 15,
        minHeight: 220,
    },
    reviewHeader: { flexDirection: "row", alignItems: "center" },
    reviewerAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 15 },
    reviewHeaderText: { flex: 1, gap: 4 },
    reviewerName: { fontSize: 17, fontWeight: "700" },
    reviewTimestamp: { fontSize: 13, opacity: 0.7, },
    starRatingContainer: { flexDirection: "row", marginTop: 'auto', paddingTop: 12 },
    reviewComment: {
        fontSize: 16,
        lineHeight: 24,
        fontStyle: "italic",
        opacity: 0.9,
        marginTop: 12
    },
    imagePaginationContainer: {
        position: 'absolute',
        top: 50, // Position it from the top
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        zIndex: 10,
    },
    reviewPaginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 15,
    },
    paginationDot: { height: 8, borderRadius: 4 },
    reviewSummaryContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    reviewSummaryItem: {
        alignItems: "center",
    },
    reviewSummaryValue: {
        fontSize: 20,
        fontWeight: "bold",
    },
    reviewSummaryLabel: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
    },
    viewAllReviewsButton: {
        height: 220,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: "dashed",
        marginRight: 15,
        gap: 10,
    },
    viewAllReviewsText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    zoomImageViewerOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#000",
        zIndex: 999,
    },
    zoomCloseButton: {
        position: 'absolute',
        right: 20,
        zIndex: 1000,
        padding: 10,
    },
});