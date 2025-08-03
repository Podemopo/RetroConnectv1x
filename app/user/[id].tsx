// sdaw/app/user/[id].tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard } from '../../components/cards/ProductCard';
import { useAuth } from '../../components/context/AuthContext';
import { ReviewModal } from '../../components/modals/ReviewModal';
import { UserReportModal } from '../../components/modals/UserReportModal';
import { AboutSection } from '../../components/profile/AboutSection';
import { Review, ReviewsSection } from '../../components/profile/ReviewsSection';
import { useUserProfile } from '../../hooks/useUserProfile';
import { supabase } from '../../supabase';

const DEFAULT_PROFILE_PHOTO = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=PROFILE';
const { width } = Dimensions.get('window');

// --- UPDATED: ActionMenu now includes isBlocked prop ---
const ActionMenu = ({ visible, onClose, onBlock, onReport, isBlocked }: { visible: boolean, onClose: () => void, onBlock: () => void, onReport: () => void, isBlocked: boolean }) => {
    const { colors } = useTheme();
    if (!visible) return null;

    return (
        <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.modalBackdrop} onPress={onClose}>
                <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
                    <TouchableOpacity style={styles.menuItem} onPress={onBlock}>
                        <FontAwesome name={isBlocked ? "unlock" : "ban"} size={16} color={colors.text} />
                        <Text style={[styles.menuText, { color: colors.text }]}>{isBlocked ? 'Unblock User' : 'Block User'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, { borderTopWidth: 1, borderColor: colors.border }]} onPress={onReport}>
                        <FontAwesome name="flag" size={16} color={'#FF4136'} />
                        <Text style={[styles.menuText, { color: '#FF4136' }]}>Report User</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
};

