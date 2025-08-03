// sdaw/app/search/[query].tsx

import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Listing, ProductCard } from '../../components/cards/ProductCard';
import { useAuth } from '../../components/context/AuthContext';
import CategoryModal from '../../components/modals/CategoryModal';
import { FilterModal, Filters } from '../../components/modals/FilterModal';
import { UserProfile } from '../../components/profile/AboutSection';
import { categoriesListData } from '../../constants/categories';
import { supabase } from '../../supabase';


type SearchResult = Listing | UserProfile;

const { width } = Dimensions.get('window');

const buildListingsQuery = (
  query: string,
  category: string,
  filters: Filters,
  followedUserIds?: string[]
) => {
    let queryBuilder = supabase.from('listings').select('*, users(fullName, profilePhotoUrl)');

    // Enhanced search logic for items
    if (query) {
        // Prepare the query for full-text search (e.g., "mini dress" -> "mini & dress")
        const ftsQuery = query.trim().split(' ').filter(Boolean).join(' & ');
        
        // **FIX:** Corrected the .or() filter string for full-text search and categories
        // Using `plfts` is safer as it handles query conversion.
        queryBuilder = queryBuilder.or(
            `item_name.ilike.%${query}%,fts.plfts.${ftsQuery},categories.cs.{${query}}`
        );
    }

    if (category !== 'All Categories' && category !== 'Following') {
        const mainCategory = categoriesListData.find(c => c.name === category);
        if (mainCategory) {
            const allCategories = [category, ...mainCategory.items];
            queryBuilder = queryBuilder.overlaps('categories', allCategories);
        } else {
            queryBuilder = queryBuilder.contains('categories', [category]);
        }
    }

    if (category === 'Following' && followedUserIds) {
        if (followedUserIds.length === 0) {
            queryBuilder = queryBuilder.eq('user_id', '00000000-0000-0000-0000-000000000000');
        } else {
            queryBuilder = queryBuilder.in('user_id', followedUserIds);
        }
    }

    if (filters.condition !== 'All') {
        queryBuilder = queryBuilder.eq('is_new', filters.condition === 'New');
    }

    if (filters.priceRange.min) {
        queryBuilder = queryBuilder.gte('price', parseInt(filters.priceRange.min, 10));
    }
    if (filters.priceRange.max) {
        queryBuilder = queryBuilder.lte('price', parseInt(filters.priceRange.max, 10));
    }

    const getSortOptions = (sortOption: string) => {
        switch (sortOption) {
            case 'Recent': return { column: 'created_at', ascending: false };
            case 'Price - High to Low': return { column: 'price', ascending: false };
            case 'Price - Low to High': return { column: 'price', ascending: true };
            default: return { column: 'created_at', ascending: false };
        }
    };
    const { column, ascending } = getSortOptions(filters.sortOption);
    queryBuilder = queryBuilder.order(column, { ascending });

    return queryBuilder;
};

