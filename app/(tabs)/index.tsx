import { FavoritesModal } from '@/components/modals/FavoritesModal';
import { MessagesModal } from '@/components/modals/MessagesModal';
import SearchModal from '@/components/modals/search-modal';
import { FontAwesome } from '@expo/vector-icons';
import { useIsFocused, useTheme } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Listing, ProductCard } from '../../components/cards/ProductCard';
import { useAuth } from '../../components/context/AuthContext';
import { BrowseCategoryModal } from '../../components/modals/BrowseCategoryModal';
import { supabase } from '../../supabase';

const { width } = Dimensions.get('window');
const PAGE_SIZE = 20;

// --- Custom Dropdown Component ---
interface DropdownOption {
    label: string;
    value: string;
}
interface DropdownListProps {
    visible: boolean;
    onClose: () => void;
    options: DropdownOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
    position: { x: number; y: number; width: number };
}

const DropdownList = ({ visible, onClose, options, selectedValue, onSelect, position }: DropdownListProps) => {
    const { colors } = useTheme();
    const animatedProgress = useSharedValue(0);

    useEffect(() => {
        animatedProgress.value = withTiming(visible ? 1 : 0, { duration: 200 });
    }, [visible, animatedProgress]);

    const animatedListStyle = useAnimatedStyle(() => {
        const translateY = interpolate(animatedProgress.value, [0, 1], [-10, 0]);
        return {
            opacity: animatedProgress.value,
            transform: [{ translateY }],
        };
    });

    const handleSelect = (option: DropdownOption) => {
        onSelect(option.value);
        onClose();
    };

    return (
        <Modal transparent={true} visible={visible} onRequestClose={onClose} animationType="none">
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                <Animated.View
                    style={[
                        styles.dropdownList,
                        {
                            top: position.y,
                            left: position.x,
                            width: position.width,
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                        animatedListStyle,
                    ]}
                >
                    {options.map((option) => (
                        <TouchableOpacity key={option.value} style={styles.dropdownItem} onPress={() => handleSelect(option)}>
                            <Text style={[styles.dropdownItemText, { color: selectedValue === option.value ? colors.primary : colors.text }]}>{option.label}</Text>
                            {selectedValue === option.value && <FontAwesome name="check" size={14} color={colors.primary} />}
                        </TouchableOpacity>
                    ))}
                </Animated.View>
            </Pressable>
        </Modal>
    );
};


interface ExploreHeaderProps {
    onMessagesPress: () => void;
    onFavoritesPress: () => void;
    onSearchPress: () => void;
    onBrowsePress: () => void;
    onCategoryPress: (category: string) => void;
    unreadConversationsCount: number;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    dealTypeFilter: string;
    onDealTypeFilterPress: () => void;
    dropdownRef: React.RefObject<View | null>;
}

const ExploreHeader = ({ onMessagesPress, onFavoritesPress, onSearchPress, onBrowsePress, onCategoryPress, unreadConversationsCount, activeFilter, onFilterChange, dealTypeFilter, onDealTypeFilterPress, dropdownRef }: ExploreHeaderProps) => {
    const { colors } = useTheme();
    const placeholderColor = (colors as any).placeholder || '#AAAAAA';
    const categories = [
        { name: 'Services', icon: 'building-o' as const },
        { name: 'Motors', icon: 'car' as const },
        { name: 'Electronics', icon: 'laptop' as const },
        { name: 'Fashion', icon: 'shopping-bag' as const },
        { name: 'Books', icon: 'book' as const },
        { name: 'Collectibles', icon: 'diamond' as const },
        { name: 'Sports', icon: 'gamepad' as const },
        { name: 'All', icon: 'th-large' as const },
    ];
    const selectedLabel = dealTypeFilter === 'All' ? 'All Deals' : dealTypeFilter;

    return (
        <>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity style={styles.headerIcon} onPress={onBrowsePress}><FontAwesome name="bars" size={24} color={colors.text} /></TouchableOpacity>
                <TouchableOpacity onPress={onSearchPress} style={[styles.searchBarContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <FontAwesome name="search" size={19} color={placeholderColor} style={styles.searchIcon} />
                    <Text style={[styles.searchInput, { color: placeholderColor }]}>Search</Text>
                    <TouchableOpacity style={styles.searchIcon}><FontAwesome name="camera" size={18} color={placeholderColor} /></TouchableOpacity>
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIcon} onPress={onMessagesPress}>
                    <FontAwesome name="comment-o" size={24} color={colors.text} />
                    {unreadConversationsCount > 0 && (
                        <View style={styles.unreadIndicator}>
                            <Text style={styles.unreadIndicatorText}>
                                {unreadConversationsCount > 9 ? '9+' : unreadConversationsCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIcon} onPress={onFavoritesPress}><FontAwesome name="heart-o" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
            <View>
                <FlatList
                    horizontal showsHorizontalScrollIndicator={false} data={categories} keyExtractor={(item) => item.name}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => onCategoryPress(item.name)}>
                            <FontAwesome name={item.icon} size={30} color={colors.text} />
                            <Text style={[styles.categoryName, { color: colors.text }, item.name.length > 8 ? { fontSize: 10 } : {}]}>{item.name}</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.categoriesCarousel}
                />
            </View>
            <View style={[styles.promoBanner, { backgroundColor: colors.primary }]}>
                <Text style={[styles.promoText, { color: colors.card }]}>Join us on</Text><Text style={[styles.promoTitle, { color: colors.card }]}>Buy Back Day</Text><Text style={[styles.promoDate, { color: colors.card }]}>June 13-14 | 10am-1pm</Text><TouchableOpacity style={[styles.learnMoreButton, { backgroundColor: colors.card }]}><Text style={[styles.learnMoreButtonText, { color: colors.primary }]}>Learn More</Text></TouchableOpacity>
            </View>
            <View style={[styles.filterTabsContainer, { borderBottomColor: colors.border }]}>
                {['Top picks', 'Following', 'Nearby'].map((filter) => (
                    <TouchableOpacity key={filter} style={[styles.filterTab, activeFilter === filter && { borderBottomColor: colors.primary }]} onPress={() => onFilterChange(filter)}>
                        <Text style={[styles.filterTabText, { color: activeFilter === filter ? colors.primary : colors.text }]}>{filter}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.dealTypeFilterContainer}>
                <TouchableOpacity ref={dropdownRef as any} style={[styles.dealTypeFilterButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onDealTypeFilterPress}>
                    <FontAwesome name="filter" size={14} color={(colors as any).textSecondary} />
                    <Text style={[styles.dealTypeFilterText, { color: colors.text }]}>{selectedLabel}</Text>
                    <FontAwesome name="chevron-down" size={12} color={(colors as any).textSecondary} />
                </TouchableOpacity>
            </View>
        </>
    );
}

export default function ExploreScreen() {
    const { colors } = useTheme();
    const { requireLogin, session, user } = useAuth();
    const router = useRouter();

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [messagesModalVisible, setMessagesModalVisible] = useState(false);
    const [favoritesModalVisible, setFavoritesModalVisible] = useState(false);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [isBrowseModalVisible, setBrowseModalVisible] = useState(false);
    const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());
    const [unreadConversationsCount, setUnreadConversationsCount] = useState(0);
    const [activeFilter, setActiveFilter] = useState('Top picks');
    const [dealTypeFilter, setDealTypeFilter] = useState('All');
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 });
    const dropdownRef = useRef<View>(null);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (!user) {
            setUnreadConversationsCount(0);
            return;
        }

        const fetchUnreadCount = async () => {
            const { data, error } = await supabase
                .from('conversations')
                .select('participant_unread_counts, is_archived')
                .contains('participant_ids', [user.id]);

            if (error) {
                console.error("Error fetching unread count:", error);
                return;
            }

            let count = 0;
            data.forEach(convo => {
                const userUnreadCount = convo.participant_unread_counts?.[user.id] || 0;
                if (userUnreadCount > 0 && !convo.is_archived) {
                    count++;
                }
            });
            setUnreadConversationsCount(count);
        };

        if (isFocused) {
            fetchUnreadCount();
        }

        const channel = supabase
            .channel('public:conversations:unread_count')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations',
                filter: `participant_ids=cs.{"${user.id}"}`
            },
                payload => {
                    fetchUnreadCount();
                })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [user, isFocused]);

    const fetchListings = useCallback(async (currentPage: number, filter: string, dealType: string) => {
        if (currentPage === 0) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        const currentUser = session?.user;
        let data: any[] | null = null;
        const baseQuery = '*, users(fullName, profilePhotoUrl)';
        const from = currentPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        if (filter === 'Nearby') {
            if (currentPage > 0) {
                setLoadingMore(false);
                setHasMore(false);
                return;
            }
            try {
                let { status } = await Location.getForegroundPermissionsAsync();
                if (status !== 'granted') {
                    const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                    status = newStatus;
                }

                if (status !== 'granted') {
                    Alert.alert("Permission Denied", "Enable location services to find items nearby. Please enable it in your device settings.");
                    setListings([]); setLoading(false); return;
                }

                let location = await Location.getCurrentPositionAsync({});

                const { data: nearbyData, error: rpcError } = await supabase.rpc('nearby_listings_with_user', {
                    user_lat: location.coords.latitude,
                    user_lon: location.coords.longitude,
                });

                if (rpcError) throw rpcError;

                if (dealType !== 'All') {
                    data = nearbyData.filter((item: Listing) => item.price_type === dealType);
                } else {
                    data = nearbyData;
                }
                setHasMore(false);
            } catch (e: any) {
                Alert.alert("Location Error", e.message || "Could not get your current location. Make sure location services are enabled.");
                setListings([]);
            }
        } else {
            let queryBuilder = supabase.from('listings').select(baseQuery).range(from, to);

            if (dealType !== 'All') {
                queryBuilder = queryBuilder.eq('price_type', dealType);
            }

            if (filter === 'Following') {
                if (!currentUser) {
                    requireLogin(() => setActiveFilter('Following'));
                    setListings([]); setLoading(false); return;
                }
                const { data: follows, error: followsError } = await supabase.from('follows').select('following_id').eq('follower_id', currentUser.id);
                if (followsError || !follows || follows.length === 0) {
                    setListings([]); setLoading(false); setHasMore(false); return;
                }
                const followedUserIds = follows.map(f => f.following_id);
                queryBuilder = queryBuilder.in('user_id', followedUserIds).order('view_count', { ascending: false, nullsFirst: false });
            } else { 
                queryBuilder = queryBuilder.order('view_count', { ascending: false, nullsFirst: false });
            }

            const { data: queryData, error } = await queryBuilder;
            if (error) {
                console.error(`Error fetching listings for filter "${filter}":`, error);
            }
            data = queryData;
            if (!queryData || queryData.length < PAGE_SIZE) {
                setHasMore(false);
            }
        }

        if (data) {
            setListings(prev => currentPage === 0 ? (data as Listing[]) : [...prev, ...(data as Listing[])]);
        }
        setPage(currentPage + 1);
        setLoading(false);
        setLoadingMore(false);
    }, [session, requireLogin]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchListings(page, activeFilter, dealTypeFilter);
        }
    };

    const resetAndFetchListings = useCallback(() => {
        setPage(0);
        setListings([]);
        setHasMore(true);
        setTimeout(() => fetchListings(0, activeFilter, dealTypeFilter), 0);
    }, [activeFilter, dealTypeFilter, fetchListings]);


    const handleFilterChange = (filter: string) => {
        if (filter === 'Following' && !session?.user) {
            requireLogin(() => {
                setActiveFilter(filter);
            });
        } else {
            setActiveFilter(filter);
        }
    };

    const handleDealTypeChange = (newDealType: string) => {
        setDealTypeFilter(newDealType);
    };

    useEffect(() => {
        if (isFocused) {
            resetAndFetchListings();
        }
    }, [isFocused, activeFilter, dealTypeFilter, resetAndFetchListings]);


    const handleDropdownToggle = () => {
        dropdownRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
            setDropdownPosition({ x, y: y + height, width });
            setDropdownVisible(!isDropdownVisible);
        });
    };

    const fetchFavorites = useCallback(async () => {
        if (session?.user) {
            const { data } = await supabase.from('favorites').select('listing_id').eq('user_id', session.user.id);
            setFavoritedIds(new Set(data?.map(f => f.listing_id) || []));
        } else {
            setFavoritedIds(new Set());
        }
    }, [session]);

    useEffect(() => { if (isFocused) { fetchFavorites(); } }, [isFocused, session, fetchFavorites]);

    const handleToggleFavorite = useCallback((listingId: number) => {
        requireLogin(async () => {
            if (!session?.user) return;
            const currentUser = session.user;
            const isCurrentlyFavorited = favoritedIds.has(listingId);
            if (isCurrentlyFavorited) {
                setFavoritedIds(prev => { const next = new Set(prev); next.delete(listingId); return next; });
                await supabase.from('favorites').delete().match({ user_id: currentUser.id, listing_id: listingId });
            } else {
                setFavoritedIds(prev => new Set(prev.add(listingId)));
                await supabase.from('favorites').insert({ user_id: currentUser.id, listing_id: listingId });
            }
        });
    }, [requireLogin, session, favoritedIds]);

    const handleCategoryPress = (category: string) => {
        if (category === 'All') {
            setBrowseModalVisible(true);
        } else {
            router.push({
                pathname: `/search/[query]`,
                params: { query: category, searchType: 'item', category },
            });
        }
    };

    const handleSelectCategory = (category: string) => {
        setBrowseModalVisible(false);
        router.push({ pathname: `/search/[query]`, params: { query: category, searchType: 'item', category: category, }, });
    };

    const cardWidth = (width - 30) / 2;

    const renderItem = useCallback(({ item }: { item: Listing; }) => {
        let distanceString: string | undefined = undefined;
        if (activeFilter === 'Nearby' && item.distance_meters != null) {
            if (item.distance_meters < 1000) {
                distanceString = `${Math.round(item.distance_meters)}m away`;
            } else {
                distanceString = `${(item.distance_meters / 1000).toFixed(1)}km away`;
            }
        }

        return (
            <View style={{ width: cardWidth, marginBottom: 10 }}>
                <ProductCard
                    item={item}
                    isFavorited={favoritedIds.has(item.id)}
                    onToggleFavorite={handleToggleFavorite}
                    cardWidth={cardWidth}
                    distance={distanceString}
                />
            </View>
        );
    }, [activeFilter, favoritedIds, handleToggleFavorite]);
    
    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    };

    const dealTypeOptions: DropdownOption[] = [
        { label: 'All Deals', value: 'All' },
        { label: 'For Sale', value: 'For Sale' },
        { label: 'For Trade', value: 'For Trade' },
        { label: 'For Free', value: 'For Free' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={listings}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                key={activeFilter + dealTypeFilter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListHeaderComponent={
                    <ExploreHeader
                        onMessagesPress={() => requireLogin(() => setMessagesModalVisible(true))}
                        onFavoritesPress={() => requireLogin(() => setFavoritesModalVisible(true))}
                        onSearchPress={() => setSearchModalVisible(true)}
                        onBrowsePress={() => setBrowseModalVisible(true)}
                        onCategoryPress={handleCategoryPress}
                        unreadConversationsCount={unreadConversationsCount}
                        activeFilter={activeFilter}
                        onFilterChange={handleFilterChange}
                        dealTypeFilter={dealTypeFilter}
                        onDealTypeFilterPress={handleDropdownToggle}
                        dropdownRef={dropdownRef}
                    />
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
                    ) : (
                        <View style={styles.centered}>
                            <Text style={{ color: colors.text + '99' }}>No items found for these filters.</Text>
                        </View>
                    )
                }
                contentContainerStyle={styles.productList}
                columnWrapperStyle={styles.rowWrapper}
            />
            <DropdownList
                visible={isDropdownVisible}
                onClose={() => setDropdownVisible(false)}
                options={dealTypeOptions}
                selectedValue={dealTypeFilter}
                onSelect={handleDealTypeChange}
                position={dropdownPosition}
            />
            <BrowseCategoryModal visible={isBrowseModalVisible} onClose={() => setBrowseModalVisible(false)} onSelectCategory={handleSelectCategory} />
            <SearchModal visible={searchModalVisible} onClose={() => setSearchModalVisible(false)} />
            <MessagesModal visible={messagesModalVisible} onClose={() => setMessagesModalVisible(false)} />
            <FavoritesModal visible={favoritesModalVisible} onClose={() => setFavoritesModalVisible(false)} onUnfavorite={(id) => handleToggleFavorite(id)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 10 : 0,
    },
    headerIcon: { padding: 5, },
    searchBarContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, height: 40, borderRadius: 20, borderWidth: 1, marginHorizontal: 10, paddingHorizontal: 15, },
    searchIcon: {},
    searchInput: { flex: 1, fontSize: 16, marginLeft: 10, marginRight: 10, fontFamily: 'Poppins-Regular' },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Poppins-Bold',
        marginHorizontal: 15,
        marginTop: 20,
        marginBottom: 12,
    },
    productList: {
        paddingHorizontal: 10,
        paddingBottom: 100,
    },
    rowWrapper: {
        justifyContent: 'space-between',
    },
    categoriesCarousel: { paddingHorizontal: 15, paddingVertical: 10 },
    categoryCard: {
        width: 100,
        minHeight: 100,
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    categoryName: {
        fontSize: 12,
        fontFamily: 'Poppins-SemiBold',
        marginTop: 8,
        textAlign: 'center',
    },
    promoBanner: { marginHorizontal: 15, padding: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 20, },
    promoText: { fontSize: 16, fontFamily: 'Poppins-Regular', marginBottom: 5, },
    promoTitle: { fontSize: 28, fontFamily: 'Poppins-Bold', marginBottom: 10, },
    promoDate: { fontSize: 14, fontFamily: 'Poppins-Regular', marginBottom: 15, },
    learnMoreButton: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, },
    learnMoreButtonText: { fontSize: 14, fontFamily: 'Poppins-SemiBold', },
    filterTabsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 15, marginBottom: 5, borderBottomWidth: 1, },
    filterTab: { paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent', },
    filterTabText: { fontSize: 15, fontFamily: 'Poppins-SemiBold', },
    unreadIndicator: {
        position: 'absolute',
        top: 2,
        right: -2,
        backgroundColor: '#FF4136',
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    unreadIndicatorText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        paddingHorizontal: 4,
    },
    dealTypeFilterContainer: {
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 5,
    },
    dealTypeFilterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    dealTypeFilterText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        marginHorizontal: 8,
    },
    dropdownList: {
        position: 'absolute',
        borderRadius: 8,
        borderWidth: 1,
        maxHeight: 200,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dropdownItemText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
    },
});