export default function UserProfileScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { id: profileId } = useLocalSearchParams<{ id: string }>();
    const { session, requireLogin } = useAuth();

    const {
        user,
        listings,
        reviews,
        loading,
        isFollowing,
        followerCount,
        followingCount,
        hasReviewed,
        favoritedIds,
        setReviews,
        setFollowerCount,
        setIsFollowing,
        setFavoritedIds,
    } = useUserProfile(profileId, session);

    const [activeTab, setActiveTab] = useState<'listings' | 'about' | 'reviews'>('listings');
    const [isReviewModalVisible, setReviewModalVisible] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [isMenuVisible, setMenuVisible] = useState(false);
    
    // --- ADDED STATE for block/report ---
    const [isBlocked, setIsBlocked] = useState(false);
    const [isReportModalVisible, setReportModalVisible] = useState(false);

    const isOwnProfile = session?.user?.id === profileId;
    
    const gap = 12;
    const cardWidth = (width - 24 - gap) / 2;

    // --- ADDED: Effect to check block status ---
    useEffect(() => {
        const checkBlockStatus = async () => {
            if (!session?.user || !profileId || isOwnProfile) return;
            const { data, error } = await supabase
                .from('blocked_users')
                .select('blocker_id')
                .eq('blocker_id', session.user.id)
                .eq('blocked_id', profileId)
                .maybeSingle();
            
            if (error) {
                console.error("Error checking block status:", error);
            } else {
                setIsBlocked(!!data);
            }
        };
        checkBlockStatus();
    }, [session, profileId, isOwnProfile]);
    
    const handleFollowToggle = () => {
        requireLogin(async () => {
            const currentUser = session!.user;
            if (isFollowing) {
                setIsFollowing(false);
                setFollowerCount(prev => prev - 1);
                await supabase.from('follows').delete().match({ follower_id: currentUser.id, following_id: profileId });
            } else {
                setIsFollowing(true);
                setFollowerCount(prev => prev + 1);
                await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: profileId });
            }
        });
    };

    const handleMessage = () => {
        requireLogin(async () => {
            if (!user) { Alert.alert("User data is not available yet."); return; }
            const currentUser = session!.user;
            if (currentUser.id === user.id) { Alert.alert("This is your own profile!"); return; }
            setChatLoading(true);
            try {
                const { data: conversationId, error: rpcError } = await supabase.rpc('find_or_create_conversation', { participants_to_find: [currentUser.id, user.id] });
                if (rpcError) throw rpcError;
                const initialMessage = "Hi!";
                const { error: messageError } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: currentUser.id, message_text: initialMessage });
                if (messageError) throw messageError;
                await supabase.from('conversations').update({ last_message_text: initialMessage, last_message_at: new Date().toISOString() }).eq('id', conversationId);
                router.push({ pathname: `/chat/${conversationId}` as any, params: { recipientName: user.fullName || 'User' } });
            } catch (error: any) {
                console.error("Error starting conversation:", error);
                Alert.alert("Error", "Could not start a conversation. Please try again.");
            } finally {
                setChatLoading(false);
            }
        });
    };

    const handleToggleFavorite = (listingId: number) => {
        requireLogin(async () => {
            const currentUser = session!.user;
            const isFavorited = favoritedIds.has(listingId);
            const newFavoritedIds = new Set(favoritedIds);
            if (isFavorited) {
                newFavoritedIds.delete(listingId);
                await supabase.from('favorites').delete().match({ user_id: currentUser.id, listing_id: listingId });
            } else {
                newFavoritedIds.add(listingId);
                await supabase.from('favorites').insert({ user_id: currentUser.id, listing_id: listingId });
            }
            setFavoritedIds(newFavoritedIds);
        });
    };

    const handleEditReview = (review: Review) => {
        setEditingReview(review);
        setReviewModalVisible(true);
    };

    const handleSaveReview = async (rating: number, comment: string) => {
        if (!session?.user || !profileId) {
            Alert.alert("Error", "You must be logged in to save a review.");
            return;
        }
        setIsSubmittingReview(true);

        try {
            if (editingReview) {
                const { data, error } = await supabase
                    .from('reviews')
                    .update({ rating, comment })
                    .eq('id', editingReview.id)
                    .select('*, reviewer:users!reviewer_id(id, fullName, profilePhotoUrl)')
                    .single();

                if (error) throw error;
                setReviews(prev => prev.map(r => r.id === editingReview.id ? (data as Review) : r));
                Alert.alert("Success", "Your review has been updated!");

            } else {
                const { data: newReview, error } = await supabase
                    .from('reviews')
                    .insert({ reviewer_id: session.user.id, reviewee_id: profileId, rating, comment })
                    .select('*, reviewer:users!reviewer_id(id, fullName, profilePhotoUrl)')
                    .single();

                if (error) throw error;
                
                if (newReview) {
                    setReviews(prev => [newReview as Review, ...prev]);
                }
                
                Alert.alert("Success", "Your review has been submitted!");
            }
        } catch (error: any) {
            console.error("Review save error:", error);
            Alert.alert("Error", "Could not save your review. Please try again.");
        } finally {
            setIsSubmittingReview(false);
            setReviewModalVisible(false);
            setEditingReview(null);
        }
    };
    
    // --- UPDATED: Block/Unblock Logic ---
    const handleBlockToggle = () => {
        setMenuVisible(false);
        if (isBlocked) {
            handleUnblockUser();
        } else {
            Alert.alert(
                'Block User',
                `Are you sure you want to block ${user?.fullName}? You will no longer see their content or be able to interact with them.`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Block", style: "destructive", onPress: handleBlockUser }
                ]
            );
        }
    };

    const handleBlockUser = async () => {
        if (!session?.user || !profileId) return;
        const { error } = await supabase.from('blocked_users').insert({
            blocker_id: session.user.id,
            blocked_id: profileId
        });
        if (error) {
            Alert.alert("Error", "Could not block user.");
        } else {
            setIsBlocked(true);
            Alert.alert("User Blocked", `${user?.fullName} has been blocked.`);
        }
    };

    const handleUnblockUser = async () => {
        if (!session?.user || !profileId) return;
        const { error } = await supabase.from('blocked_users').delete()
            .match({ blocker_id: session.user.id, blocked_id: profileId });

        if (error) {
            Alert.alert("Error", "Could not unblock user.");
        } else {
            setIsBlocked(false);
            Alert.alert("User Unblocked", `${user?.fullName} has been unblocked.`);
        }
    };

    const handleReportUser = () => {
        setMenuVisible(false);
        setReportModalVisible(true);
    };

    if (loading) return <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
    if (!user) return <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}><Text style={{ color: colors.text }}>User not found.</Text></View>;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.headerContainer}>
                    <View style={[styles.headerBackground, { backgroundColor: colors.primary }]}/>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}><FontAwesome name="arrow-left" size={22} color={colors.card} /></TouchableOpacity>
                        {!isOwnProfile && (
                             <TouchableOpacity style={styles.headerButton} onPress={() => setMenuVisible(true)}>
                                <FontAwesome name="ellipsis-v" size={22} color={colors.card} />
                             </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.profilePhotoContainer}>
                    <Image source={{ uri: user.profilePhotoUrl || DEFAULT_PROFILE_PHOTO }} style={[styles.profilePhoto, { borderColor: colors.background }]} />
                </View>

                <View style={styles.userDetailsSection}>
                    <Text style={[styles.fullName, { color: colors.text }]}>{user.fullName || 'No name'}</Text>
                    <Text style={[styles.username, { color: colors.text }]}>@{user.username || 'no_username'}</Text>
                    {user.bio && (<Text style={[styles.bioText, { color: `${colors.text}99` }]}>{user.bio}</Text>)}
                    {!isOwnProfile && (
                        <View style={styles.actionButtonsContainer}>
                            {isBlocked ? (
                                <TouchableOpacity style={[styles.button, styles.unblockButton]} onPress={handleUnblockUser}>
                                    <Text style={[styles.buttonText, styles.unblockButtonText]}>Unblock</Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity style={[styles.button, styles.followButton]} onPress={handleFollowToggle}>
                                        <Text style={[styles.buttonText, styles.followButtonText]}>{isFollowing ? 'Following' : 'Follow'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.button, styles.messageButton]} onPress={handleMessage} disabled={chatLoading}>
                                        {chatLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={[styles.buttonText, styles.messageButtonText]}>Message</Text>}
                                    </TouchableOpacity>
                                    {!hasReviewed && (
                                        <TouchableOpacity style={[styles.button, styles.reviewButton]} onPress={() => requireLogin(() => setReviewModalVisible(true))}>
                                            <Text style={[styles.buttonText, styles.reviewButtonText]}>Review</Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                        </View>
                    )}
                </View>
                
                <View style={[styles.segmentedControlContainer, { backgroundColor: `${colors.text}10` }]}>
                    <TouchableOpacity style={[styles.segmentButton, activeTab === 'listings' && [styles.segmentButtonActive, {backgroundColor: colors.primary}]]} onPress={() => setActiveTab('listings')}><Text style={[styles.segmentText, { color: activeTab === 'listings' ? colors.card : colors.text }]}>Listings</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.segmentButton, activeTab === 'about' && [styles.segmentButtonActive, {backgroundColor: colors.primary}]]} onPress={() => setActiveTab('about')}><Text style={[styles.segmentText, { color: activeTab === 'about' ? colors.card : colors.text }]}>About</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.segmentButton, activeTab === 'reviews' && [styles.segmentButtonActive, {backgroundColor: colors.primary}]]} onPress={() => setActiveTab('reviews')}><Text style={[styles.segmentText, { color: activeTab === 'reviews' ? colors.card : colors.text }]}>Reviews</Text></TouchableOpacity>
                </View>

                {activeTab === 'listings' && (
                    <View style={styles.listingsSection}>
                        {listings.length > 0 ? (
                           <FlatList
                                data={listings}
                                keyExtractor={(item) => item.id.toString()}
                                numColumns={2}
                                scrollEnabled={false} 
                                contentContainerStyle={styles.listContentContainer}
                                renderItem={({ item, index }) => (
                                    <View style={{ width: cardWidth, marginLeft: index % 2 === 0 ? 0 : gap, marginBottom: gap }}>
                                        <ProductCard 
                                            item={item} 
                                            cardWidth={cardWidth}
                                            isFavorited={favoritedIds.has(item.id)}
                                            onToggleFavorite={() => handleToggleFavorite(item.id)}
                                            showMetrics={!isOwnProfile}
                                        />
                                    </View>
                                )}
                            />
                        ) : (
                            <View style={styles.emptyListingsContainer}><FontAwesome name="dropbox" size={50} color={colors.text + '40'} /><Text style={[styles.sectionContent, { color: colors.text + '99' }]}>This user has no active listings.</Text></View>
                        )}
                    </View>
                )}
                {activeTab === 'about' && <AboutSection user={user} followerCount={followerCount} followingCount={followingCount} />}
                {activeTab === 'reviews' && 
                    <ReviewsSection
                        reviews={reviews}
                        currentUserId={session?.user?.id}
                        onEditReview={handleEditReview}
                    />
                }
            </ScrollView>

            <ReviewModal
                visible={isReviewModalVisible}
                onClose={() => {
                    setReviewModalVisible(false);
                    setEditingReview(null);
                }}
                onSubmit={handleSaveReview}
                isSubmitting={isSubmittingReview}
                reviewedUserName={user?.fullName || 'this user'}
                editingReview={editingReview}
            />
            
            <ActionMenu 
                visible={isMenuVisible} 
                onClose={() => setMenuVisible(false)} 
                onBlock={handleBlockToggle} 
                onReport={handleReportUser}
                isBlocked={isBlocked}
            />

            {session?.user && (
                <UserReportModal
                    visible={isReportModalVisible}
                    onClose={() => setReportModalVisible(false)}
                    reportedUserId={profileId}
                    reporterId={session.user.id}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    actionButtonsContainer: { flexDirection: 'row', marginTop: 20, gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
    button: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minWidth: 90 },
    buttonText: { fontSize: 15, fontWeight: '600' },
    messageButton: { backgroundColor: '#A9CF38' },
    messageButtonText: { color: '#FFFFFF' },
    followButton: { borderWidth: 1.5, borderColor: '#A9CF38' },
    followButtonText: { color: '#A9CF38' },
    reviewButton: { borderWidth: 1.5, borderColor: '#A9CF38' },
    reviewButtonText: { color: '#A9CF38' },
    unblockButton: { backgroundColor: '#FF4136' },
    unblockButtonText: { color: '#FFFFFF' },
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerBackground: { width: '100%', height: 150, backgroundColor: '#A9CF38' },
    profilePhotoContainer: { alignSelf: 'center', marginTop: -70, position: 'relative', zIndex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
    profilePhoto: { width: 140, height: 140, borderRadius: 70, borderWidth: 5 },
    userDetailsSection: { alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, marginBottom: 10 },
    fullName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
    username: { fontSize: 16, opacity: 0.7, marginBottom: 12 },
    bioText: { fontSize: 15, textAlign: 'center', marginHorizontal: 10, lineHeight: 22, fontStyle: 'italic', },
    segmentedControlContainer: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginTop: 10, marginBottom: 20, height: 48, borderRadius: 24, backgroundColor: '#eee' },
    segmentButton: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 24 },
    segmentButtonActive: { backgroundColor: '#A9CF38' },
    segmentText: { fontSize: 15, fontWeight: '600' },
    listingsSection: { paddingVertical: 10, marginBottom: 40 },
    listContentContainer: { paddingHorizontal: 12, paddingBottom: 20 },
    emptyListingsContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 20 },
    sectionContent: { fontSize: 15, textAlign: 'center', paddingBottom: 15, paddingHorizontal: 16 },
    headerContainer: { height: 150, },
    headerActions: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    headerButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.25)',
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    menuContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 90 : 60,
        right: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 8,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    menuText: {
        fontSize: 16,
        marginLeft: 15,
        fontWeight: '500',
    },
});