export default function SearchResultsScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const params = useLocalSearchParams<{ query: string; searchType?: 'item' | 'user'; category?: string }>();
    const { session, requireLogin } = useAuth();

    const isPureCategorySearch = params.query === params.category;
    const [searchQuery, setSearchQuery] = useState(isPureCategorySearch ? '' : params.query || '');

    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(params.category || 'All Categories');
    const [filters, setFilters] = useState<Filters>({
        sortOption: 'Best Match',
        condition: 'All',
        priceRange: { min: '', max: '' }
    });
    const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());

    const cardWidth = (width - 32) / 2;
    const itemSpacing = 8;

    const performSearch = useCallback(async (query: string, category: string, currentFilters: Filters) => {
        setLoading(true);
        const effectiveQuery = query === category ? '' : query;

        try {
            if (params.searchType === 'user') {
                const { data, error } = await supabase
                    .from('users')
                    .select('id, fullName, username, profilePhotoUrl')
                    .or(`username.ilike.%${effectiveQuery}%,fullName.ilike.%${effectiveQuery}%`);
                if (error) throw error;
                setResults(data || []);
            } else {
                let followedUserIds: string[] | undefined = undefined;
                if (category === 'Following') {
                    if (!session?.user) {
                        requireLogin(() => {
                           setSelectedCategory('Following');
                           router.setParams({ query: 'Following', category: 'Following' });
                        });
                        setResults([]); setLoading(false); return;
                    }
                    const { data: follows, error: followsError } = await supabase.from('follows').select('following_id').eq('follower_id', session.user.id);
                    if (followsError) throw followsError;
                    followedUserIds = follows?.map(f => f.following_id) || [];
                }

                const queryBuilder = buildListingsQuery(effectiveQuery, category, currentFilters, followedUserIds);
                const { data, error } = await queryBuilder;

                if (error) {
                    console.error("Search query error:", error); // Log the actual error for debugging
                    throw error;
                }
                setResults(data || []);
            }
        } catch (error: any) {
            Alert.alert("Search Error", "Could not perform the search.");
        } finally {
            setLoading(false);
        }
    }, [params.searchType, session, requireLogin]);

    useEffect(() => {
        const getFavorites = async () => {
            if (session?.user) {
                const { data, error } = await supabase
                    .from('favorites')
                    .select('listing_id')
                    .eq('user_id', session.user.id);
                if (!error && data) setFavoritedIds(new Set(data.map(f => f.listing_id)));
            }
        };
        getFavorites();
    }, [session]);

    useEffect(() => {
        performSearch(params.query || '', params.category || 'All Categories', filters);
    }, [params.query, params.category, filters, performSearch]);

    useEffect(() => {
        setSelectedCategory(params.category || 'All Categories');
        const isCatSearch = params.query === params.category;
        setSearchQuery(isCatSearch ? '' : params.query || '');
    }, [params.category, params.query]);

    const handleSearchSubmit = () => {
        router.setParams({ query: searchQuery || selectedCategory, category: selectedCategory });
    };

    const handleUserPress = (user: UserProfile) => {
        if (session?.user?.id === user.id) {
            router.push('/my-profile');
        } else {
            router.push({ pathname: '/user/[id]', params: { id: user.id } });
        }
    };

    const handleSelectCategory = (category: string) => {
        setCategoryModalVisible(false);
        router.setParams({ query: category, category: category });
    };

    const handleApplyFilters = (newFilters: Filters) => {
        setFilters(newFilters);
        setFilterModalVisible(false);
    };

    const handleToggleFavorite = async (listingId: number, isCurrentlyFavorited: boolean) => {
        requireLogin(async () => {
            if (!session?.user) return;
            if (isCurrentlyFavorited) {
                setFavoritedIds(prev => {
                    const next = new Set(prev);
                    next.delete(listingId);
                    return next;
                });
                await supabase.from('favorites').delete().match({ user_id: session.user.id, listing_id: listingId });
            } else {
                setFavoritedIds(prev => new Set(prev.add(listingId)));
                await supabase.from('favorites').insert({ user_id: session.user.id, listing_id: listingId });
            }
        });
    };

    const renderItem = ({ item }: { item: SearchResult }) => {
        if (params.searchType === 'user') {
            const user = item as UserProfile;
            return (
                <TouchableOpacity
                    style={[styles.userCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
                    onPress={() => handleUserPress(user)}
                >
                    <Image source={{uri: user.profilePhotoUrl}} style={styles.userAvatar}/>
                    <View style={styles.userInfo}>
                        <Text style={[styles.userUsername, {color: colors.text}]}>{user.username}</Text>
                        <Text style={[styles.userFullName, {color: colors.text+'99'}]}>{user.fullName}</Text>
                    </View>
                </TouchableOpacity>
            );
        }
        return (
            <View style={{ width: cardWidth, marginRight: itemSpacing, marginBottom: itemSpacing }}>
                <ProductCard
                    item={item as Listing}
                    isFavorited={favoritedIds.has((item as Listing).id)}
                    onToggleFavorite={() => handleToggleFavorite((item as Listing).id, favoritedIds.has((item as Listing).id))}
                    cardWidth={cardWidth}
                />
            </View>
        );
    };

    const NoResultsView = () => (
        <View style={styles.noResultsContainer}>
            <FontAwesome name="search" size={80} color={colors.text + '30'} />
            <Text style={[styles.noResultsTitle, {color: colors.text}]}>No results found</Text>
            <Text style={[styles.noResultsSubtitle, {color: colors.text+'99'}]}>Try different keywords or filters.</Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                    <FontAwesome name="arrow-left" size={22} color={colors.text} />
                </TouchableOpacity>
                <View style={[styles.searchBar, {backgroundColor: colors.background, borderColor: colors.border}]}>
                    <FontAwesome name="search" size={18} color={colors.text+'99'} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={[styles.searchInput, {color: colors.text}]}
                        placeholder={selectedCategory !== 'All Categories' ? `Search in ${selectedCategory}...` : 'Search...'}
                        placeholderTextColor={colors.text + '99'}
                        returnKeyType='search'
                        onSubmitEditing={handleSearchSubmit}
                    />
                </View>
            </View>

            {params.searchType !== 'user' && (
                <View style={[styles.filterBar, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setCategoryModalVisible(true)}
                    >
                        <Text style={{color: colors.text}}>{selectedCategory}</Text>
                        <FontAwesome name="chevron-down" size={12} color={colors.text+'99'} style={{marginLeft: 5}}/>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setFilterModalVisible(true)}
                    >
                        <FontAwesome name="sliders" size={18} color={colors.text} style={{marginRight: 5}}/>
                        <Text style={{color: colors.text}}>Filters</Text>
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={results}
                    renderItem={renderItem}
                    keyExtractor={(item) => String(item.id)}
                    numColumns={params.searchType === 'user' ? 1 : 2}
                    ListEmptyComponent={NoResultsView}
                    contentContainerStyle={styles.listContainer}
                    columnWrapperStyle={params.searchType !== 'user' ? {
                        justifyContent: 'flex-start',
                    } : undefined}
                />
            )}

            <CategoryModal
                visible={isCategoryModalVisible}
                onClose={() => setCategoryModalVisible(false)}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                categories={categoriesListData}
            />
            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                initialFilters={filters}
                onApplyFilters={handleApplyFilters}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 10 : 0,
        paddingBottom: 10,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1
    },
    headerIcon: { paddingHorizontal: 5 },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Platform.OS === 'ios' ? 10 : 5,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 10,
        marginHorizontal: 10
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        paddingVertical: 0,
    },
    filterBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        borderBottomWidth: 1
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    listContainer: {
        paddingHorizontal: 8,
        paddingTop: 10,
        paddingBottom: 20
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 50,
        gap: 15
    },
    noResultsTitle: {
        fontSize: 20,
        fontWeight: '600'
    },
    noResultsSubtitle: {
        fontSize: 16,
        textAlign: 'center'
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        width: '100%'
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15
    },
    userInfo: {
        flex: 1
    },
    userUsername: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    userFullName: {
        fontSize: 14,
        marginTop: 2
    },
});