import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';
import { useAuth } from '../context/AuthContext';

export type Listing = {
  id: number;
  created_at: string;
  item_name: string;
  description: string;
  price: number | null;
  price_type: 'For Sale' | 'For Trade' | 'For Free';
  categories: string[];
  is_new: boolean;
  deal_method: string;
  image_urls: string[];
  user_id: string;
  users: {
      fullName: string;
      profilePhotoUrl: string;
  } | null;
  view_count?: number;
  click_count?: number;
  distance_meters?: number;
  status?: 'active' | 'reserved' | 'sold';
};

interface ProductCardProps {
    item: Listing;
    isFavorited?: boolean;
    onToggleFavorite?: (id: number) => void;
    cardWidth?: number;
    distance?: string;
    isOwnerView?: boolean;
    favoriteCount?: number;
    showMetrics?: boolean;
}

const { width } = Dimensions.get('window');

const ProductCardComponent = ({ item, isFavorited = false, onToggleFavorite, cardWidth, distance, isOwnerView = false, favoriteCount = 0, showMetrics = false }: ProductCardProps) => {
    const theme = useTheme();
    const { colors } = theme;
    const { session } = useAuth();

    const defaultCardWidth = (width / 2) - 24;
    const finalCardWidth = cardWidth || defaultCardWidth;

    const router = useRouter();
    const placeholderImage = 'https://via.placeholder.com/150';
    const imageUrl = item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : placeholderImage;

    const handleFavoritePress = () => {
        if (onToggleFavorite) {
            onToggleFavorite(item.id);
        }
    }

    const handleCardPress = async () => {
        if (session?.user?.id !== item.user_id) {
            await supabase.rpc('increment_click_count', { listing_id_param: item.id });
        }
        router.push({ pathname: "/listing/[id]", params: { id: String(item.id) } });
    };

    const getDealTypeRibbon = () => {
        if (!item.price_type) return null;

        const ribbonStyles = {
            'For Sale': { backgroundColor: '#4A5568', text: 'For Sale' },
            'For Trade': { backgroundColor: '#2f80ed', text: 'For Trade' },
            'For Free': { backgroundColor: '#27ae60', text: 'For Free' },
        };

        const style = ribbonStyles[item.price_type];
        if (!style) return null;

        return (
            <View style={[styles.cornerRibbon, { backgroundColor: style.backgroundColor }]}>
                <Text style={styles.cornerRibbonText}>{style.text}</Text>
            </View>
        );
    };

    const getStatusTag = () => {
        if (!isOwnerView || !item.status || item.status === 'active') return null;

        const statusStyles = {
            reserved: { backgroundColor: '#FF851B', label: 'Reserved' },
            sold: { backgroundColor: '#666666', label: 'Sold' },
        };
        const style = statusStyles[item.status as keyof typeof statusStyles];

        if (!style) return null;

        return (
            <View style={[styles.statusTag, { backgroundColor: style.backgroundColor }]}>
                <Text style={styles.dealTagText}>{style.label}</Text>
            </View>
        );
    };

    let priceText: string;
    switch (item.price_type) {
        case 'For Sale':
            priceText = item.price ? `PHP ${item.price}` : 'PHP 0';
            break;
        case 'For Trade':
        case 'For Free':
            priceText = 'PHP 0';
            break;
        default:
            priceText = 'N/A';
    }

    return (
        <Pressable
            onPress={handleCardPress}
            style={({ pressed }) => [
                styles.productCardContainer,
                { width: finalCardWidth },
                pressed && { transform: [{ scale: 0.98 }] }
            ]}
        >
            <View style={[
                styles.cardInner,
                {
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    borderColor: isOwnerView ? colors.primary : 'transparent',
                    borderWidth: isOwnerView ? 2 : 0,
                }
            ]}>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                    {getDealTypeRibbon()}
                    {getStatusTag()}
                </View>
                <View style={styles.productInfo}>
                    <Text
                        style={[styles.productName, { color: colors.text }]}
                        numberOfLines={1}
                    >
                        {item.item_name}
                    </Text>
                    <Text style={[styles.productPrice, { color: colors.primary }]}>
                        {priceText}
                    </Text>
                    {distance && (
                        <View style={styles.distanceContainer}>
                            <FontAwesome name="map-marker" size={12} color={(colors as any).textSecondary} />
                            <Text style={[styles.distanceText, { color: (colors as any).textSecondary }]}>
                                {distance}
                            </Text>
                        </View>
                    )}

                    {isOwnerView || showMetrics ? (
                        <View style={[styles.performanceMetrics, { borderTopColor: colors.border }]}>
                            <View style={styles.metricItem}>
                                <FontAwesome name="eye" size={12} color={(colors as any).textSecondary} />
                                <Text style={[styles.metricText, { color: (colors as any).textSecondary }]}>{item.view_count || 0}</Text>
                            </View>
                            <View style={styles.metricItem}>
                                <FontAwesome name="heart" size={12} color={(colors as any).textSecondary} />
                                <Text style={[styles.metricText, { color: (colors as any).textSecondary }]}>{favoriteCount}</Text>
                            </View>
                            <View style={styles.metricItem}>
                                <FontAwesome name="mouse-pointer" size={12} color={(colors as any).textSecondary} />
                                <Text style={[styles.metricText, { color: (colors as any).textSecondary }]}>{item.click_count || 0}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.sellerInfo, { borderTopColor: colors.border }]}>
                            <Image
                                source={{ uri: item.users?.profilePhotoUrl }}
                                style={styles.sellerAvatar}
                            />
                            <Text
                                style={[styles.sellerName, { color: (colors as any).textSecondary }]}
                                numberOfLines={1}
                            >
                                {item.users?.fullName}
                            </Text>
                        </View>
                    )}
                </View>

                {onToggleFavorite && !isOwnerView && (
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={handleFavoritePress}
                    >
                        <FontAwesome
                            name={isFavorited ? "heart" : "heart-o"}
                            size={18}
                            color={isFavorited ? colors.primary : colors.text}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </Pressable>
    );
};

export const ProductCard = React.memo(ProductCardComponent);

const styles = StyleSheet.create({
    productCardContainer: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
    },
    cardInner: {
        overflow: 'hidden'
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 1
    },
    productImage: {
        width: '100%',
        height: '100%'
    },
    productInfo: {
        width: '100%',
        padding: 10
    },
    productName: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold'
    },
    productPrice: {
        fontSize: 15,
        fontFamily: 'Poppins-Bold',
        marginTop: 2
    },
    distanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    distanceText: {
        marginLeft: 5,
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
    },
    favoriteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 20,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1
    },
    sellerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
    },
    sellerAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 6,
    },
    sellerName: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        flex: 1,
    },
    performanceMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    metricText: {
        marginLeft: 5,
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
    },
    cornerRibbon: {
        position: 'absolute',
        top: 10,
        left: -30,
        transform: [{ rotate: '-45deg' }],
        paddingVertical: 5,
        paddingHorizontal: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2, },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    cornerRibbonText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 12,
    },
    statusTag: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        zIndex: 1,
    },
    dealTagText: {
        color: '#fff',
        fontSize: 11,
        fontFamily: 'Poppins-Bold'
    },
});