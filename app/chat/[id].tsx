// sdaw/app/chat/[id].tsx
import { FontAwesome } from '@expo/vector-icons';
import { useIsFocused, useTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Keyboard,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gallery, fitContainer } from 'react-native-zoom-toolkit';
import { ActionCard } from '../../components/chat/ActionCard';
import { useAuth } from '../../components/context/AuthContext';
import { useCallStore } from '../../components/context/callStore';
import { SavedRepliesModal, SavedReply } from '../../components/modals/SavedRepliesModal';
import { supabase } from '../../supabase';
import { Message } from '../../types/chat';


type UserProfile = {
    id: string;
    fullName: string;
    profilePhotoUrl: string;
};

type ChatListItem = {
    type: 'message';
    message: Message;
} | {
    type: 'date_separator';
    date: string;
} | {
    type: 'time_separator';
    time: string;
};

type ConversationDetails = {
    id: number;
    participant_ids: string[];
    participant_unread_counts: { [key: string]: number };
    last_message_at: string;
};

type UploadStatus = 'uploading' | 'uploaded' | 'error';

const { width } = Dimensions.get('window');
const MAX_IMAGE_WIDTH = width * 0.5;
const HEADER_HEIGHT = 60;

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


const ChatMessageImage = ({ uri, onOpenImageViewer }: { uri: string, onOpenImageViewer: (uri: string) => void }) => {
    const [dimensions, setDimensions] = useState<{ width: number, height: number } | null>(null);

    useEffect(() => {
        let isMounted = true;
        if (uri && !uri.startsWith('file:')) {
            Image.getSize(uri, (originalWidth, originalHeight) => {
                if (!isMounted) return;
                const aspectRatio = originalWidth / originalHeight;
                let finalWidth = Math.min(originalWidth, MAX_IMAGE_WIDTH);
                let finalHeight = finalWidth / aspectRatio;
                setDimensions({ width: finalWidth, height: finalHeight });
            }, () => {
                setDimensions({ width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_WIDTH });
            });
        } else {
            setDimensions({ width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_WIDTH });
        }
        return () => { isMounted = false; };
    }, [uri]);

    if (!dimensions) {
        return <View style={{ width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_WIDTH, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>;
    }

    return (
        <TouchableOpacity onPress={() => onOpenImageViewer(uri)}>
            <Image source={{ uri }} style={{ width: dimensions.width, height: dimensions.height, borderRadius: 16, resizeMode: 'contain' }} />
        </TouchableOpacity>
    );
};

const MemoizedChatItem = React.memo(({ item, isLastInBlock, currentUserId, recipientProfile, onOpenImageViewer, isStatusVisible, isLatestMessage, uploadStatus, onToggleStatusVisibility, onRespond, onDelete }: {
    item: ChatListItem;
    isLastInBlock: boolean;
    currentUserId: string | null;
    recipientProfile: UserProfile | null;
    onOpenImageViewer: (url: string) => void;
    isStatusVisible: boolean;
    isLatestMessage: boolean;
    uploadStatus?: UploadStatus;
    onToggleStatusVisibility: () => void;
    onRespond: (message: Message, response: 'accepted' | 'declined') => Promise<void>;
    onDelete: (message: Message) => void;
}) => {
    const { colors } = useTheme();

    if (item.type === 'date_separator') {
        const date = new Date(item.date);
        const dateText = date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
        return <View style={styles.dateSeparator}><Text style={[styles.dateSeparatorText, { color: colors.text + '99' }]}>{dateText}</Text></View>;
    }

    if (item.type === 'time_separator') {
        return <View style={styles.timeSeparator}><Text style={[styles.timeSeparatorText, { color: colors.text + '99' }]}>{item.time}</Text></View>;
    }

    const message = item.message;
    const isMyMessage = message.sender_id === currentUserId;
    const isSeen = !!message.read_at;
    const statusText = isSeen ? 'Seen' : 'Sent';
    const statusColor = isSeen ? colors.primary : colors.text + '80';
    const isActionCard = ['offer', 'trade_proposal', 'item_request'].includes(message.message_type);

    if (message.message_type === 'deleted') {
        return (
            <View style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.theirMessageRow]}>
                {!isMyMessage && <View style={styles.avatarContainer}>{isLastInBlock && recipientProfile && <Image source={{ uri: recipientProfile.profilePhotoUrl }} style={styles.avatar} />}</View>}
                <View style={[styles.messageBubble, styles.deletedMessageBubble, !isMyMessage && { backgroundColor: colors.card }]}>
                    <Text style={styles.deletedMessageText}>
                        🗑️ {isMyMessage ? "You deleted this message" : "This message was deleted"}
                    </Text>
                </View>
            </View>
        );
    }
    
    if (message.message_type === 'missed_call' && message.metadata) {
        const { callType, callerId } = message.metadata;
        const callTypeText = callType === 'video' ? 'video call' : 'voice call';
        let missedCallText = '';

        if (currentUserId === callerId) {
            missedCallText = `You missed a ${callTypeText} with ${recipientProfile?.fullName || 'the user'}.`;
        } else {
            missedCallText = `You missed a ${callTypeText} from ${recipientProfile?.fullName || 'the user'}.`;
        }

        return (
            <View style={styles.systemMessageContainer}>
                <FontAwesome name={callType === 'video' ? 'video-camera' : 'phone'} size={14} color={colors.text + '99'} />
                <Text style={[styles.systemMessageText, { color: colors.text + '99' }]}>
                    {missedCallText}
                </Text>
            </View>
        );
    }

    if (message.message_type === 'system') {
        return (
            <View style={styles.systemMessageContainer}>
                <Text style={[styles.systemMessageText, { color: colors.text + '99' }]}>
                    {message.message_text}
                </Text>
            </View>
        );
    }

    const messageContent = () => {
        switch (message.message_type) {
            case 'image':
                return (
                    <View>
                        <ChatMessageImage uri={message.image_url!} onOpenImageViewer={onOpenImageViewer} />
                        {uploadStatus === 'uploading' && <View style={styles.imageLoadingOverlay}><ActivityIndicator color="#FFF" /></View>}
                    </View>
                );
            case 'offer':
            case 'trade_proposal':
            case 'item_request':
                return <ActionCard message={message} currentUserId={currentUserId} onRespond={onRespond} />;
            case 'text':
            default:
                return <Text style={[styles.messageText, { color: isMyMessage ? '#fff' : colors.text }]}>{message.message_text}</Text>;
        }
    };

    const seenIndicator = () => {
        if (isSeen && recipientProfile) {
            return <Image source={{ uri: recipientProfile.profilePhotoUrl }} style={styles.seenAvatar} />;
        }
        return <Text style={[styles.timestamp, { color: statusColor, fontSize: 11 }]}>{statusText}</Text>;
    };
    
    const handleLongPress = () => {
        if (isMyMessage && (message.message_type === 'text' || message.message_type === 'image')) {
            Alert.alert(
                "Delete Message",
                "Are you sure you want to delete this message? This cannot be undone.",
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Delete for Everyone", 
                        style: "destructive", 
                        onPress: () => onDelete(message) 
                    }
                ],
                { cancelable: true }
            );
        }
    };

    return (
        <Pressable 
            onPress={isMyMessage ? onToggleStatusVisibility : undefined}
            onLongPress={handleLongPress}
            delayLongPress={200}
        >
            <View style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.theirMessageRow]}>
                {!isMyMessage && <View style={styles.avatarContainer}>{isLastInBlock && recipientProfile && <Image source={{ uri: recipientProfile.profilePhotoUrl }} style={styles.avatar} />}</View>}
                <View style={[
                    isActionCard ? styles.actionCardBubble : (message.message_type === 'text' ? styles.messageBubble : styles.imageBubble),
                    isMyMessage && message.message_type === 'text' && { backgroundColor: colors.primary },
                    !isMyMessage && message.message_type === 'text' && { backgroundColor: colors.card },
                ]}>
                    {messageContent()}
                </View>
            </View>
            {isMyMessage && (isLatestMessage || isStatusVisible) && <View style={[styles.receiptRow, styles.myReceiptRow]}>{seenIndicator()}</View>}
        </Pressable>
    );
});

