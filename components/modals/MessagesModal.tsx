// sdaw/components/modals/MessagesModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Keyboard,
    LayoutAnimation,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { useAuth } from '../context/AuthContext';


type Conversation = {
    id: number;
    created_at: string;
    last_message_text: string | null;
    last_message_at: string;
    participant_ids: string[];
    participant1_last_read_at: string | null;
    participant2_last_read_at: string | null;
    is_archived: boolean;
    participant_unread_counts: { [key: string]: number };
    recipient: { id: string; fullName: string; profilePhotoUrl: string };
    isUnread: boolean;
};

type FilterType = 'All Chats' | 'Unread' | 'Archived';

interface MessagesHeaderProps {
  isSelectionMode: boolean;
  toggleSelectionMode: () => void;
  toggleSearch: () => void;
  onClose: () => void;
  handleSelectAll: () => void;
  isSelectAllActive: boolean;
  handleArchiveAction: (archiveState: boolean) => void;
  handleDeleteSelected: () => void;
  activeFilter: FilterType;
}

const MessagesHeader = ({
  isSelectionMode,
  toggleSelectionMode,
  toggleSearch,
  onClose,
  handleSelectAll,
  isSelectAllActive,
  handleArchiveAction,
  handleDeleteSelected,
  activeFilter,
}: MessagesHeaderProps) => {
    const { colors } = useTheme();
    return (
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
                <TouchableOpacity onPress={toggleSelectionMode} style={styles.headerTouch}>
                    <Text style={[styles.headerButtonText, { color: colors.primary }]}>
                        {isSelectionMode ? 'Cancel' : 'Select'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.headerCenter}>
                {isSelectionMode ? (
                    <TouchableOpacity onPress={handleSelectAll}>
                        <Text style={[styles.headerButtonText, { color: colors.primary, fontWeight: '600' }]}>
                            {isSelectAllActive ? 'Deselect All' : 'Select All'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Messages</Text>
                )}
            </View>

            <View style={styles.headerRight}>
                {isSelectionMode ? (
                    <>
                        {activeFilter === 'Archived' ? (
                            <TouchableOpacity style={styles.actionButton} onPress={() => handleArchiveAction(false)}>
                                <FontAwesome name="folder-open-o" size={22} color={colors.primary} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.actionButton} onPress={() => handleArchiveAction(true)}>
                                <FontAwesome name="archive" size={22} color={colors.primary} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.actionButton} onPress={handleDeleteSelected}>
                            <FontAwesome name="trash-o" size={24} color={'#FF4136'} />
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity style={styles.actionButton} onPress={toggleSearch}>
                            <FontAwesome name="search" size={22} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={onClose}>
                            <FontAwesome name="close" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
};

const SWIPE_THRESHOLD = -80;
const ACTION_BUTTON_WIDTH = 80;

const ConversationItem = React.memo(({
    item,
    onPress,
    isSelectionMode,
    isSelected,
    activeFilter,
    onArchive,
    onUnarchive,
    onDelete,
    onLongPress,
    closeAllOtherSwipeables,
    isSwipeableOpen,
    currentUserId,
}: {
    item: Conversation;
    onPress: (item: Conversation) => void;
    isSelectionMode: boolean;
    isSelected: boolean;
    activeFilter: FilterType;
    onArchive: () => void;
    onUnarchive: () => void;
    onDelete: () => void;
    onLongPress: (event: any) => void;
    closeAllOtherSwipeables: (item: Conversation) => void;
    isSwipeableOpen: boolean;
    currentUserId: string | null;
}) => {
    const { colors } = useTheme();
    const translateX = useSharedValue(0);

    const unreadCount = (currentUserId && item.participant_unread_counts?.[currentUserId]) || 0;
    const isUnread = item.isUnread || unreadCount > 0;

    const handlePress = useCallback(() => {
        onPress(item);
    }, [onPress, item]);

    const handleCloseSwipeable = useCallback(() => {
        closeAllOtherSwipeables(item);
    }, [closeAllOtherSwipeables, item]);

    const tapGesture = Gesture.Tap().onEnd(() => runOnJS(handlePress)());
    const panGesture = Gesture.Pan()
        .onBegin(() => runOnJS(handleCloseSwipeable)())
        .onUpdate((event) => (translateX.value = Math.max(-ACTION_BUTTON_WIDTH * 2, Math.min(0, event.translationX))))
        .onEnd(() => (translateX.value = withSpring(translateX.value < SWIPE_THRESHOLD ? -ACTION_BUTTON_WIDTH * 2 : 0, { damping: 15 })))
        .activeOffsetX([-10, 10]);

    const gesture = Gesture.Exclusive(panGesture, tapGesture);

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

    useEffect(() => {
        if (!isSwipeableOpen) translateX.value = withTiming(0);
    }, [isSwipeableOpen, translateX]);

    const content = (
        <View style={[styles.messageItem, { backgroundColor: isSelected ? colors.primary + '20' : colors.card, borderBottomColor: colors.border }]}>
            <View style={styles.indicatorAndAvatar}>
                <Image source={{ uri: item.recipient.profilePhotoUrl }} style={styles.messageAvatar} />
            </View>
            {isSelectionMode && (
                <View style={styles.checkboxContainer}>
                    <FontAwesome name={isSelected ? "check-circle" : "circle-o"} size={24} color={colors.primary} />
                </View>
            )}
            <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                    <Text style={[styles.messageUserName, { color: colors.text, fontWeight: isUnread ? 'bold' : 'normal' }]} numberOfLines={1}>{item.recipient.fullName}</Text>
                    <Text style={[styles.messageTimestamp, { color: colors.text + '99' }]}>
                        {new Date(item.last_message_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                </View>
                <Text style={[styles.messageText, { color: isUnread ? colors.text : colors.text + '99', fontWeight: isUnread ? '600' : 'normal' }]} numberOfLines={2}>
                    {item.last_message_text || 'No messages yet.'}
                </Text>
            </View>
        </View>
    );

    const canSwipe = !isSelectionMode && Platform.OS === 'ios' && (activeFilter === 'All Chats' || activeFilter === 'Archived');
    
    if (Platform.OS === 'android' && !isSelectionMode) {
      return (
        <TouchableOpacity
          onPress={handlePress}
          onLongPress={onLongPress}
          delayLongPress={500} 
          activeOpacity={0.7}
        >
          {content}
        </TouchableOpacity>
      );
    }
    
    if (!canSwipe) return <TouchableOpacity onPress={handlePress}>{content}</TouchableOpacity>;

    return (
        <View style={{ backgroundColor: colors.background }}>
            <View style={styles.swipeActionContainer}>
                 {activeFilter === 'All Chats' ? (
                    <>
                        <TouchableOpacity style={[styles.swipeButton, { backgroundColor: '#FF4136' }]} onPress={onDelete}>
                            <FontAwesome name="trash-o" size={24} color={colors.card} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.swipeButton, { backgroundColor: '#AAAAAA' }]} onPress={onArchive}>
                             <FontAwesome name="archive" size={24} color={colors.card} />
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                         <TouchableOpacity style={[styles.swipeButton, { backgroundColor: '#FF4136' }]} onPress={onDelete}>
                            <FontAwesome name="trash-o" size={24} color={colors.card} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.swipeButton, { backgroundColor: '#AAAAAA' }]} onPress={onUnarchive}>
                            <FontAwesome name="folder-open-o" size={24} color={colors.card} />
                        </TouchableOpacity>
                    </>
                )}
            </View>
            <GestureDetector gesture={gesture}><Animated.View style={animatedStyle}>{content}</Animated.View></GestureDetector>
        </View>
    );
});


const FilterTabs = ({ activeFilter, setActiveFilter }: { activeFilter: FilterType; setActiveFilter: (filter: FilterType) => void; }) => {
    const { colors } = useTheme();
    const tabs: FilterType[] = ['All Chats', 'Unread', 'Archived'];
    const [layouts, setLayouts] = useState<Record<string, {x: number, width: number}>>({});

    const indicatorStyle = useAnimatedStyle(() => {
        const activeLayout = layouts[activeFilter];
        if (!activeLayout) return { opacity: 0 };
        return {
            transform: [{ translateX: withTiming(activeLayout.x, { duration: 250 }) }],
            width: withTiming(activeLayout.width, { duration: 250 }),
            opacity: withTiming(1)
        };
    });

    return (
        <View style={[styles.filterContainer, { borderBottomColor: colors.border }]}>
            {tabs.map(tab => (
                <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveFilter(tab)}
                    onLayout={(e) => {
                        const { x, width } = e.nativeEvent.layout;
                        setLayouts(prev => ({...prev, [tab]: {x, width}}));
                    }}
                    style={styles.filterTab}
                >
                    <Text style={[styles.filterText, { color: activeFilter === tab ? colors.primary : colors.text+'99' }]}>{tab}</Text>
                </TouchableOpacity>
            ))}
            <Animated.View style={[styles.filterIndicator, { backgroundColor: colors.primary }, indicatorStyle]} />
        </View>
    );
};


export const MessagesModal = ({ visible, onClose }: { visible: boolean, onClose: () => void }) => {
    const { colors } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [allConversations, setAllConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('All Chats');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [openSwipeableId, setOpenSwipeableId] = useState<number | null>(null);

    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        conversation: Conversation | null;
        position: { x: number, y: number }
    }>({ visible: false, conversation: null, position: { x: 0, y: 0 } });

    const fetchAndProcessConversations = useCallback(async () => {
        if (!user) { return; }

        const { data, error } = await supabase
            .from('conversations')
            .select('*, participant_unread_counts, is_archived')
            .contains('participant_ids', [user.id])
            .order('last_message_at', { ascending: false });

        if (error) { console.error("Error fetching conversations", error); return; }

        const conversationsWithDetails = await Promise.all(
            data.map(async (convo) => {
                const recipientId = convo.participant_ids.find((id: string) => id !== user.id);
                if (!recipientId) return null;

                const { data: userData } = await supabase.from('users').select('id, fullName, profilePhotoUrl').eq('id', recipientId).single();
                if (!userData) return null;

                const userUnreadCount = (convo.participant_unread_counts && convo.participant_unread_counts[user.id]) || 0;

                return { ...convo, recipient: userData, isUnread: userUnreadCount > 0 };
            })
        );

        const validConversations = conversationsWithDetails.filter(c => c !== null) as Conversation[];
        setAllConversations(validConversations);
    }, [user]);

    useEffect(() => {
        if (!visible || !user) return;

        setLoading(true);
        fetchAndProcessConversations().finally(() => setLoading(false));

        const channel = supabase
            .channel('public:conversations')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'conversations' },
                () => {
                    fetchAndProcessConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [visible, user, fetchAndProcessConversations]);


    useEffect(() => {
        if (!visible || !user) return;

        const handleNewMessage = (payload: any) => {
            const newMessage = payload.new;

            if (newMessage.sender_id === user.id) {
                return;
            }

            setAllConversations(prevConvos => {
                const convoIndex = prevConvos.findIndex(c => c.id === newMessage.conversation_id);

                if (convoIndex === -1) {
                    fetchAndProcessConversations();
                    return prevConvos;
                }

                const updatedConvos = [...prevConvos];
                const convoToUpdate = { ...updatedConvos[convoIndex] };

                convoToUpdate.isUnread = true;
                convoToUpdate.last_message_text = newMessage.message_text;
                convoToUpdate.last_message_at = newMessage.created_at;

                updatedConvos.splice(convoIndex, 1);
                updatedConvos.unshift(convoToUpdate);

                return updatedConvos;
            });
        };

        const messageListener = supabase.channel('public:messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, handleNewMessage)
            .subscribe();

        return () => {
            supabase.removeChannel(messageListener);
        };

    }, [visible, user, fetchAndProcessConversations]);

    const filteredConversations = useMemo(() => {
        let result = allConversations;

        if (activeFilter === 'Unread') {
            result = result.filter(c => c.isUnread && !c.is_archived);
        } else if (activeFilter === 'Archived') {
            result = result.filter(c => c.is_archived);
        } else {
            result = result.filter(c => !c.is_archived);
        }

        if (searchQuery.trim()) {
            const lowercasedQuery = searchQuery.toLowerCase();
            result = result.filter((c: Conversation) =>
                c.recipient.fullName.toLowerCase().includes(lowercasedQuery)
            );
        }
        return result;
    }, [allConversations, activeFilter, searchQuery]);


    const handleCloseModal = useCallback(() => {
      Keyboard.dismiss();
      onClose();
    }, [onClose]);

    const handleSingleAction = useCallback((action: 'unarchive' | 'delete' | 'archive', convo: Conversation) => async () => {
        if (!convo) return;
        setOpenSwipeableId(null);
        setContextMenu({ visible: false, conversation: null, position: { x: 0, y: 0 } });
        if (action === 'archive') {
            const { error } = await supabase.from('conversations').update({ is_archived: true }).eq('id', convo.id);
            if (error) Alert.alert("Error", `Could not archive conversation.`);
            else setAllConversations(prev => prev.map(c => c.id === convo.id ? { ...c, is_archived: true } : c));
        }
        if (action === 'unarchive') {
            const { error } = await supabase.from('conversations').update({ is_archived: false }).eq('id', convo.id);
            if (error) Alert.alert("Error", `Could not unarchive conversation.`);
            else setAllConversations(prev => prev.map(c => c.id === convo.id ? { ...c, is_archived: false } : c));
        }
        if (action === 'delete') {
            Alert.alert(
                "Confirm Deletion", `Are you sure you want to remove this conversation? This action cannot be undone.`,
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Delete", 
                        style: "destructive", 
                        onPress: async () => {
                            const { error } = await supabase.from('conversations').delete().eq('id', convo.id);
                            if (error) {
                                Alert.alert("Error", "Failed to delete the conversation.");
                            } else {
                                setAllConversations(prev => prev.filter(c => c.id !== convo.id));
                            }
                        }
                    }
                ]
            );
        }
    }, []);

    const handleConversationPress = useCallback((convo: Conversation) => {
        if (isSelectionMode) {
            handleSelectConversation(convo.id);
            return;
        }

        // First, trigger the modal to close
        onClose();

        // THEN, push the new screen after a short delay to allow the modal to animate out
        setTimeout(() => {
            router.push({
                pathname: "/chat/[id]",
                params: { id: String(convo.id), recipientName: convo.recipient.fullName }
            });
        }, 50); // A tiny 50ms delay is usually enough

    }, [isSelectionMode, router, onClose]);


    const toggleSearch = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsSearchVisible(!isSearchVisible);
        if (isSearchVisible) setSearchQuery('');
    };

    const toggleSelectionMode = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds(new Set());
    };

    const handleSelectConversation = (id: number) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) newSelection.delete(id);
        else newSelection.add(id);
        setSelectedIds(newSelection);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredConversations.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredConversations.map(c => c.id)));
    };

    const handleBulkArchiveAction = async (archiveState: boolean) => {
        if (selectedIds.size === 0) return;
        const idsToUpdate = Array.from(selectedIds);
        const actionText = archiveState ? 'archive' : 'unarchive';

        const { error } = await supabase.from('conversations').update({ is_archived: archiveState }).in('id', idsToUpdate);
        if (error) Alert.alert("Error", `Could not ${actionText} conversations.`);
        else {
            setAllConversations(prev => prev.map(c => idsToUpdate.includes(c.id) ? { ...c, is_archived: archiveState } : c));
            toggleSelectionMode();
        }
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        Alert.alert(
            "Confirm Deletion", `Are you sure you want to remove ${selectedIds.size} conversation(s)? This action cannot be undone.`,
            [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => Alert.alert("Note", "Deletion feature coming soon! For now, you can archive chats.") }]
        );
    };

    const handleLongPress = (event: any, item: Conversation) => {
        const { pageX, pageY } = event.nativeEvent;
        setContextMenu({
            visible: true,
            conversation: item,
            position: { x: pageX, y: pageY }
        });
    };

    const renderMessageItem = useCallback(({ item }: { item: Conversation }) => (
        <ConversationItem
            item={item}
            onPress={handleConversationPress}
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.has(item.id)}
            activeFilter={activeFilter}
            onUnarchive={handleSingleAction('unarchive', item)}
            onDelete={handleSingleAction('delete', item)}
            onArchive={handleSingleAction('archive', item)}
            onLongPress={(event) => handleLongPress(event, item)}
            closeAllOtherSwipeables={() => setOpenSwipeableId(item.id)}
            isSwipeableOpen={openSwipeableId === item.id}
            currentUserId={user?.id || null}
        />
    ), [isSelectionMode, selectedIds, activeFilter, handleConversationPress, handleSingleAction, openSwipeableId, user]);


    const isSelectAllActive = selectedIds.size > 0 && filteredConversations.length > 0 && selectedIds.size === filteredConversations.length;

    return (
        <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}>
            <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 20, paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0 }]}>
                <MessagesHeader
                    isSelectionMode={isSelectionMode}
                    toggleSelectionMode={toggleSelectionMode}
                    toggleSearch={toggleSearch}
                    onClose={handleCloseModal}
                    handleSelectAll={handleSelectAll}
                    isSelectAllActive={isSelectAllActive}
                    handleArchiveAction={handleBulkArchiveAction}
                    handleDeleteSelected={handleDeleteSelected}
                    activeFilter={activeFilter}
                />

                {isSearchVisible && !isSelectionMode && (
                    <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
                        <TextInput
                            style={[styles.searchInput, { color: colors.text, backgroundColor: colors.card }]}
                            placeholder="Search by name..."
                            placeholderTextColor={colors.text + '80'}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                )}

                {!isSelectionMode && <FilterTabs activeFilter={activeFilter} setActiveFilter={setActiveFilter} />}

                {loading ? <ActivityIndicator style={{marginTop: 50}} color={colors.primary} /> : (
                    <FlatList
                        data={filteredConversations}
                        renderItem={renderMessageItem}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListEmptyComponent={(
                           <View style={styles.centered}>
                               <FontAwesome name="comments-o" size={60} color={colors.text + '30'}/>
                               <Text style={[styles.emptyText, {color: colors.text + '99'}]}>No conversations here.</Text>
                           </View>
                        )}
                        extraData={allConversations}
                    />
                )}
                
                {contextMenu.visible && contextMenu.conversation && (
                     <Pressable style={styles.actionModalBackdrop} onPress={() => setContextMenu({ ...contextMenu, visible: false })}>
                        <View style={[styles.actionModalContainer, { top: contextMenu.position.y, left: contextMenu.position.x - 150, backgroundColor: colors.card }]}>
                             <TouchableOpacity style={styles.actionModalButton} onPress={handleSingleAction(contextMenu.conversation.is_archived ? 'unarchive' : 'archive', contextMenu.conversation)}>
                                <Text style={[styles.actionModalButtonText, { color: colors.text }]}>
                                    {contextMenu.conversation.is_archived ? 'Unarchive' : 'Archive'}
                                </Text>
                                <FontAwesome name={contextMenu.conversation.is_archived ? "folder-open-o" : "archive"} size={22} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionModalButton, { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={handleSingleAction('delete', contextMenu.conversation)}>
                                <Text style={[styles.actionModalButtonText, { color: colors.error }]}>Delete</Text>
                                <FontAwesome name="trash-o" size={22} color={colors.error} />
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                )}

                 <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                     <Text style={[styles.footerText, { color: colors.text + '99' }]}>
                         Older messages may have been deleted. Conversations inactive for over 1 year are automatically removed.
                     </Text>
                 </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centered: { paddingTop: 100, alignItems: 'center', gap: 20 },
    emptyText: { fontSize: 16, fontWeight: '500' },
    modalContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        height: 50,
        borderBottomWidth: 1,
    },
    headerLeft: {
        width: 90, 
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerRight: { width: 80, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    actionButton: { padding: 8 },
    headerTouch: {
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    headerButtonText: { fontSize: 16, fontWeight: '500' },
    searchContainer: { padding: 10, borderBottomWidth: 1 },
    searchInput: {
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        paddingVertical: 10,
    },
    filterContainer: { flexDirection: 'row', borderBottomWidth: 1, },
    filterTab: { paddingVertical: 15, flex: 1, alignItems: 'center', },
    filterText: { fontSize: 15, fontWeight: '600' },
    filterIndicator: { position: 'absolute', bottom: -1, height: 3, borderRadius: 2, opacity: 0 },
    messageItem: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15 },
    checkboxContainer: { marginRight: 10, paddingLeft: 10 },
    indicatorAndAvatar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    messageAvatar: { width: 52, height: 52, borderRadius: 26, },
    messageContent: { flex: 1, justifyContent: 'center', paddingVertical: 16, marginLeft: 12, paddingRight: 15 },
    messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    messageUserName: { fontSize: 16, flexShrink: 1, marginRight: 8 },
    messageTimestamp: { fontSize: 13, color: '#666' },
    messageText: { fontSize: 14, lineHeight: 20, },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 15, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 30 : 15, },
    footerText: { fontSize: 12, textAlign: 'center', lineHeight: 16 },
    swipeActionContainer: { position: 'absolute', right: 0, top: 0, bottom: 0, flexDirection: 'row', justifyContent: 'flex-end' },
    swipeButton: { width: ACTION_BUTTON_WIDTH, justifyContent: 'center', alignItems: 'center' },
    actionModalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 10,
    },
    actionModalContainer: {
      position: 'absolute',
      width: 200,
      borderRadius: 14,
      overflow: 'hidden',
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    actionModalButton: {
      padding: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    actionModalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
});