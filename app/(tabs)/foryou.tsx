// Isabellalito/app/(tabs)/foryou.tsx

import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useCallback, useState } from 'react';
import {
    Dimensions,
    FlatList,
    LayoutAnimation,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Listing, ProductCard } from '../../components/cards/ProductCard';
import { useAuth } from '../../components/context/AuthContext';
import { supabase } from '../../supabase';

// Define types and interfaces
type TabName = 'All' | 'Nearby' | 'Following' | string;

interface Category {
    category: string;
}

// SkeletonCard Component
const SkeletonCard = ({ width }: { width: number }) => {
    const { colors } = useTheme();
    return (
        <View style={{ width, height: 200, backgroundColor: colors.border, marginBottom: 10, borderRadius: 10 }} />
    );
};

// ListingsGrid Component
const ListingsGrid = ({ listings, activeTab, cardWidth, refreshing, onRefresh }: {
    listings: Listing[];
    activeTab: TabName;
    cardWidth: number;
    refreshing: boolean;
    onRefresh: () => void;
}) => {
    const pairedListings: Listing[][] = [];
    for (let i = 0; i < listings.length; i += 2) {
        pairedListings.push(listings.slice(i, i + 2));
    }

    const renderProductRow = ({ item: pair }: { item: Listing[] }) => {
        const renderCard = (item: Listing | undefined) => {
            if (!item) {
                return <View style={{ width: cardWidth }} />;
            }
            let distanceString: string | undefined;
            if (activeTab === 'Nearby' && item.distance_meters != null) {
                distanceString = item.distance_meters < 1000
                    ? `${Math.round(item.distance_meters)}m away`
                    : `${(item.distance_meters / 1000).toFixed(1)}km away`;
            }
            return (
                <View style={{ width: cardWidth }}>
                    <ProductCard item={item} cardWidth={cardWidth} distance={distanceString} />
                </View>
            );
        };

        return (
            <View style={styles.row}>
                {renderCard(pair[0])}
                {renderCard(pair[1])}
            </View>
        );
    };

    return (
        <FlatList
            data={pairedListings}
            keyExtractor={(item, index) => `${item[0]?.id ?? 'empty'}-${index}`}
            renderItem={renderProductRow}
            contentContainerStyle={styles.mainListContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
    );
};

// DynamicTabs Component
const DynamicTabs = ({ tabs, activeTab, onTabPress }: {
    tabs: TabName[];
    activeTab: TabName;
    onTabPress: (tab: TabName) => void;
}) => {
    const { colors } = useTheme();
    return (
        <View style={styles.tabsWrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 10 }}
            >
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && { backgroundColor: colors.primary }]}
                        onPress={() => onTabPress(tab)}
                    >
                        <Text style={[styles.tabText, { color: activeTab === tab ? '#fff' : colors.text }]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

// Main ForYouScreen Component
export default function ForYouScreen() {
    const { colors } = useTheme();
    const { session, requireLogin } = useAuth();
    const [activeTab, setActiveTab] = useState<TabName>('All');
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const width = Dimensions.get('window').width;
    const itemSpacing = 10;
    const cardWidth = (width - (itemSpacing * 3)) / 2;
    const tabs: TabName[] = ['All', 'Nearby', 'Following', ...suggestedCategories];

    const fetchListingsForTab = useCallback(async (tab: TabName, topCategories: string[] = []) => {
        setLoading(true);
        setError(null);
        try {
            if (!session?.user) {
                if (tab === 'Following' || tab === 'All') {
                    requireLogin(() => setActiveTab(tab));
                }
                setListings([]);
                return;
            }

            let response: { data: any[] | null; error: any } = { data: null, error: null };

            switch (tab) {
                case 'All':
                    {
                        const { data: likedData, error: likedError } = await supabase
                            .from('favorites')
                            .select('listing_id')
                            .eq('user_id', session.user.id);

                        if (likedError) throw new Error('Could not fetch liked items.');
                        const likedListingIds = likedData?.map(f => f.listing_id) || [];
                        
                        const { data: likedListings, error: likedListingsError } = await supabase
                            .from('listings')
                            .select('*, users(*)')
                            .in('id', likedListingIds)
                            .neq('user_id', session.user.id);
                        
                        if (likedListingsError) throw new Error('Could not fetch liked listings details.');

                        let recommendedListings: Listing[] = [];
                        if (topCategories.length > 0) {
                            const { data: recData, error: recError } = await supabase
                                .from('listings')
                                .select('*, users(*)')
                                .contains('categories', topCategories)
                                .neq('user_id', session.user.id)
                                .limit(50);
                            
                            if (recError) throw new Error('Could not fetch recommendations.');
                            recommendedListings = recData || [];
                        }

                        const combined = [...(likedListings || []), ...recommendedListings];
                        const uniqueListings = Array.from(new Map(combined.map(item => [item.id, item])).values());
                        
                        response = { data: uniqueListings, error: null };
                    }
                    break;
                case 'Nearby':
                    {
                        let { status } = await Location.getForegroundPermissionsAsync();
                        if (status !== 'granted') {
                            const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                            status = newStatus;
                        }

                        if (status !== 'granted') {
                            throw new Error('Permission to access location was denied. Please enable it in your device settings.');
                        }

                        const location = await Location.getCurrentPositionAsync({});
                        
                        response = await supabase.rpc('nearby_listings_with_user', {
                            user_lat: location.coords.latitude,
                            user_lon: location.coords.longitude,
                        });
                    }
                    break;
                case 'Following':
                    {
                        const { data: follows, error: followsError } = await supabase
                            .from('follows')
                            .select('following_id')
                            .eq('follower_id', session.user.id);

                        if (followsError) throw new Error('Error fetching follows');
                        
                        const followedUserIds = follows?.map(f => f.following_id) || [];
                        if (followedUserIds.length === 0) {
                            setListings([]);
                            return;
                        }
                        response = await supabase
                            .from('listings')
                            .select('*, users(*)')
                            .in('user_id', followedUserIds)
                            .order('created_at', { ascending: false });
                    }
                    break;
                default:
                    response = await supabase
                        .from('listings')
                        .select('*, users(*)')
                        .contains('categories', [tab]);
                    break;
            }

            const { data, error } = response;
            if (error) {
                throw new Error(`Error fetching listings for ${tab}: ${error.message}`);
            }
            setListings(data || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    }, [session, requireLogin]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (session?.user) {
                const fetchSuggestionsAndListings = async () => {
                    setLoading(true);
                    const { data: favs, error: favsError } = await supabase.from('favorites').select('listing_id').eq('user_id', session.user.id);
                    const { data: views, error: viewsError } = await supabase.from('listing_views').select('listing_id').eq('user_id', session.user.id);

                    if (favsError || viewsError) {
                        setError('Could not fetch user interactions.');
                        setLoading(false);
                        return;
                    }
                    
                    const interactionIds = [...new Set([...(favs?.map(f => f.listing_id) || []), ...(views?.map(v => v.listing_id) || [])])];

                    let topCategories: string[] = [];
                    if (interactionIds.length > 0) {
                        const { data: interactedListings, error: catError } = await supabase.from('listings').select('categories').in('id', interactionIds);
                        
                        if (catError) {
                            setError('Could not fetch categories for suggestions.');
                            setLoading(false);
                            return;
                        }
                        
                        const allCategories = interactedListings?.flatMap(l => l.categories) || [];
                        const categoryCounts: { [key: string]: number } = allCategories.reduce((acc, cat) => {
                            acc[cat] = (acc[cat] || 0) + 1;
                            return acc;
                        }, {} as { [key: string]: number });

                        topCategories = Object.entries(categoryCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(e => e[0]);
                        
                        setSuggestedCategories(topCategories);
                    } else {
                        setSuggestedCategories([]);
                    }
                    
                    await fetchListingsForTab(activeTab, topCategories);
                    
                    setLoading(false);
                    if (refreshing) setRefreshing(false);
                };
                
                fetchSuggestionsAndListings();

            } else {
                setLoading(false);
                setListings([]);
                setSuggestedCategories([]);
                 if (refreshing) setRefreshing(false);
            }
        }, [session, activeTab, fetchListingsForTab, refreshing])
    );

    const handleTabPress = (tab: TabName) => {
        if (tab === 'Following' && !session) {
            requireLogin(() => setActiveTab('Following'));
            return;
        }
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveTab(tab);
    };

    const renderListContent = () => {
        if (loading && !refreshing) {
            return (
                <View style={styles.mainListContainer}>
                    {[...Array(3)].map((_, rowIndex) => (
                        <View key={rowIndex} style={styles.row}>
                            <SkeletonCard width={cardWidth} />
                            <SkeletonCard width={cardWidth} />
                        </View>
                    ))}
                </View>
            );
        }
        if (error) {
            return (
                <View style={styles.centered}>
                    <Text style={{ color: colors.text }}>{error}</Text>
                    <TouchableOpacity onPress={() => fetchListingsForTab(activeTab)}>
                        <Text style={{ color: colors.primary, marginTop: 10 }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        if (listings.length === 0) {
            return (
                <ScrollView contentContainerStyle={styles.centered} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                    <Text style={{ color: colors.text + '99' }}>No items to show.</Text>
                    {!session && (
                        <TouchableOpacity onPress={() => requireLogin(() => {})}>
                            <Text style={{ color: colors.primary, marginTop: 10 }}>Login to see recommendations</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            );
        }
        return (
            <ListingsGrid
                listings={listings}
                activeTab={activeTab}
                cardWidth={cardWidth}
                refreshing={refreshing}
                onRefresh={onRefresh}
            />
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Curated For You</Text>
                </View>
                <View style={[styles.messageBanner, { backgroundColor: colors.primary + '1A' }]}>
                    <FontAwesome name="lightbulb-o" size={24} color={colors.primary} style={styles.messageBannerIcon} />
                    <Text style={[styles.messageBannerText, { color: colors.text }]}>
                        Browse freely! We’ll keep showing what we think you'll like 😄
                    </Text>
                </View>
                <DynamicTabs tabs={tabs} activeTab={activeTab} onTabPress={handleTabPress} />
            </View>
            <View style={styles.listContainer}>
                {renderListContent()}
            </View>
        </SafeAreaView>
    );
}

// Styles
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    messageBanner: {
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    messageBannerIcon: {
        marginBottom: 12,
    },
    messageBannerText: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 24,
        textAlign: 'center',
    },
    tabsWrapper: {
        marginBottom: 20,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginRight: 10,
    },
    tabText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    listContainer: {
        flex: 1,
    },
    mainListContainer: {
        paddingHorizontal: 10,
        paddingBottom: 100,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});