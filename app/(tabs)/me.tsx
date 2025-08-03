// sdaw/app/(tabs)/me.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused, useTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, PixelRatio, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Listing, ProductCard } from '../../components/cards/ProductCard';
import { useAuth, UserProfile } from '../../components/context/AuthContext';
import { EditProfileModal } from '../../components/modals/EditProfileModal';
import { FavoritesModal } from '../../components/modals/FavoritesModal';
import { MessagesModal } from '../../components/modals/MessagesModal';
import { OrdersModal } from '../../components/modals/OrdersModal';
import { SettingsModal } from '../../components/modals/SettingsModal';
import { ThriftShareModal } from '../../components/modals/ThriftShareModal';
import { TradesModal } from '../../components/modals/TradesModal';
import { AboutSection } from '../../components/profile/AboutSection';
import { PaymentSettings } from '../../components/profile/PaymentSettings';
import { Review, ReviewsSection } from '../../components/profile/ReviewsSection';
import { supabase } from '../../supabase';

const DEFAULT_PROFILE_PHOTO = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=PROFILE';
const { width } = Dimensions.get('window');

// Responsive font scaling
const fontScale = PixelRatio.getFontScale();
const getFontSize = (size: number) => size / fontScale;


type ActiveTradeTab = 'received' | 'sent';
export type ActiveOrderTab = 'buying' | 'selling' | 'free';