export default function ChatScreen() {
    const { id: conversationId, recipientName } = useLocalSearchParams<{ id: string; recipientName: string }>();
    const { colors } = useTheme();
    const navigation = useNavigation();
    const router = useRouter();
    const isFocused = useIsFocused();
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();
    
    const { user } = useAuth();
    const { initCallListener } = useCallStore(state => state.actions);

const bottomPadding = useSharedValue(0);
useEffect(() => {
    const showSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
        // Add a duration for a smoother animation
        bottomPadding.value = withTiming(e.endCoordinates.height, { duration: 250 });
    });
    const hideSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
        // Add the same duration for consistency
        bottomPadding.value = withTiming(0, { duration: 250 });
    });

    return () => {
        showSubscription.remove();
        hideSubscription.remove();
    };
}, [insets.bottom]);

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            paddingBottom: bottomPadding.value,
        };
    });


    useEffect(() => {
        if (isFocused && user) {
            initCallListener(user.id);
        }
    }, [isFocused, user, initCallListener]);


    const [chatListData, setChatListData] = useState<ChatListItem[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [recipientProfile, setRecipientProfile] = useState<UserProfile | null>(null);
    const [conversationDetails, setConversationDetails] = useState<ConversationDetails | null>(null);
    const [recipientPresence, setRecipientPresence] = useState<{ online_at: string } | null>(null);
    const [isRecipientTyping, setIsRecipientTyping] = useState(false);
    const typingTimeout = useRef<any>(null);
    const [statusVisibleFor, setStatusVisibleFor] = useState<string | number | null>(null);
    const statusTimeoutRef = useRef<any>(null);
    const [isImageViewerVisible, setImageViewerVisible] = useState(false);
    const [viewerImages, setViewerImages] = useState<string[]>([]);
    const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
    const [imageUploadStatus, setImageUploadStatus] = useState<Map<string, UploadStatus>>(new Map());
    const [savedRepliesModalVisible, setSavedRepliesModalVisible] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allReplies, setAllReplies] = useState<SavedReply[]>([]);
    const [filteredReplies, setFilteredReplies] = useState<SavedReply[]>([]);

    const processMessages = (messages: Message[]): ChatListItem[] => {
        if (messages.length === 0) return [];
        const listItems: ChatListItem[] = [];
        let lastDate: string | null = null;
        let lastMinute: string | null = null;
        messages.forEach(message => {
            const messageDate = new Date(message.created_at);
            const dateString = messageDate.toDateString();
            const timeString = messageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            if (dateString !== lastDate) {
                listItems.push({ type: 'date_separator', date: message.created_at });
                lastDate = dateString;
                lastMinute = null;
            }
            if (timeString !== lastMinute) {
                listItems.push({ type: 'time_separator', time: timeString });
                lastMinute = timeString;
            }
            listItems.push({ type: 'message', message });
        });
        return listItems.reverse();
    };

    const fetchAndDisplayMessages = useCallback(async () => {
        if (!conversationId) return;
        const { data: messageData, error } = await supabase.from('messages').select('*, metadata').eq('conversation_id', conversationId).order('created_at', { ascending: true });
        if (error) {
            console.error('Error fetching messages:', error);
            Alert.alert("Error", "Could not fetch messages.");
        } else {
            setChatListData(processMessages(messageData as Message[] || []));
        }
    }, [conversationId]);

    const markConversationAsRead = useCallback(async (convoDetails: ConversationDetails, currentUserId: string) => {
        if (!convoDetails || !currentUserId) return;
        const recipientId = convoDetails.participant_ids.find(id => id !== currentUserId);
        if (!recipientId) return;
        await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', convoDetails.id).eq('sender_id', recipientId).is('read_at', null);
        if ((convoDetails.participant_unread_counts?.[currentUserId] || 0) > 0) {
            const newUnreadCounts = { ...convoDetails.participant_unread_counts, [currentUserId]: 0 };
            await supabase.from('conversations').update({ participant_unread_counts: newUnreadCounts }).eq('id', convoDetails.id);
        }
    }, []);

    useEffect(() => { if (isFocused && userId && conversationDetails) markConversationAsRead(conversationDetails, userId); }, [isFocused, userId, conversationDetails, markConversationAsRead]);

    useEffect(() => {
        const getInitialData = async () => {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const currentUserId = session.user.id;
                setUserId(currentUserId);
                const { data: convoData } = await supabase.from('conversations').select('*').eq('id', conversationId).single();
                if (convoData) {
                    setConversationDetails(convoData as ConversationDetails);
                    const recipientId = convoData.participant_ids.find((pId: string) => pId !== currentUserId);
                    if (recipientId) { const { data: profileData } = await supabase.from('users').select('*, profilePhotoUrl').eq('id', recipientId).single(); setRecipientProfile(profileData); }
                    await fetchAndDisplayMessages();
                    const { data: repliesData } = await supabase.from('saved_replies').select('*').eq('user_id', currentUserId);
                    if (repliesData) setAllReplies(repliesData);
                }
            }
            setLoading(false);
        };
        getInitialData();
    }, [conversationId, fetchAndDisplayMessages]);
    
    useEffect(() => {
        if (!userId || !conversationDetails) return;

        const handleNewMessage = (newMessagePayload: Message) => {
            setChatListData(prevData => {
                const messageExists = prevData.some(item =>
                    item.type === 'message' &&
                    ((item.message.temp_id && item.message.temp_id === newMessagePayload.temp_id) || item.message.id === newMessagePayload.id)
                );
        
                if (messageExists) {
                    return prevData.map(item =>
                        (item.type === 'message' && item.message.temp_id === newMessagePayload.temp_id)
                            ? { type: 'message', message: newMessagePayload }
                            : item
                    );
                } else {
                    const lastItem = prevData[0];
                    const newItems: ChatListItem[] = [];
                    const newMessageDate = new Date(newMessagePayload.created_at);
            
                    if (lastItem?.type === 'message') {
                        const lastMessageDate = new Date(lastItem.message.created_at);
                        if (lastMessageDate.toDateString() !== newMessageDate.toDateString()) {
                            newItems.push({ type: 'date_separator', date: newMessagePayload.created_at });
                        }
                        const lastMessageTime = lastMessageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                        const newMessageTime = newMessageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                        if (lastMessageTime !== newMessageTime) {
                            newItems.push({ type: 'time_separator', time: newMessageTime });
                        }
                    } else {
                        newItems.push({ type: 'date_separator', date: newMessagePayload.created_at });
                        newItems.push({ type: 'time_separator', time: newMessageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) });
                    }
            
                    newItems.push({ type: 'message', message: newMessagePayload });
                    return [...newItems, ...prevData];
                }
            });
        
            if (isFocused && newMessagePayload.sender_id !== userId) {
                markConversationAsRead(conversationDetails, userId);
            }
        };

        const handleUpdatedMessage = (updatedMessagePayload: Message) => setChatListData(prevData => prevData.map(item => (item.type === 'message' && item.message.id === updatedMessagePayload.id) ? { ...item, message: { ...item.message, ...updatedMessagePayload } } : item));

        const messageListener = supabase.channel(`messages_for_${conversationId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => handleNewMessage(payload.new as Message))
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => handleUpdatedMessage(payload.new as Message))
            .subscribe();

        const presenceChannel = supabase.channel(`chat_presence_${conversationId}`, { config: { presence: { key: userId } } });
        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const presenceState = presenceChannel.presenceState<{ online_at: string }>();
                const recipientId = conversationDetails.participant_ids.find(id => id !== userId);
                if (recipientId) setRecipientPresence(presenceState[recipientId]?.[0] || null);
            })
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.senderId !== userId) {
                    setIsRecipientTyping(true);
                    if (typingTimeout.current) clearTimeout(typingTimeout.current);
                    typingTimeout.current = setTimeout(() => setIsRecipientTyping(false), 3000);
                }
            })
            .subscribe(async (status) => { if (status === 'SUBSCRIBED') await presenceChannel.track({ online_at: new Date().toISOString() }); });

        return () => {
            supabase.removeChannel(messageListener);
            supabase.removeChannel(presenceChannel);
        };
    }, [userId, conversationDetails, conversationId, isFocused, markConversationAsRead]);
    
    const handleDeleteMessage = async (messageToDelete: Message) => {
        if (messageToDelete.sender_id !== userId || !conversationDetails) {
            Alert.alert("Error", "You can only delete your own messages.");
            return;
        }

        const { error: updateError } = await supabase
            .from('messages')
            .update({
                message_text: 'This message was deleted.',
                message_type: 'deleted',
                image_url: null,
                metadata: null
            })
            .eq('id', messageToDelete.id);

        if (updateError) {
            console.error("Error deleting message:", updateError);
            Alert.alert("Error", "Could not delete the message. Please try again.");
            return;
        }

        const lastMessageAt = new Date(conversationDetails.last_message_at).getTime();
        const deletedMessageAt = new Date(messageToDelete.created_at).getTime();

        if (deletedMessageAt >= lastMessageAt) {
            const { error: convoUpdateError } = await supabase
                .from('conversations')
                .update({
                    last_message_text: '🗑️ This message was deleted.'
                })
                .eq('id', conversationDetails.id);

            if (convoUpdateError) {
                console.error("Error updating conversation preview:", convoUpdateError);
            }
        }
    };

    const sendSystemMessage = async (text: string) => {
        if (!userId || !conversationId) return;
        const { error: insertError } = await supabase.from('messages').insert({
            conversation_id: Number(conversationId),
            sender_id: userId,
            message_text: text,
            message_type: 'system',
        });

        if (insertError) {
            Alert.alert('Error', 'Could not send the confirmation message.');
            console.error("Error sending system message:", insertError);
        } else {
            await supabase.from('conversations').update({
                last_message_text: text,
                last_message_at: new Date().toISOString()
            }).eq('id', conversationId);
        }
        await fetchAndDisplayMessages();
    };

    const handleActionResponse = async (message: Message, response: 'accepted' | 'declined') => {
        if (!message.metadata || !userId || !conversationId) return;

        const originalMessage = chatListData.find(item => item.type === 'message' && item.message.id === message.id);
        const currentStatus = originalMessage?.type === 'message' && originalMessage.message.metadata?.actionStatus;
        if (currentStatus && currentStatus !== 'pending') {
            Alert.alert("Already Responded", "You have already responded to this action.");
            return;
        }

        const updatedMetadata = { ...message.metadata, actionStatus: response };

        const { error: updateError } = await supabase
            .from('messages')
            .update({ metadata: updatedMetadata })
            .eq('id', message.id);

        if (updateError) {
            Alert.alert('Error', 'Could not respond to the offer. Please try again.');
            console.error("Error updating message status:", updateError);
            return;
        }

        const actionTypeFormatted = message.metadata.actionType.replace('_', ' ');
        const itemName = `"${message.metadata.itemName}"`;

        if (response === 'accepted') {
            await sendSystemMessage(`You accepted the ${actionTypeFormatted} for ${itemName}.`);
        } else {
            Alert.alert(
                "Decline Offer",
                "Would you like to notify the user that you've declined?",
                [
                    { text: "Just Decline", style: 'cancel', onPress: () => fetchAndDisplayMessages() },
                    { text: 'Decline & Notify', style: 'default', onPress: () => sendSystemMessage(`You declined the ${actionTypeFormatted} for ${itemName}.`) }
                ]
            );
        }
    };

    const handleSendText = async () => {
        if (newMessage.trim() === '' || !userId || !conversationDetails) return;
        setSendingMessage(true);
        const messageToSend = newMessage.trim();
        const tempId = `temp_${Date.now()}`;
        const optimisticMessage: Message = { id: Date.now(), temp_id: tempId, created_at: new Date().toISOString(), conversation_id: Number(conversationId), sender_id: userId, message_text: messageToSend, read_at: null, message_type: 'text', image_url: null, metadata: null };
        setShowSuggestions(false);
        setChatListData(prevData => [{ type: 'message', message: optimisticMessage }, ...prevData]);
        setNewMessage('');
        const { error } = await supabase.from('messages').insert({ conversation_id: Number(conversationId), sender_id: userId, message_text: messageToSend, message_type: 'text', temp_id: tempId });
        if (error) {
            Alert.alert("Error", "Failed to send message.");
            setChatListData(prev => prev.filter(item => !(item.type === 'message' && item.message.temp_id === tempId)));
        } else {
            await supabase.from('conversations').update({ last_message_text: messageToSend, last_message_at: new Date().toISOString() }).eq('id', conversationId);
        }
        setSendingMessage(false);
    };

    const handlePickImage = async () => {
        if (isUploadingImage) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera roll access is needed to send images.');
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1, allowsMultipleSelection: true });
        if (!result.canceled && result.assets) handleSendImages(result.assets);
    };

    const handleSendImages = async (images: ImagePicker.ImagePickerAsset[]) => {
        if (!userId || !conversationDetails) return;
        setIsUploadingImage(true);
        for (const image of images) {
            const tempId = `temp_${Date.now()}_${Math.random()}`;
            const optimisticMessage: Message = { id: Date.now(), temp_id: tempId, created_at: new Date().toISOString(), conversation_id: Number(conversationId), sender_id: userId, message_text: '[Image]', read_at: null, message_type: 'image', image_url: image.uri, metadata: null };
            setImageUploadStatus(prev => new Map(prev).set(tempId, 'uploading'));
            setChatListData(prevData => [{ type: 'message', message: optimisticMessage }, ...prevData]);
            try {
                const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer());
                const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg';
                const filePath = `${conversationId}/${userId}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('chat-images').upload(filePath, arraybuffer, { contentType: image.mimeType ?? `image/${fileExt}` });
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('chat-images').getPublicUrl(filePath);
                const publicUrl = data.publicUrl;
                const { error: insertError } = await supabase.from('messages').insert({ conversation_id: Number(conversationId), sender_id: userId, message_text: '[Image]', message_type: 'image', image_url: publicUrl, temp_id: tempId, metadata: null });
                if (insertError) throw insertError;
                setImageUploadStatus(prev => new Map(prev).set(tempId, 'uploaded'));
                await supabase.from('conversations').update({ last_message_text: `[Image]`, last_message_at: new Date().toISOString() }).eq('id', conversationId);
            } catch (error: any) {
                Alert.alert("Error Sending Image", error.message || "An unknown error occurred.");
                setImageUploadStatus(prev => new Map(prev).set(tempId, 'error'));
            }
        }
        setIsUploadingImage(false);
    };

    const handleTyping = (text: string) => {
        setNewMessage(text);
        if (text.startsWith('/')) {
            setShowSuggestions(true);
            const searchTerm = text.substring(1).toLowerCase();
            const filtered = allReplies.filter(reply => reply.short_code.toLowerCase().startsWith(searchTerm));
            setFilteredReplies(filtered);
        } else {
            setShowSuggestions(false);
        }
    };

    const onSelectSuggestion = (reply: SavedReply) => {
        setNewMessage(reply.message);
        setShowSuggestions(false);
        Keyboard.dismiss();
    };

    const initiateCall = async (callType: 'video' | 'voice') => {
        if (!userId || !recipientProfile) {
            Alert.alert("Error", "Cannot initiate call. User data is missing.");
            return;
        }

        try {
            const { data, error } = await supabase
                .from('calls')
                .insert({
                    caller_id: userId,
                    callee_id: recipientProfile.id,
                    status: 'dialing',
                    call_type: callType,
                    conversation_id: Number(conversationId)
                })
                .select()
                .single();

            if (error) throw error;

            router.push({
                pathname: '/call',
                params: {
                    callId: data.id,
                    recipientName: recipientProfile.fullName,
                    recipientAvatar: recipientProfile.profilePhotoUrl,
                    callType: callType,
                    conversationId: conversationId,
                },
            });

        } catch (error: any) {
            console.error("Error initiating call:", error);
            Alert.alert("Call Error", "Could not start the call. Please try again.");
        }
    };


    const openImageViewer = useCallback((tappedImageUrl: string) => {
        const allImageUris = chatListData
            .filter(item => item.type === 'message' && item.message.message_type === 'image' && item.message.image_url)
            .map(item => (item as { type: 'message', message: Message }).message.image_url!)
            .reverse();
    
        const initialIndex = allImageUris.findIndex(uri => uri === tappedImageUrl);
    
        if (initialIndex !== -1) {
            setViewerImages(allImageUris);
            setViewerInitialIndex(initialIndex);
            setImageViewerVisible(true);
        }
    }, [chatListData]);

    const renderItem = useCallback(({ item, index }: { item: ChatListItem, index: number }) => {
        if (item.type === 'message') {
            const currentMessage = item.message;
            const uniqueId = currentMessage.temp_id || currentMessage.id;
            const nextItem = chatListData[index + 1];
            let isLastInBlock = true;
            if (nextItem && nextItem.type === 'message' && nextItem.message.sender_id === currentMessage.sender_id) isLastInBlock = false;
            const isLatestMessage = index === 0;
            return <MemoizedChatItem item={item} isLastInBlock={isLastInBlock} currentUserId={userId} recipientProfile={recipientProfile} onOpenImageViewer={openImageViewer} isStatusVisible={statusVisibleFor === uniqueId} isLatestMessage={isLatestMessage} uploadStatus={currentMessage.temp_id ? imageUploadStatus.get(currentMessage.temp_id) : undefined} onToggleStatusVisibility={() => setStatusVisibleFor(prev => prev === uniqueId ? null : uniqueId)} onRespond={handleActionResponse} onDelete={handleDeleteMessage} />;
        }
        return <MemoizedChatItem item={item} isLastInBlock={false} currentUserId={userId} recipientProfile={null} onOpenImageViewer={() => {}} isStatusVisible={false} isLatestMessage={false} onToggleStatusVisibility={() => {}} onRespond={handleActionResponse} onDelete={handleDeleteMessage}/>;
    }, [userId, recipientProfile, openImageViewer, chatListData, statusVisibleFor, imageUploadStatus, handleActionResponse, handleDeleteMessage]);

    const getStatusText = () => {
        if (isRecipientTyping) return "Typing...";
        if (recipientPresence) return "Online";
        return "Offline";
    };

    if (loading && !conversationDetails) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Animated.View style={[{ flex: 1 }, animatedContainerStyle]}>
                <View style={[styles.customHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><FontAwesome name="chevron-left" size={22} color={colors.primary} /></TouchableOpacity>
                    {recipientProfile && <Image source={{ uri: recipientProfile.profilePhotoUrl }} style={styles.headerAvatar} />}
                    <View style={styles.headerTitleWrapper}>
                        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                            {recipientProfile ? recipientProfile.fullName : recipientName || 'Chat'}
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: isRecipientTyping || recipientPresence ? colors.primary : colors.text + '80' }]} numberOfLines={1}>{getStatusText()}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.headerIcon} onPress={() => initiateCall('voice')}>
                            <FontAwesome name="phone" size={24} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerIcon} onPress={() => initiateCall('video')}>
                            <FontAwesome name="video-camera" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ flex: 1 }}>
                    {showSuggestions && <FlatList data={filteredReplies} keyExtractor={(item) => item.id.toString()} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsContainer} renderItem={({item}) => (<TouchableOpacity style={[styles.suggestionChip, {backgroundColor: colors.card, borderColor: colors.border}]} onPress={() => onSelectSuggestion(item)}><Text style={[styles.suggestionText, {color: colors.primary}]}>/{item.short_code}</Text></TouchableOpacity>)} />}
                    <FlatList
                        ref={flatListRef}
                        data={chatListData}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => {
                            if (item.type === 'message') {
                                return `${item.message.temp_id || item.message.id}-${index}`;
                            }
                            return `${item.type}-${index}`;
                        }}
                        contentContainerStyle={styles.messageList}
                        inverted
                        showsVerticalScrollIndicator={false}
                        windowSize={11}
                        keyboardShouldPersistTaps="handled"
                        onScrollBeginDrag={Keyboard.dismiss}
                    />
                </View>
            
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity style={styles.inputIcon} onPress={() => setSavedRepliesModalVisible(true)}><FontAwesome name="bolt" size={24} color={colors.primary} /></TouchableOpacity>
                    <TouchableOpacity style={styles.inputIcon} onPress={handlePickImage} disabled={isUploadingImage}>{isUploadingImage ? <ActivityIndicator size="small" color={colors.primary} /> : <FontAwesome name="image" size={24} color={colors.primary} />}</TouchableOpacity>
                    <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.background }]} placeholder={loading ? "Connecting..." : "Message..."} placeholderTextColor={colors.text + '80'} value={newMessage} onChangeText={handleTyping} multiline editable={!loading && !sendingMessage && !isUploadingImage} />
                    <TouchableOpacity style={styles.inputIcon} onPress={handleSendText} disabled={loading || sendingMessage || newMessage.trim().length === 0}>{sendingMessage ? <ActivityIndicator size="small" color={colors.primary} /> : <FontAwesome name="paper-plane" size={24} color={colors.primary} />}</TouchableOpacity>
                </View>
            </Animated.View>
            
            <Modal
                visible={isImageViewerVisible}
                transparent={true}
                onRequestClose={() => setImageViewerVisible(false)}
            >
                <View style={styles.zoomableViewerContainer}>
                     <Gallery
                        data={viewerImages}
                        initialIndex={viewerInitialIndex}
                        keyExtractor={(item, index) => `${item}-${index}`}
                        renderItem={(item, index) => <GalleryImage uri={item} />}
                    />
                    <TouchableOpacity 
                        style={[styles.closeButton, { top: insets.top + 10 }]} 
                        onPress={() => setImageViewerVisible(false)}
                    >
                        <FontAwesome name="times" size={30} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Modal>
            <SavedRepliesModal visible={savedRepliesModalVisible} onClose={() => setSavedRepliesModalVisible(false)} onSelectReply={(message) => setNewMessage(message)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: {
        flex: 1,
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        height: HEADER_HEIGHT,
    },
    backButton: { padding: 5, },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, marginLeft: 10, marginRight: 12, },
    headerTitleWrapper: { flex: 1, },
    headerTitle: { fontSize: 17, fontWeight: '600' },
    headerSubtitle: { fontSize: 13, },
    headerRight: { flexDirection: 'row', alignItems: 'center', },
    headerIcon: { padding: 5, marginLeft: 15, },
    dateSeparator: { alignSelf: 'center', marginVertical: 20 },
    dateSeparatorText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
    timeSeparator: { alignSelf: 'center', marginVertical: 10, },
    timeSeparatorText: { fontSize: 12, fontWeight: '500', },
    messageList: { paddingHorizontal: 10, paddingTop: 10, },
    messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 2, },
    myMessageRow: { justifyContent: 'flex-end', },
    theirMessageRow: { justifyContent: 'flex-start', },
    avatarContainer: { width: 34, marginRight: 8, },
    avatar: { width: 30, height: 30, borderRadius: 15, },
    messageBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, maxWidth: width * 0.75 },
    actionCardBubble: { backgroundColor: 'transparent', borderRadius: 20, maxWidth: width * 0.75, padding: 2 },
    imageBubble: { borderRadius: 20, overflow: 'hidden' },
    messageText: { fontSize: 16, lineHeight: 22 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderTopWidth: 1, },
    inputIcon: { paddingHorizontal: 8, },
    input: { flex: 1, borderRadius: 22, paddingHorizontal: 18, paddingVertical: Platform.OS === 'ios' ? 10 : 8, fontSize: 16, maxHeight: 120, },
    receiptRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 8, },
    myReceiptRow: { justifyContent: 'flex-end', paddingRight: 15, },
    timestamp: { fontSize: 12, },
    imageLoadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderRadius: 15, },
    suggestionsContainer: { paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
    suggestionChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, marginRight: 8, },
    suggestionText: { fontWeight: '600' },
    seenAvatar: { width: 16, height: 16, borderRadius: 8, },
    systemMessageContainer: {
        flexDirection: 'row',
        gap: 8,
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        marginVertical: 10,
    },
    systemMessageText: {
        fontSize: 13,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    zoomableViewerContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    closeButton: {
        position: 'absolute',
        right: 20,
        zIndex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deletedMessageBubble: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    deletedMessageText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#757575',
    }
});