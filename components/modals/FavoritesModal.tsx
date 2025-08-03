// sdaw/components/modals/FavoritesModal.tsx
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { supabase } from '../../supabase';
import { Listing } from '../cards/ProductCard';

interface FavoritesModalProps {
    visible: boolean;
    onClose: () => void;
    onUnfavorite: (listingId: number) => void;
}

// Animated Item Component for staggered list animation
const AnimatedFavoriteItem = ({ index, children }: { index: number, children: React.ReactNode }) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(25);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    useEffect(() => {
        // Staggered animation for each item
        opacity.value = withDelay(index * 100, withTiming(1, { duration: 400 }));
        translateY.value = withDelay(index * 100, withTiming(0, { duration: 400 }));
    }, [opacity, translateY, index]);

    return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

export const FavoritesModal = ({ visible, onClose, onUnfavorite }: FavoritesModalProps) => {
    const { colors } = useTheme();
    const router = useRouter();
    const [favoritedItems, setFavoritedItems] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!visible) return;

        const fetchFavoritedItems = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                setFavoritedItems([]);
                return;
            }

            const { data: favoriteRelations, error: favError } = await supabase
                .from('favorites')
                .select('listing_id')
                .eq('user_id', user.id);

            if (favError || !favoriteRelations || favoriteRelations.length === 0) {
                setFavoritedItems([]);
                setLoading(false);
                return;
            }

            const listingIds = favoriteRelations.map(fav => fav.listing_id);

            const { data: listingsData, error: listingsError } = await supabase
                .from('listings')
                .select('*')
                .in('id', listingIds);

            if (listingsError) {
                console.error("Error fetching favorited listings:", listingsError);
                setFavoritedItems([]);
            } else {
                setFavoritedItems(listingsData || []);
            }
            setLoading(false);
        };

        fetchFavoritedItems();
    }, [visible]);

    const handleItemPress = (listingId: number) => {
        onClose();
        router.push({ pathname: "/listing/[id]", params: { id: String(listingId) } });
    };

    const handleUnfavoriteInModal = (listingId: number) => {
        setFavoritedItems(prevItems => prevItems.filter(item => item.id !== listingId));
        onUnfavorite(listingId);
    };

    const renderFavoriteItem = ({ item, index }: { item: Listing, index: number }) => (
        <AnimatedFavoriteItem index={index}>
            <TouchableOpacity 
                style={[styles.favoriteCard, { backgroundColor: colors.card, shadowColor: colors.text }]} 
                onPress={() => handleItemPress(item.id)}
                activeOpacity={0.8}
            >
                <Image source={{ uri: item.image_urls[0] }} style={styles.favoriteImage} />
                <View style={styles.favoriteContent}>
                    <Text style={[styles.favoriteItemName, { color: colors.text }]} numberOfLines={1}>{item.item_name}</Text>
                    <Text style={[styles.favoritePrice, { color: colors.primary }]}>PHP {item.price || '0'}</Text>
                </View>
                <TouchableOpacity style={styles.unfavoriteButton} onPress={() => handleUnfavoriteInModal(item.id)}>
                    <FontAwesome name="heart" size={18} color={colors.primary} />
                </TouchableOpacity>
            </TouchableOpacity>
        </AnimatedFavoriteItem>
    );

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <Pressable style={styles.modalBackdrop} onPress={onClose}>
                <Pressable style={[styles.modalContainer]} onStartShouldSetResponder={() => true}>
                    <LinearGradient colors={['#FFFFFF', '#F7F7F7']} style={StyleSheet.absoluteFill} />
                    <View style={styles.grabber} />
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Favorites</Text>
                        <TouchableOpacity onPress={onClose}><FontAwesome name="close" size={24} color={colors.text+'99'} /></TouchableOpacity>
                    </View>
                    {loading ? (
                        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
                    ) : favoritedItems.length > 0 ? (
                        <FlatList 
                            data={favoritedItems} 
                            renderItem={renderFavoriteItem} 
                            keyExtractor={(item) => item.id.toString()} 
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 16, paddingBottom: 50 }} 
                        />
                    ) : (
                        <View style={styles.centered}>
                            <FontAwesome name="heart-o" size={60} color={colors.text + '30'}/>
                            <Text style={styles.emptyTextTitle}>No Favorites Yet</Text>
                            <Text style={[styles.emptyTextSubtitle, { color: colors.text+'99' }]}>Tap the heart on any item to save it here.</Text>
                        </View>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContainer: { height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
    grabber: { width: 40, height: 5, borderRadius: 2.5, backgroundColor: '#ccc', alignSelf: 'center', marginTop: 10, marginBottom: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontFamily: 'Poppins-Bold', fontSize: 24, },
    favoriteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginVertical: 8,
        borderRadius: 16,
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 4,
    },
    favoriteImage: { width: 65, height: 65, borderRadius: 12, marginRight: 15 },
    favoriteContent: { flex: 1 },
    favoriteItemName: { fontFamily: 'Poppins-SemiBold', fontSize: 16, marginBottom: 6 },
    favoritePrice: { fontFamily: 'Poppins-Bold', fontSize: 15, },
    unfavoriteButton: { padding: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20, },
    emptyTextTitle: { fontFamily: 'Poppins-Bold', fontSize: 18, marginTop: 20, },
    emptyTextSubtitle: { fontFamily: 'Poppins-Regular', fontSize: 15, textAlign: 'center', marginTop: 8, },
});