export default function MeScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const isFocused = useIsFocused();
    const params = useLocalSearchParams<{ postId?: string; openComments?: string; openTrades?: string; tab?: string; openOrders?: string; orderTab?: string }>();

    const { session, userProfile, loading: authLoading, requireLogin, refetchUserProfile } = useAuth();

    const [listings, setListings] = useState<Listing[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [componentLoading, setComponentLoading] = useState(true);

    const [currentProfileForEdit, setCurrentProfileForEdit] = useState<UserProfile | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [pickingImage, setPickingImage] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'listings' | 'about' | 'reviews'>('listings');
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [messagesModalVisible, setMessagesModalVisible] = useState(false);
    const [favoritesModalVisible, setFavoritesModalVisible] = useState(false);
    const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
    const [unreadConversationsCount, setUnreadConversationsCount] = useState(0);

    // Modal States
    const [tradesModalVisible, setTradesModalVisible] = useState(false);
    const [initialTradeTab, setInitialTradeTab] = useState<ActiveTradeTab>('received');
    const [ordersModalVisible, setOrdersModalVisible] = useState(false);
    const [initialOrderTab, setInitialOrderTab] = useState<ActiveOrderTab>('buying');

    const [thriftShareModalVisible, setThriftShareModalVisible] = useState(false);
    const [paymentSettingsVisible, setPaymentSettingsVisible] = useState(false);
    const [initialThriftSharePostId, setInitialThriftSharePostId] = useState<number | undefined>(undefined);
    const [initialOpenCommentsPostId, setInitialOpenCommentsPostId] = useState<number | undefined>(undefined);

    const gap = 12;
    const cardWidth = (width - 24 - gap) / 2;

    useFocusEffect(
      useCallback(() => {
        if (params.postId) {
            const postId = parseInt(params.postId, 10);
            setInitialThriftSharePostId(postId);
            if (params.openComments === 'true') {
                setInitialOpenCommentsPostId(postId);
            }
            setThriftShareModalVisible(true);
            router.setParams({ postId: undefined, openComments: undefined });
        }

        if (params.openTrades === 'true') {
            if(params.tab === 'received' || params.tab === 'sent') {
                setInitialTradeTab(params.tab);
            }
            setTradesModalVisible(true);
            router.setParams({ openTrades: undefined, tab: undefined });
        }

        if (params.openOrders === 'true') {
            if(params.orderTab === 'buying' || params.orderTab === 'selling' || params.orderTab === 'free') {
                setInitialOrderTab(params.orderTab as ActiveOrderTab);
            }
            setOrdersModalVisible(true);
            router.setParams({ openOrders: undefined, orderTab: undefined });
        }
      }, [params])
    );

    useEffect(() => {
        if (!session?.user) { setUnreadConversationsCount(0); return; }
        const fetchUnreadCount = async () => {
            const { data, error } = await supabase.from('conversations').select('participant_unread_counts, is_archived').contains('participant_ids', [session.user.id]);
            if (error) { console.error("Error fetching unread count for MeScreen:", error); return; }
            let count = 0;
            data.forEach(convo => {
                const userUnreadCount = convo.participant_unread_counts?.[session.user.id] || 0;
                if (userUnreadCount > 0 && !convo.is_archived) { count++; }
            });
            setUnreadConversationsCount(count);
        };
        if (isFocused) { fetchUnreadCount(); }
        const channel = supabase.channel(`me_screen_unread_count:${session.user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `participant_ids=cs.{"${session.user.id}"}` }, () => { fetchUnreadCount(); }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [session, isFocused]);

    useEffect(() => {
        if (isFocused) { setLogoutLoading(false); }
        const fetchScreenData = async () => {
            if (session?.user) {
                setComponentLoading(true);
                const [listingsRes, favoritesRes, followerCountRes, followingCountRes, reviewsRes] = await Promise.all([
                    supabase.from('listings').select('*, status, click_count').eq('user_id', session.user.id),
                    supabase.from('favorites').select('listing_id').eq('user_id', session.user.id),
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', session.user.id),
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', session.user.id),
                    supabase.from('reviews').select('*, reviewer:users!reviewer_id(id, fullName, profilePhotoUrl)').eq('reviewee_id', session.user.id)
                ]);
                setListings(listingsRes.data || []);
                setFavoritedIds(new Set(favoritesRes.data?.map(f => f.listing_id) || []));
                setFollowerCount(followerCountRes.count ?? 0);
                setFollowingCount(followingCountRes.count ?? 0);
                setReviews((reviewsRes.data as any) || []);
                setComponentLoading(false);
            } else {
                setListings([]); setFavoritedIds(new Set()); setFollowerCount(0); setFollowingCount(0); setReviews([]); setComponentLoading(false);
            }
        };
        if (isFocused) { fetchScreenData(); }
    }, [session, isFocused]);

    const handleOpenEditModal = () => { setSettingsModalVisible(false); setTimeout(() => { if (userProfile) { setCurrentProfileForEdit(userProfile); setEditProfileModalVisible(true); } }, 150); };

    const handleSaveProfile = async (updatedProfileData: Omit<UserProfile, 'status'>) => {
        if (!session?.user || !userProfile) return;
        setSavingProfile(true);
        const updateData = { ...updatedProfileData, status: userProfile.status, };
        const { error } = await supabase.from('users').update(updateData).eq('id', session.user.id);
        if (error) { Alert.alert("Error", "Could not update profile: " + error.message); }
        else { await refetchUserProfile(); Alert.alert("Success", "Profile updated!"); setEditProfileModalVisible(false); }
        setSavingProfile(false);
    };

    const pickImage = async () => {
        if (!session?.user) return;
        setPickingImage(true);
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Denied', 'Camera roll access is needed.'); setPickingImage(false); return; }
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 1, });
        if (result.canceled || !result.assets) { setPickingImage(false); return; }
        try {
            const image = result.assets[0];
            const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer());
            const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg';
            const path = `${session.user.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('profilepicture').upload(path, arraybuffer, { contentType: image.mimeType ?? 'image/jpeg' });
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('profilepicture').getPublicUrl(path);
            const publicUrl = data.publicUrl;
            const { error: updateError } = await supabase.from('users').update({ profilePhotoUrl: publicUrl }).eq('id', session.user.id);
            if (updateError) throw updateError;
            await refetchUserProfile();
        } catch (error: any) { Alert.alert('Upload Error', error.message); }
        finally { setPickingImage(false); }
    };

    const handleLogout = async () => { setLogoutLoading(true); await supabase.auth.signOut(); setSettingsModalVisible(false); router.replace('/(tabs)'); };

    const handleToggleFavorite = (listingId: number) => { requireLogin(async () => { if (!session?.user) return; const isFavorited = favoritedIds.has(listingId); if (isFavorited) { setFavoritedIds(prev => { const next = new Set(prev); next.delete(listingId); return next; }); await supabase.from('favorites').delete().match({ user_id: session.user.id, listing_id: listingId }); } else { setFavoritedIds(prev => new Set(prev.add(listingId))); await supabase.from('favorites').insert({ user_id: session.user.id, listing_id: listingId }); } }); };

    if (authLoading || componentLoading || logoutLoading) { return <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>; }

    if (!userProfile) { return ( <View style={[styles.loadingContainer, { backgroundColor: colors.background, padding: 20 }]}><FontAwesome name="user-times" size={60} color={colors.text + '40'} /><Text style={[styles.fullName, {color: colors.text, marginTop: 20}]}>Welcome!</Text><Text style={[styles.bioText, {color: colors.text + '99'}]}>Please log in to view your profile and listings.</Text><TouchableOpacity style={[styles.loginButton, {backgroundColor: colors.primary}]} onPress={() => router.push('/auth/modal')}><Text style={[styles.loginButtonText, {color: colors.card}]}>Login or Sign Up</Text></TouchableOpacity></View> ); }

    const OrdersModalWithTab = OrdersModal as React.FC<React.ComponentProps<typeof OrdersModal> & { initialTab: ActiveOrderTab }>;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                <View style={styles.headerContainer}>
                    <View style={[styles.headerBackground, { backgroundColor: colors.primary }]}/>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerButton} onPress={() => setOrdersModalVisible(true)}><FontAwesome name="shopping-cart" size={22} color={colors.card} /></TouchableOpacity>
                        <TouchableOpacity style={styles.headerButton} onPress={() => setSettingsModalVisible(true)}><FontAwesome name="cog" size={24} color={colors.card} /></TouchableOpacity>
                    </View>
                </View>
                <View style={styles.profilePhotoContainer}>
                    <Image source={{ uri: userProfile.profilePhotoUrl || DEFAULT_PROFILE_PHOTO }} style={[styles.profilePhoto, { borderColor: colors.background }]} />
                    <TouchableOpacity style={[styles.editProfileButton, {backgroundColor: colors.primary}]} onPress={pickImage} disabled={pickingImage}>{pickingImage ? <ActivityIndicator size="small" color={colors.card} /> : <FontAwesome name="camera" size={16} color={colors.card} />}</TouchableOpacity>
                </View>
                <View style={styles.userDetailsSection}>
                    <Text style={[styles.fullName, { color: colors.text }]}>{userProfile.fullName || 'Update your name'}</Text>
                    <Text style={[styles.username, { color: colors.text }]}>@{userProfile.username || 'update_username'}</Text>
                    {userProfile.bio && (<Text style={[styles.bioText, { color: `${colors.text}99` }]}>{userProfile.bio}</Text>)}
                </View>
                <View style={[styles.infoLinksCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity style={styles.infoLinkItem} onPress={() => requireLogin(() => setMessagesModalVisible(true))}>
                        <FontAwesome name="comment-o" size={22} color={colors.text} />
                        <Text style={[styles.infoLinkText, { color: colors.text }]}>Messages</Text>
                        {unreadConversationsCount > 0 && ( <View style={[styles.notificationBadge, { borderColor: colors.card }]}><Text style={styles.notificationBadgeText}>{unreadConversationsCount > 9 ? '9+' : unreadConversationsCount}</Text></View> )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.infoLinkItem} onPress={() => requireLogin(() => setTradesModalVisible(true))}>
                        <FontAwesome name="exchange" size={22} color={colors.text} />
                        <Text style={[styles.infoLinkText, { color: colors.text }]}>Trades</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.infoLinkItem} onPress={() => requireLogin(() => setFavoritesModalVisible(true))}>
                        <FontAwesome name="heart-o" size={22} color={colors.text} />
                        <Text style={[styles.infoLinkText, { color: colors.text }]}>Favorites</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.infoLinkItem} onPress={() => requireLogin(() => setThriftShareModalVisible(true))}>
                        <FontAwesome name="camera-retro" size={22} color={colors.text} />
                        <Text style={[styles.infoLinkText, { color: colors.text }]}>ThriftShare</Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.segmentedControlContainer, { backgroundColor: `${colors.text}10` }]}>
                    <TouchableOpacity style={[styles.segmentButton, activeTab === 'listings' && [styles.segmentButtonActive, {backgroundColor: colors.primary}]]} onPress={() => setActiveTab('listings')}><Text style={[styles.segmentText, { color: activeTab === 'listings' ? colors.card : colors.text }]}>Listings</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.segmentButton, activeTab === 'about' && [styles.segmentButtonActive, {backgroundColor: colors.primary}]]} onPress={() => setActiveTab('about')}><Text style={[styles.segmentText, { color: activeTab === 'about' ? colors.card : colors.text }]}>About</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.segmentButton, activeTab === 'reviews' && [styles.segmentButtonActive, {backgroundColor: colors.primary}]]} onPress={() => setActiveTab('reviews')}><Text style={[styles.segmentText, { color: activeTab === 'reviews' ? colors.card : colors.text }]}>Reviews</Text></TouchableOpacity>
                </View>
                {activeTab === 'about' && <AboutSection user={userProfile} followerCount={followerCount} followingCount={followingCount} />}
                {activeTab === 'listings' && ( <View style={styles.listingsSection}>{listings.length > 0 ? ( <FlatList data={listings} renderItem={({ item, index }) => ( <View style={{ width: cardWidth, marginLeft: index % 2 === 0 ? 0 : gap, marginBottom: gap }}><ProductCard item={item} cardWidth={cardWidth} isOwnerView={true} /></View> )} keyExtractor={(item) => item.id.toString()} numColumns={2} scrollEnabled={false} contentContainerStyle={styles.listContentContainer} /> ) : ( <View style={styles.emptyListingsContainer}><FontAwesome name="dropbox" size={50} color={colors.text + '40'} /><Text style={[styles.sectionContent, { color: colors.text+'99' }]}>You haven't listed any items yet.</Text></View> )}</View> )}
                {activeTab === 'reviews' && <ReviewsSection reviews={reviews} currentUserId={session?.user?.id} />}
            </ScrollView>
            <SettingsModal visible={settingsModalVisible} onClose={() => setSettingsModalVisible(false)} onEditProfile={handleOpenEditModal} onLogout={handleLogout} logoutLoading={logoutLoading} onPaymentSettings={() => { setSettingsModalVisible(false); setTimeout(() => setPaymentSettingsVisible(true), 150); }} />
            <MessagesModal visible={messagesModalVisible} onClose={() => setMessagesModalVisible(false)} />
            <FavoritesModal visible={favoritesModalVisible} onClose={() => setFavoritesModalVisible(false)} onUnfavorite={(id) => handleToggleFavorite(id)} />
            <ThriftShareModal visible={thriftShareModalVisible} onClose={() => { setThriftShareModalVisible(false); setInitialThriftSharePostId(undefined); }} initialPostId={initialThriftSharePostId} initialOpenCommentsPostId={initialOpenCommentsPostId} />
            <EditProfileModal visible={editProfileModalVisible} onClose={() => setEditProfileModalVisible(false)} currentProfile={currentProfileForEdit} onSave={handleSaveProfile} savingProfile={savingProfile} />
            <TradesModal visible={tradesModalVisible} onClose={() => setTradesModalVisible(false)} initialTab={initialTradeTab} />
            <Modal visible={paymentSettingsVisible} animationType="slide"><PaymentSettings onClose={() => setPaymentSettingsVisible(false)} /></Modal>
            <OrdersModalWithTab visible={ordersModalVisible} onClose={() => setOrdersModalVisible(false)} initialTab={initialOrderTab}/>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, },
    scrollContentContainer: { paddingBottom: 100, },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loginButton: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, },
    loginButtonText: { fontSize: getFontSize(16), fontWeight: 'bold', },
    headerContainer: { height: 150, },
    headerBackground: { width: '100%', height: '100%', position: 'absolute' },
    headerActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, },
    headerButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
    profilePhotoContainer: { alignSelf: 'center', marginTop: -70, position: 'relative', zIndex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10, },
    profilePhoto: { width: 140, height: 140, borderRadius: 70, borderWidth: 5, },
    editProfileButton: { position: 'absolute', bottom: 5, right: 5, borderRadius: 18, padding: 8, borderWidth: 2, borderColor: '#fff' },
    userDetailsSection: { alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, },
    fullName: { fontSize: getFontSize(24), fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
    username: { fontSize: getFontSize(16), opacity: 0.7 },
    bioText: { fontSize: getFontSize(15), textAlign: 'center', marginHorizontal: 20, marginTop: 12, lineHeight: 22, fontStyle: 'italic', },
    infoLinksCard: { marginHorizontal: 20, paddingVertical: 10, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 5, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 10, marginBottom: 20 },
    infoLinkItem: { paddingHorizontal: 5, paddingVertical: 10, alignItems: 'center', gap: 8, position: 'relative', flex: 1 },
    infoLinkText: { fontSize: getFontSize(13), fontWeight: '600', textAlign: 'center' },
    notificationBadge: { position: 'absolute', top: 5, right: '15%', backgroundColor: 'red', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, paddingHorizontal: 5},
    notificationBadgeText: { color: 'white', fontSize: getFontSize(11), fontWeight: 'bold', },
    segmentedControlContainer: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginTop: 20, marginBottom: 20, height: 48, borderRadius: 24, },
    segmentButton: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 24, paddingHorizontal: 5 },
    segmentButtonActive: {},
    segmentText: { fontSize: getFontSize(15), fontWeight: '600', textAlign: 'center' },
    listingsSection: { paddingVertical: 10, marginBottom: 40 },
    listContentContainer: { paddingHorizontal: 12, paddingBottom: 20 },
    emptyListingsContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 16, gap: 20 },
    sectionContent: { fontSize: getFontSize(15), textAlign: 'center', paddingHorizontal: 16 },
});